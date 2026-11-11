-- ═══════════════════════════════════════════════
-- Baara Foot — club complet
-- • Contact du club : numéro à appeler, réseaux sociaux
-- • Convocation : liste de joueurs convoqués par événement
-- • Composition : placement libre des joueurs sur le terrain
-- • Feuille de match saisie par le staff : buts, passes, cartons, remplacements
-- • Tactique : principes de jeu (équipe / ligne), consignes, séquences vidéo (liens)
-- • Parents : un code dédié ; ils ne voient QUE le calendrier et le contact du club
--   (aucun nom de joueur, aucune convocation, aucune donnée d'enfant)
-- ═══════════════════════════════════════════════

-- ─── Rôle parent ───
alter table public.equipe_membres drop constraint equipe_membres_role_check;
alter table public.equipe_membres add constraint equipe_membres_role_check
  check (role in ('entraineur', 'adjoint', 'prepa', 'media', 'president', 'dirigeant', 'joueur', 'parent'));

-- Les parents ne font pas partie de « mes équipes » : toutes les règles existantes les excluent d'office
create or replace function private.mes_equipes() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select equipe_id from public.equipe_membres where user_id = (select auth.uid()) and role <> 'parent';
$$;
create function private.equipes_parents() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select equipe_id from public.equipe_membres where user_id = (select auth.uid()) and role = 'parent';
$$;

-- Les parents voient l'équipe (nom, couleurs, contact) et son calendrier
create policy "équipes: lecture par les parents" on public.equipes
  for select to authenticated using (id in (select private.equipes_parents()));
create policy "événements: lecture par les parents" on public.evenements
  for select to authenticated using (equipe_id in (select private.equipes_parents()));
create policy "équipes: logo visible des parents" on storage.objects
  for select to authenticated
  using (bucket_id = 'equipes' and (storage.foldername(name))[1] in (select e::text from private.equipes_parents() e)
         and storage.filename(name) like 'logo-%');

-- Membres : les fiches « parent » ne sont visibles que du staff (et de soi-même)
drop policy "membres: lecture par l'équipe" on public.equipe_membres;
create policy "membres: lecture par l'équipe" on public.equipe_membres
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (equipe_id in (select private.mes_equipes()) and (role <> 'parent' or equipe_id in (select private.equipes_gerees())))
  );

-- ─── Contact du club et code parents ───
alter table public.equipes
  add column telephone text check (telephone is null or telephone ~ '^\+?[0-9 .()-]{6,20}$'),
  add column contact_nom text check (contact_nom is null or char_length(contact_nom) <= 60),
  add column reseaux jsonb not null default '{}'::jsonb check (jsonb_typeof(reseaux) = 'object'),
  add column code_parents text unique check (code_parents is null or code_parents ~ '^[A-HJ-NP-Z2-9]{6}$');
grant update (nom, saison, couleur1, couleur2, logo_path, valeurs, telephone, contact_nom, reseaux) on public.equipes to authenticated;

