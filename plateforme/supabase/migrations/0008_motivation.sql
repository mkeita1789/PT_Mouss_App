-- ═══════════════════════════════════════════════
-- Baara — motivation : défis du coach, rappels automatiques
-- ═══════════════════════════════════════════════

-- ─── Défis lancés par le coach (à une cliente, ou à toutes si client_id est vide) ───
create table public.defis (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  client_id  uuid references public.profiles (id) on delete cascade,
  titre      text not null check (char_length(titre) between 1 and 80),
  type       text not null check (type in ('seances', 'charge')),
  exercice   text check (exercice is null or char_length(exercice) <= 80),
  cible      numeric(6, 1) not null check (cible > 0 and cible <= 1000),
  debut      date not null default current_date,
  fin        date not null,
  cree_le    timestamptz not null default now(),
  check (fin >= debut),
  check (type = 'seances' or exercice is not null)
);
create index defis_fin on public.defis (fin desc);
alter table public.defis enable row level security;

create policy "défis: lecture" on public.defis
  for select to authenticated
  using ((select private.is_coach()) or client_id is null or client_id = (select auth.uid()));
create policy "défis: création par le coach" on public.defis
  for insert to authenticated with check ((select private.is_coach()) and coach_id = (select auth.uid()));
create policy "défis: suppression par le coach" on public.defis
  for delete to authenticated using ((select private.is_coach()));

-- ─── Rappels automatiques (appelés une fois par jour par la tâche planifiée) ───
create table if not exists private.config (cle text primary key, valeur text not null);
create table private.rappels_log (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  type      text not null,
  envoye_le timestamptz not null default now()
);
create index rappels_log_user on private.rappels_log (user_id, type, envoye_le desc);

-- Renvoie les rappels à envoyer aujourd'hui et les note dans le journal.
-- Protégé par un secret connu seulement du serveur de l'appli.
create function public.rappels_du_jour(p_secret text)
returns table (user_id uuid, type text, prenom text, jours int, seances int, objectif int, endpoint text, p256dh text, auth text, lang text)
language plpgsql
volatile
security definer set search_path = ''
as $$
declare
  maintenant timestamptz := now();
  aujourdhui date := (now() at time zone 'Europe/Paris')::date;
  lundi date := aujourdhui - (extract(isodow from aujourdhui)::int - 1);
begin
  if p_secret is null or p_secret <> (select valeur from private.config where cle = 'rappels') then
    raise exception 'refusé';
  end if;
  -- Deux appels simultanés (deux déploiements) : le second attend et ne renvoie rien de neuf
  perform pg_advisory_xact_lock(424242);
  drop table if exists pg_temp.cibles;

  create temp table cibles on commit drop as
  -- Clientes sans séance depuis 3 jours (et sans douleur signalée récemment)
  select p.id as uid, 'inactif'::text as t, coalesce(nullif(b.reponses ->> 'prenom', ''), p.prenom) as pre,
         (aujourdhui - (greatest(
            coalesce((select max(s.realisee_le) from public.seances s where s.user_id = p.id), b.debut),
            coalesce((select max(r.fait_le) from public.reath_seances r where r.client_id = p.id), b.debut)
          ) at time zone 'Europe/Paris')::date)::int as nbj,
         0 as nbs, coalesce(nullif(regexp_replace(b.reponses ->> 'freq', '\D', '', 'g'), '')::int, 3) as obj
  from public.profiles p
  join public.bilans b on b.user_id = p.id
  where p.role = 'client'
    and exists (select 1 from public.push_abonnements a where a.user_id = p.id)
    and not exists (select 1 from private.rappels_log l where l.user_id = p.id and l.type = 'inactif' and l.envoye_le > maintenant - interval '3 days')
    and not exists (select 1 from public.checkins c where c.user_id = p.id and c.jour > aujourdhui - 3 and c.corps ilike '%douleur%');
  delete from cibles where nbj < 3;

  -- Le dimanche : récap de la semaine pour toutes les clientes abonnées
  if extract(isodow from aujourdhui) = 7 then
    insert into cibles
    select p.id, 'recap', coalesce(nullif(b.reponses ->> 'prenom', ''), p.prenom), 0,
           (select count(*)::int from public.seances s where s.user_id = p.id and (s.realisee_le at time zone 'Europe/Paris')::date >= lundi)
           + (select count(*)::int from public.reath_seances r where r.client_id = p.id and (r.fait_le at time zone 'Europe/Paris')::date >= lundi),
           coalesce(nullif(regexp_replace(b.reponses ->> 'freq', '\D', '', 'g'), '')::int, 3)
    from public.profiles p
    join public.bilans b on b.user_id = p.id
    where p.role = 'client'
      and exists (select 1 from public.push_abonnements a where a.user_id = p.id)
      and not exists (select 1 from private.rappels_log l where l.user_id = p.id and l.type = 'recap' and (l.envoye_le at time zone 'Europe/Paris')::date = aujourdhui);
    -- Pas de double message le dimanche : le récap suffit
    delete from cibles c1 where c1.t = 'inactif' and exists (select 1 from cibles c2 where c2.uid = c1.uid and c2.t = 'recap');
  end if;

  insert into private.rappels_log (user_id, type) select uid, t from cibles;

  return query
  select c.uid, c.t, c.pre, c.nbj, c.nbs, c.obj, a.endpoint, a.p256dh, a.auth, a.lang
  from cibles c join public.push_abonnements a on a.user_id = c.uid;
end;
$$;

-- Téléphones désabonnés (renvoyés comme « disparus » par le service de notifications)
create function public.oublier_abonnements(p_secret text, p_endpoints text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_secret is null or p_secret <> (select valeur from private.config where cle = 'rappels') then
    raise exception 'refusé';
  end if;
  delete from public.push_abonnements where endpoint = any (p_endpoints);
end;
$$;

revoke execute on function public.rappels_du_jour(text) from public, authenticated;
revoke execute on function public.oublier_abonnements(text, text[]) from public, authenticated;
grant execute on function public.rappels_du_jour(text) to anon;
grant execute on function public.oublier_abonnements(text, text[]) to anon;

-- Le secret est enregistré à part, jamais dans le code :
-- insert into private.config (cle, valeur) values ('rappels', '<même valeur que CRON_SECRET sur Vercel>');
