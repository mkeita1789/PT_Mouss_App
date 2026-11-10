-- ═══════════════════════════════════════════════
-- Baara — métiers et lien professionnel ↔ sportif
--
-- • profiles.metier : qui est la personne (sert à l'accueil et aux onglets).
--   Il est choisi par l'utilisateur : il ne donne AUCUN droit sur les données.
-- • suivis : seul lien qui relie un professionnel à un sportif. Il se crée
--   quand le sportif entre le code du professionnel (ou s'inscrit avec son lien).
--   Chacun des deux peut le rompre.
-- Tout est ajouté à côté de l'existant : rien ne change pour le coach actuel.
-- ═══════════════════════════════════════════════

alter table public.profiles
  add column metier text not null default 'sportif'
  check (metier in ('sportif', 'joueur', 'coach', 'prepa', 'entraineur', 'kine', 'osteo'));
update public.profiles set metier = 'coach' where role = 'coach';
grant update (metier) on public.profiles to authenticated;

-- ─── Lien professionnel ↔ sportif ───
create table public.suivis (
  pro_id      uuid not null references public.profiles (id) on delete cascade,
  sportif_id  uuid not null references public.profiles (id) on delete cascade,
  -- métier du professionnel au moment où le sportif l'a accepté
  metier_pro  text not null check (metier_pro in ('coach', 'prepa', 'entraineur', 'kine', 'osteo')),
  cree_le     timestamptz not null default now(),
  primary key (pro_id, sportif_id),
  check (pro_id <> sportif_id)
);
create index suivis_sportif on public.suivis (sportif_id);
alter table public.suivis enable row level security;

create policy "suivis: lecture par les deux parties" on public.suivis
  for select to authenticated
  using (pro_id = (select auth.uid()) or sportif_id = (select auth.uid()) or (select private.is_coach()));
create policy "suivis: rupture par l'une des deux parties" on public.suivis
  for delete to authenticated
  using (pro_id = (select auth.uid()) or sportif_id = (select auth.uid()));
-- Pas de politique d'ajout : un lien ne se crée que par rejoindre() ou à l'inscription.

-- ─── Code d'invitation (un par professionnel) ───
create table public.invitations (
  code     text primary key check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  pro_id   uuid not null unique references public.profiles (id) on delete cascade,
  cree_le  timestamptz not null default now()
);
alter table public.invitations enable row level security;
create policy "invitations: lecture du sien" on public.invitations
  for select to authenticated using (pro_id = (select auth.uid()));

-- Qui je suis / qui me suit (security definer : évite la récursion RLS)
create function private.mes_sportifs() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select sportif_id from public.suivis where pro_id = (select auth.uid());
$$;
create function private.mes_pros() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select pro_id from public.suivis where sportif_id = (select auth.uid());
$$;

-- Les deux parties d'un lien voient le profil de l'autre (prénom, métier)
create policy "profil: lecture entre personnes liées" on public.profiles
  for select to authenticated
  using (id in (select private.mes_sportifs()) or id in (select private.mes_pros()));

create function private.metier_pro(p_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case when metier in ('coach', 'prepa', 'entraineur', 'kine', 'osteo') then metier else 'coach' end
  from public.profiles where id = p_id and (metier in ('coach', 'prepa', 'entraineur', 'kine', 'osteo') or role = 'coach');
$$;

-- Mon code d'invitation (créé au premier appel)
create function public.mon_code_invitation() returns text
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  c text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  hex text;
begin
  if u is null or private.metier_pro(u) is null then raise exception 'refusé'; end if;
  select code into c from public.invitations where pro_id = u;
  if c is not null then return c; end if;
  for essai in 1..20 loop
    hex := replace(gen_random_uuid()::text, '-', '');
    c := '';
    for i in 0..5 loop
      c := c || substr(alphabet, 1 + (('x' || substr(hex, i * 2 + 1, 2))::bit(8)::int % 32), 1);
    end loop;
    begin
      insert into public.invitations (code, pro_id) values (c, u);
      return c;
    exception when unique_violation then
      select code into c from public.invitations where pro_id = u;
      if c is not null then return c; end if;
    end;
  end loop;
  raise exception 'code indisponible';
end;
$$;

-- À qui appartient ce code ? (affiché avant d'accepter ; rien d'autre que le prénom et le métier)
create function public.invitation_info(p_code text)
returns table (prenom text, metier text)
language sql stable security definer set search_path = '' as $$
  select p.prenom, private.metier_pro(p.id)
  from public.invitations i join public.profiles p on p.id = i.pro_id
  where i.code = upper(trim(p_code)) and private.metier_pro(p.id) is not null;
$$;

-- Le sportif connecté accepte d'être suivi par le professionnel de ce code
create function public.rejoindre(p_code text)
returns table (prenom text, metier text)
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  p uuid;
  m text;
begin
  if u is null then raise exception 'refusé'; end if;
  select i.pro_id into p from public.invitations i where i.code = upper(trim(p_code));
  m := private.metier_pro(p);
  if p is null or m is null or p = u then return; end if;
  insert into public.suivis (pro_id, sportif_id, metier_pro) values (p, u, m) on conflict do nothing;
  return query select pr.prenom, m from public.profiles pr where pr.id = p;
end;
$$;

revoke execute on function public.mon_code_invitation() from public, anon;
revoke execute on function public.rejoindre(text) from public, anon;
grant execute on function public.mon_code_invitation() to authenticated;
grant execute on function public.rejoindre(text) to authenticated;
grant execute on function public.invitation_info(text) to anon, authenticated;

-- Inscription : métier choisi et code d'invitation éventuel (jamais bloquants)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  m text := new.raw_user_meta_data ->> 'metier';
  c text := upper(trim(new.raw_user_meta_data ->> 'code'));
  p uuid;
begin
  insert into public.profiles (id, prenom, metier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    case when m in ('sportif', 'joueur', 'coach', 'prepa', 'entraineur', 'kine', 'osteo') then m else 'sportif' end
  );
  if c is not null and c <> '' then
    select pro_id into p from public.invitations where code = c;
    if p is not null and private.metier_pro(p) is not null then
      insert into public.suivis (pro_id, sportif_id, metier_pro) values (p, new.id, private.metier_pro(p)) on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

-- Les clientes déjà inscrites sont reliées au coach actuel
insert into public.suivis (pro_id, sportif_id, metier_pro)
select c.id, p.id, 'coach'
from public.profiles p cross join (select id from public.profiles where role = 'coach') c
where p.role = 'client'
on conflict do nothing;
