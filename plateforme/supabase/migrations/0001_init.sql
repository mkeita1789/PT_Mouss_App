-- ═══════════════════════════════════════════════
-- PT Mouss IA — schéma initial
-- À coller dans Supabase → SQL Editor → Run (une seule fois).
-- (Déjà appliqué sur le projet Supabase « ptmouss ».)
--
-- Principe de sécurité (Row Level Security) :
--   • un client ne lit / n'écrit QUE ses propres lignes ;
--   • le coach (profiles.role = 'coach') LIT tout, n'écrit rien chez les clients ;
--   • personne ne peut se donner le rôle coach depuis l'appli.
-- ═══════════════════════════════════════════════

-- ─── Profils ───────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  prenom      text not null default '',
  role        text not null default 'client' check (role in ('client', 'coach')),
  created_at  timestamptz not null default now()
);

-- Profil créé automatiquement à l'inscription (prénom passé dans les métadonnées)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, prenom)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'prenom', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Le coach est-il l'utilisateur connecté ? (security definer : évite la récursion RLS)
-- Rangée dans un schéma privé : non exposée par l'API REST.
create schema if not exists private;
grant usage on schema private to authenticated;
create function private.is_coach()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'coach'
  );
$$;

-- ─── Bilan (une ligne par client) ──────────────
create table public.bilans (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  reponses    jsonb not null,
  debut       timestamptz not null default now(),  -- départ du cycle de phases
  updated_at  timestamptz not null default now()
);

-- ─── Check-in du jour ──────────────────────────
create table public.checkins (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  jour      date not null,
  sommeil   text not null,
  energie   text not null,
  corps     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, jour)
);

-- ─── Séances ───────────────────────────────────
create table public.seances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  realisee_le  timestamptz not null default now(),
  jour_code    text not null,        -- "DAY 1", "PUSH", "FULL BODY A"…
  focus        text,
  phase        text,                 -- "HYPERTROPHY", "DELOAD"… (null hors cycle)
  allegee      boolean not null default false
);
create index seances_user_date on public.seances (user_id, realisee_le desc);

create table public.seance_exercices (
  id          uuid primary key default gen_random_uuid(),
  seance_id   uuid not null references public.seances (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  position    int  not null,
  nom         text not null,
  categorie   text not null default '-' check (categorie in ('S', 'A', 'P', '-')),
  charge_kg   numeric(6, 2) check (charge_kg is null or (charge_kg >= 0 and charge_kg <= 1000)),
  series      int  not null default 0 check (series >= 0 and series <= 20),
  amrap       int  check (amrap is null or (amrap >= 0 and amrap <= 100)),
  cible       int,
  note        text check (note is null or char_length(note) <= 500)
);
create index seance_ex_user_nom on public.seance_exercices (user_id, nom);
create index seance_ex_seance on public.seance_exercices (seance_id);

-- ═══ Row Level Security ════════════════════════
alter table public.profiles          enable row level security;
alter table public.bilans            enable row level security;
alter table public.checkins          enable row level security;
alter table public.seances           enable row level security;
alter table public.seance_exercices  enable row level security;

-- Profils : chacun lit le sien, le coach lit tout ; on ne modifie que son prénom
create policy "profil: lecture" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_coach()));
create policy "profil: modification du sien" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (prenom) on public.profiles to authenticated;   -- le rôle n'est PAS modifiable

-- Tables du client : propriétaire = tout, coach = lecture
do $$
declare t text;
begin
  foreach t in array array['bilans', 'checkins', 'seances', 'seance_exercices'] loop
    execute format(
      'create policy "%1$s: lecture" on public.%1$I for select to authenticated
         using (user_id = (select auth.uid()) or (select private.is_coach()))', t);
    execute format(
      'create policy "%1$s: ajout" on public.%1$I for insert to authenticated
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: modification" on public.%1$I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: suppression" on public.%1$I for delete to authenticated
         using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Un exercice ne peut être rattaché qu'à une séance du même client
create function public.check_seance_owner()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.seances s where s.id = new.seance_id and s.user_id = new.user_id) then
    raise exception 'séance inconnue';
  end if;
  return new;
end;
$$;
create trigger seance_ex_owner
  before insert or update on public.seance_exercices
  for each row execute function public.check_seance_owner();

-- Fonctions internes : non appelables directement via l'API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_seance_owner() from public, anon, authenticated;
revoke execute on function private.is_coach() from public, anon;
grant execute on function private.is_coach() to authenticated;

-- ═══ Devenir coach (à lancer UNE fois, avec TON email, après t'être inscrit) ═══
-- update public.profiles set role = 'coach'
--   where id = (select id from auth.users where email = 'ton-email@exemple.com');