-- Code parents créé à la demande par le staff
create function public.code_parents(p_equipe uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if p_equipe not in (select private.equipes_gerees()) then raise exception 'refusé'; end if;
  select code_parents into c from public.equipes where id = p_equipe;
  if c is not null then return c; end if;
  for essai in 1..20 loop
    c := private.nouveau_code();
    if exists (select 1 from public.equipes where code = c or code_parents = c)
       or exists (select 1 from public.equipe_invitations where code = c) then continue; end if;
    begin
      update public.equipes set code_parents = c where id = p_equipe;
      return c;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'code indisponible';
end;
$$;
revoke execute on function public.code_parents(uuid) from public, anon;
grant execute on function public.code_parents(uuid) to authenticated;

-- Rejoindre : code d'équipe = joueur ; code parents = parent ; invitation = rôle prévu
create or replace function public.rejoindre_equipe(p_code text)
returns table (id uuid, nom text)
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  c text := upper(trim(p_code));
  e uuid;
  r text := 'joueur';
  inv public.equipe_invitations%rowtype;
begin
  if u is null then raise exception 'refusé'; end if;
  select q.id into e from public.equipes q where q.code = c;
  if e is null then
    select q.id into e from public.equipes q where q.code_parents = c;
    if e is not null then r := 'parent'; end if;
  end if;
  if e is null then
    select * into inv from public.equipe_invitations i where i.code = c and i.utilisee_par is null and i.expire_le > now() for update;
    if inv.code is null then return; end if;
    e := inv.equipe_id; r := inv.role;
    update public.equipe_invitations set utilisee_par = u, utilisee_le = now() where code = c;
  end if;
  insert into public.equipe_membres (equipe_id, user_id, nom, role)
  select e, u, coalesce(nullif(p.prenom, ''), 'Membre'), r from public.profiles p where p.id = u
  on conflict (equipe_id, user_id) do update
    set role = case when r in ('joueur', 'parent') then public.equipe_membres.role else excluded.role end;
  return query select q.id, q.nom from public.equipes q where q.id = e;
end;
$$;

-- Notifications d'équipe : les parents ne les reçoivent que si on le demande (calendrier)
drop function public.abonnements_equipe(uuid);
create function public.abonnements_equipe(p_equipe uuid, p_parents boolean default false)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.push_abonnements a
  join public.equipe_membres m on m.user_id = a.user_id and m.equipe_id = p_equipe
  where a.user_id <> (select auth.uid())
    and (m.role <> 'parent' or p_parents)
    and p_equipe in (select private.equipes_gerees());
$$;
revoke execute on function public.abonnements_equipe(uuid, boolean) from public, anon;
grant execute on function public.abonnements_equipe(uuid, boolean) to authenticated;

-- ─── Ligne de jeu du joueur (pour les consignes par poste) ───
alter table public.equipe_membres
  add column ligne text check (ligne is null or ligne in ('gardien', 'defense', 'milieu', 'attaque'));
grant update (nom, role, poste, numero, ligne) on public.equipe_membres to authenticated;

-- ─── Convocation : liste des convoqués (null = toute l'équipe, comme avant) ───
alter table public.evenements
  add column convoques uuid[] check (convoques is null or cardinality(convoques) <= 60),
  add column duree int not null default 90 check (duree between 20 and 130);

-- Téléphones des convoqués (staff, pour la notification de convocation)
create function public.abonnements_membres(p_equipe uuid, p_membres uuid[])
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.push_abonnements a
  join public.equipe_membres m on m.user_id = a.user_id and m.equipe_id = p_equipe
  where m.id = any (p_membres) and a.user_id <> (select auth.uid())
    and p_equipe in (select private.equipes_gerees());
$$;
revoke execute on function public.abonnements_membres(uuid, uuid[]) from public, anon;
grant execute on function public.abonnements_membres(uuid, uuid[]) to authenticated;

-- ─── Placement libre dans la composition ───
alter table public.compositions
  add column positions jsonb not null default '{}'::jsonb check (jsonb_typeof(positions) = 'object');

-- ─── Feuille de match ───
create table public.match_faits (
  id           uuid primary key default gen_random_uuid(),
  equipe_id    uuid not null references public.equipes (id) on delete cascade,
  evenement_id uuid not null,
  type         text not null check (type in ('but', 'jaune', 'rouge', 'remplacement')),
  membre_id    uuid not null,                -- buteur, joueur averti/exclu, joueur qui sort
  membre2_id   uuid,                         -- passeur (but) ou joueur qui entre (remplacement)
  minute       int check (minute is null or minute between 0 and 130),
  cree_par     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  cree_le      timestamptz not null default now(),
  foreign key (evenement_id, equipe_id) references public.evenements (id, equipe_id) on delete cascade,
  foreign key (membre_id, equipe_id) references public.equipe_membres (id, equipe_id) on delete cascade,
  foreign key (membre2_id, equipe_id) references public.equipe_membres (id, equipe_id) on delete cascade,
  check (type in ('but', 'remplacement') or membre2_id is null),
  check (type <> 'remplacement' or membre2_id is not null)
);
create index match_faits_evenement on public.match_faits (evenement_id);
create index match_faits_equipe on public.match_faits (equipe_id);
alter table public.match_faits enable row level security;
create policy "feuille de match: lecture par l'équipe" on public.match_faits
  for select to authenticated using (equipe_id in (select private.mes_equipes()));
create policy "feuille de match: saisie par le staff" on public.match_faits
  for insert to authenticated with check (equipe_id in (select private.equipes_gerees()) and cree_par = (select auth.uid()));
create policy "feuille de match: suppression par le staff" on public.match_faits
  for delete to authenticated using (equipe_id in (select private.equipes_gerees()));

-- Carton : le joueur concerné et le staff sont prévenus (par l'auteur, juste après la saisie)
create function public.abonnements_carton(p_fait uuid)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select distinct a.endpoint, a.p256dh, a.auth, a.lang
  from public.match_faits f
  join public.equipe_membres m on m.equipe_id = f.equipe_id
    and (m.id = f.membre_id or m.role in ('entraineur', 'adjoint', 'prepa'))
  join public.push_abonnements a on a.user_id = m.user_id
  where f.id = p_fait and f.type in ('jaune', 'rouge') and f.cree_par = (select auth.uid())
    and f.cree_le > now() - interval '2 minutes' and a.user_id <> (select auth.uid());
$$;
revoke execute on function public.abonnements_carton(uuid) from public, anon;
grant execute on function public.abonnements_carton(uuid) to authenticated;

-- ─── Tactique : principes de jeu, consignes, séquences vidéo ───
create table public.tactiques (
  id          uuid primary key default gen_random_uuid(),
  equipe_id   uuid not null references public.equipes (id) on delete cascade,
  genre       text not null check (genre in ('principe', 'consigne', 'video')),
  cible       text not null check (cible in ('equipe', 'ligne', 'joueur')),
  ligne       text check (ligne is null or ligne in ('gardien', 'defense', 'milieu', 'attaque')),
  membre_id   uuid,
  titre       text not null check (char_length(titre) between 1 and 80),
  texte       text check (texte is null or char_length(texte) <= 3000),
  url         text check (url is null or (url ~ '^https://' and char_length(url) <= 500)),
  auteur_nom  text not null check (char_length(auteur_nom) between 1 and 60),
  cree_par    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  cree_le     timestamptz not null default now(),
  foreign key (membre_id, equipe_id) references public.equipe_membres (id, equipe_id) on delete cascade,
  check ((cible = 'ligne') = (ligne is not null)),
  check ((cible = 'joueur') = (membre_id is not null)),
  check (genre <> 'video' or url is not null)
);
create index tactiques_equipe on public.tactiques (equipe_id, cree_le desc);
alter table public.tactiques enable row level security;
-- Le staff voit tout ; un joueur voit ce qui vise l'équipe, sa ligne ou lui-même
create policy "tactique: lecture" on public.tactiques
  for select to authenticated
  using (
    equipe_id in (select private.equipes_gerees())
    or (equipe_id in (select private.mes_equipes()) and (
      cible = 'equipe'
      or (cible = 'ligne' and ligne = (select em.ligne from public.equipe_membres em where em.equipe_id = tactiques.equipe_id and em.user_id = (select auth.uid()) limit 1))
      or (cible = 'joueur' and membre_id = private.mon_membre(equipe_id))
    ))
  );
create policy "tactique: ajout par le staff" on public.tactiques
  for insert to authenticated with check (equipe_id in (select private.equipes_gerees()) and cree_par = (select auth.uid()));
create policy "tactique: suppression par le staff" on public.tactiques
  for delete to authenticated using (equipe_id in (select private.equipes_gerees()));

-- Téléphones des personnes visées par un contenu tactique (auteur, juste après l'envoi)
create function public.abonnements_tactique(p_id uuid)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.tactiques t
  join public.equipe_membres m on m.equipe_id = t.equipe_id and m.user_id is not null and m.role <> 'parent'
  join public.push_abonnements a on a.user_id = m.user_id
  where t.id = p_id and t.cree_par = (select auth.uid()) and t.cree_le > now() - interval '2 minutes'
    and a.user_id <> (select auth.uid())
    and (t.cible = 'equipe' or (t.cible = 'ligne' and m.ligne = t.ligne) or (t.cible = 'joueur' and m.id = t.membre_id));
$$;
revoke execute on function public.abonnements_tactique(uuid) from public, anon;
grant execute on function public.abonnements_tactique(uuid) to authenticated;
