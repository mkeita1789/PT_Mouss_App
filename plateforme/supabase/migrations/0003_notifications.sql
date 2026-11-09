-- ═══════════════════════════════════════════════
-- PT Mouss IA — notifications (Web Push) et fil d'activité
--   • push_abonnements : les téléphones qui acceptent les notifications ;
--   • activites        : « Inès a commencé / terminé sa séance », lu par le coach.
-- Même principe : chacun gère ses lignes, le coach lit tout.
-- ═══════════════════════════════════════════════

-- ─── Abonnements aux notifications (un par téléphone / navigateur) ───
create table public.push_abonnements (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint  text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh    text not null check (char_length(p256dh) <= 200),
  auth      text not null check (char_length(auth) <= 100),
  lang      text not null default 'fr' check (lang in ('fr', 'en')),
  cree_le   timestamptz not null default now()
);
create index push_abonnements_user on public.push_abonnements (user_id);
alter table public.push_abonnements enable row level security;

-- Chacun voit et supprime les siens ; le coach lit ceux de ses clients (mot du coach)
create policy "push: lecture" on public.push_abonnements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_coach()));
create policy "push: suppression" on public.push_abonnements
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Enregistrement : un téléphone partagé passe au compte connecté (l'ancien lien est retiré)
create function public.enregistrer_abonnement(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'non connecté'; end if;
  delete from public.push_abonnements where endpoint = p_endpoint;
  insert into public.push_abonnements (user_id, endpoint, p256dh, auth, lang)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth, case when p_lang = 'en' then 'en' else 'fr' end);
end;
$$;
revoke execute on function public.enregistrer_abonnement(text, text, text, text) from public, anon;
grant execute on function public.enregistrer_abonnement(text, text, text, text) to authenticated;

-- ─── Fil d'activité ─────────────────────────────
create table public.activites (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type       text not null check (type in ('debut', 'fin', 'libre')),
  jour_code  text check (char_length(jour_code) <= 40),
  detail     text check (char_length(detail) <= 200),
  cree_le    timestamptz not null default now()
);
create index activites_date on public.activites (cree_le desc);
create index activites_client on public.activites (client_id, cree_le desc);
alter table public.activites enable row level security;

create policy "activité: lecture" on public.activites
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_coach()));
create policy "activité: ajout" on public.activites
  for insert to authenticated
  with check (client_id = (select auth.uid()));

-- Téléphones du coach, pour le prévenir de l'activité d'un client.
-- Réservé à un client qui vient d'enregistrer une activité (2 min) : pas de lecture libre.
create function public.abonnements_coachs()
returns table (endpoint text, p256dh text, auth text, lang text)
language sql
stable
security definer set search_path = ''
as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.push_abonnements a
  join public.profiles p on p.id = a.user_id and p.role = 'coach'
  where a.user_id <> (select auth.uid())
    and exists (
      select 1 from public.activites v
      where v.client_id = (select auth.uid()) and v.cree_le > now() - interval '2 minutes'
    );
$$;

revoke execute on function public.abonnements_coachs() from public, anon;
grant execute on function public.abonnements_coachs() to authenticated;
