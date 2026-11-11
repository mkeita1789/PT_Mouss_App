-- ═══════════════════════════════════════════════
-- Baara — équipes : effectif, calendrier, convocations, présences
--
-- • Un membre a un compte (adulte) OU n'est qu'une fiche tenue par le staff
--   (joueur mineur, joueur sans l'appli) : nom, poste, numéro, présences.
-- • Staff = entraîneur, adjoint, préparateur physique : il gère tout.
-- • Joueur : voit le calendrier et l'effectif, répond à ses convocations.
-- • Aucune donnée de forme ou de santé ici.
-- ═══════════════════════════════════════════════

create table public.equipes (
  id        uuid primary key default gen_random_uuid(),
  nom       text not null check (char_length(nom) between 1 and 60),
  saison    text check (saison is null or char_length(saison) <= 20),
  code      text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  cree_par  uuid not null references public.profiles (id) on delete cascade,
  cree_le   timestamptz not null default now()
);

create table public.equipe_membres (
  id         uuid primary key default gen_random_uuid(),
  equipe_id  uuid not null references public.equipes (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete cascade,   -- null = fiche sans compte
  nom        text not null check (char_length(nom) between 1 and 60),
  role       text not null default 'joueur' check (role in ('entraineur', 'adjoint', 'prepa', 'joueur')),
  poste      text check (poste is null or char_length(poste) <= 30),
  numero     int check (numero is null or (numero between 0 and 99)),
  cree_le    timestamptz not null default now(),
  unique (equipe_id, user_id)
);
create index equipe_membres_user on public.equipe_membres (user_id);
create index equipe_membres_equipe on public.equipe_membres (equipe_id);
alter table public.equipe_membres add unique (id, equipe_id);

create table public.evenements (
  id          uuid primary key default gen_random_uuid(),
  equipe_id   uuid not null references public.equipes (id) on delete cascade,
  type        text not null check (type in ('entrainement', 'match', 'rdv')),
  titre       text check (titre is null or char_length(titre) <= 80),
  debut       timestamptz not null,
  lieu        text check (lieu is null or char_length(lieu) <= 120),
  adversaire  text check (adversaire is null or char_length(adversaire) <= 60),
  domicile    boolean,
  score_pour  int check (score_pour is null or score_pour between 0 and 99),
  score_contre int check (score_contre is null or score_contre between 0 and 99),
  resume      text check (resume is null or char_length(resume) <= 1500),
  cree_le     timestamptz not null default now()
);
create index evenements_equipe_debut on public.evenements (equipe_id, debut);
alter table public.evenements add unique (id, equipe_id);

create table public.presences (
  evenement_id uuid not null references public.evenements (id) on delete cascade,
  membre_id    uuid not null references public.equipe_membres (id) on delete cascade,
  equipe_id    uuid not null references public.equipes (id) on delete cascade,
  reponse      text check (reponse is null or reponse in ('oui', 'non', 'incertain')),
  present      boolean,
  minutes      int check (minutes is null or minutes between 0 and 150),
  maj_le       timestamptz not null default now(),
  primary key (evenement_id, membre_id),
  -- l'événement et le membre appartiennent bien à la même équipe
  foreign key (evenement_id, equipe_id) references public.evenements (id, equipe_id) on delete cascade,
  foreign key (membre_id, equipe_id) references public.equipe_membres (id, equipe_id) on delete cascade
);
create index presences_membre on public.presences (membre_id);
create index presences_equipe on public.presences (equipe_id);

alter table public.equipes enable row level security;
alter table public.equipe_membres enable row level security;
alter table public.evenements enable row level security;
alter table public.presences enable row level security;

-- Mes équipes / celles que je gère (security definer : pas de récursion RLS)
create function private.mes_equipes() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select equipe_id from public.equipe_membres where user_id = (select auth.uid());
$$;
create function private.equipes_gerees() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select equipe_id from public.equipe_membres
  where user_id = (select auth.uid()) and role in ('entraineur', 'adjoint', 'prepa');
$$;

create policy "équipes: lecture par les membres" on public.equipes
  for select to authenticated using (id in (select private.mes_equipes()));
create policy "équipes: modification par le staff" on public.equipes
  for update to authenticated
  using (id in (select private.equipes_gerees())) with check (id in (select private.equipes_gerees()));
create policy "équipes: suppression par son créateur" on public.equipes
  for delete to authenticated using (cree_par = (select auth.uid()));
revoke update on public.equipes from authenticated;
grant update (nom, saison) on public.equipes to authenticated;

create policy "membres: lecture par l'équipe" on public.equipe_membres
  for select to authenticated using (equipe_id in (select private.mes_equipes()));
-- Le staff ajoute des fiches sans compte ; les comptes arrivent par le code (rejoindre_equipe)
create policy "membres: fiches ajoutées par le staff" on public.equipe_membres
  for insert to authenticated
  with check (equipe_id in (select private.equipes_gerees()) and user_id is null);
create policy "membres: modification par le staff" on public.equipe_membres
  for update to authenticated
  using (equipe_id in (select private.equipes_gerees())) with check (equipe_id in (select private.equipes_gerees()));
create policy "membres: retrait par le staff ou soi-même" on public.equipe_membres
  for delete to authenticated
  using (equipe_id in (select private.equipes_gerees()) or user_id = (select auth.uid()));
revoke update on public.equipe_membres from authenticated;
grant update (nom, role, poste, numero) on public.equipe_membres to authenticated;

create policy "événements: lecture par l'équipe" on public.evenements
  for select to authenticated using (equipe_id in (select private.mes_equipes()));
create policy "événements: ajout par le staff" on public.evenements
  for insert to authenticated with check (equipe_id in (select private.equipes_gerees()));
create policy "événements: modification par le staff" on public.evenements
  for update to authenticated
  using (equipe_id in (select private.equipes_gerees())) with check (equipe_id in (select private.equipes_gerees()));
create policy "événements: suppression par le staff" on public.evenements
  for delete to authenticated using (equipe_id in (select private.equipes_gerees()));

create policy "présences: lecture par l'équipe" on public.presences
  for select to authenticated using (equipe_id in (select private.mes_equipes()));
create policy "présences: ajout par le staff" on public.presences
  for insert to authenticated with check (equipe_id in (select private.equipes_gerees()));
create policy "présences: modification par le staff" on public.presences
  for update to authenticated
  using (equipe_id in (select private.equipes_gerees())) with check (equipe_id in (select private.equipes_gerees()));
create policy "présences: suppression par le staff" on public.presences
  for delete to authenticated using (equipe_id in (select private.equipes_gerees()));

-- Code d'équipe lisible (sans 0/O ni 1/I)
create function private.nouveau_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  hex text := replace(gen_random_uuid()::text, '-', '');
  c text := '';
begin
  for i in 0..5 loop
    c := c || substr(alphabet, 1 + (('x' || substr(hex, i * 2 + 1, 2))::bit(8)::int % 32), 1);
  end loop;
  return c;
end;
$$;

-- Créer une équipe : le créateur en devient l'entraîneur (ou le préparateur)
create function public.creer_equipe(p_nom text, p_saison text, p_role text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  e uuid;
  r text := case when p_role in ('entraineur', 'adjoint', 'prepa') then p_role else 'entraineur' end;
begin
  if u is null or char_length(trim(coalesce(p_nom, ''))) not between 1 and 60 then raise exception 'refusé'; end if;
  if (select count(*) from public.equipes where cree_par = u) >= 10 then raise exception 'trop d''équipes'; end if;
  for essai in 1..20 loop
    begin
      insert into public.equipes (nom, saison, code, cree_par)
      values (trim(p_nom), nullif(trim(coalesce(p_saison, '')), ''), private.nouveau_code(), u)
      returning id into e;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  if e is null then raise exception 'code indisponible'; end if;
  insert into public.equipe_membres (equipe_id, user_id, nom, role)
  select e, u, coalesce(nullif(p.prenom, ''), 'Coach'), r from public.profiles p where p.id = u;
  return e;
end;
$$;

-- Rejoindre une équipe avec son code (comme joueur)
create function public.rejoindre_equipe(p_code text)
returns table (id uuid, nom text)
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  e uuid;
begin
  if u is null then raise exception 'refusé'; end if;
  select q.id into e from public.equipes q where q.code = upper(trim(p_code));
  if e is null then return; end if;
  insert into public.equipe_membres (equipe_id, user_id, nom, role)
  select e, u, coalesce(nullif(p.prenom, ''), 'Joueur'), 'joueur' from public.profiles p where p.id = u
  on conflict (equipe_id, user_id) do nothing;
  return query select q.id, q.nom from public.equipes q where q.id = e;
end;
$$;

-- Un joueur répond à sa convocation (il ne peut rien changer d'autre)
create function public.repondre_convocation(p_evenement uuid, p_reponse text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := (select auth.uid());
  m uuid;
  e uuid;
begin
  if u is null or p_reponse not in ('oui', 'non', 'incertain') then raise exception 'refusé'; end if;
  select v.equipe_id into e from public.evenements v where v.id = p_evenement and v.debut > now() - interval '3 hours';
  if e is null then raise exception 'refusé'; end if;
  select em.id into m from public.equipe_membres em where em.equipe_id = e and em.user_id = u;
  if m is null then raise exception 'refusé'; end if;
  insert into public.presences (evenement_id, membre_id, equipe_id, reponse)
  values (p_evenement, m, e, p_reponse)
  on conflict (evenement_id, membre_id) do update set reponse = excluded.reponse, maj_le = now();
end;
$$;

-- Téléphones des joueurs d'une équipe, pour les prévenir d'une convocation (staff seulement)
create function public.abonnements_equipe(p_equipe uuid)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.push_abonnements a
  join public.equipe_membres m on m.user_id = a.user_id and m.equipe_id = p_equipe
  where a.user_id <> (select auth.uid())
    and p_equipe in (select private.equipes_gerees());
$$;

revoke execute on function public.creer_equipe(text, text, text) from public, anon;
revoke execute on function public.rejoindre_equipe(text) from public, anon;
revoke execute on function public.repondre_convocation(uuid, text) from public, anon;
revoke execute on function public.abonnements_equipe(uuid) from public, anon;
grant execute on function public.creer_equipe(text, text, text) to authenticated;
grant execute on function public.rejoindre_equipe(text) to authenticated;
grant execute on function public.repondre_convocation(uuid, text) to authenticated;
grant execute on function public.abonnements_equipe(uuid) to authenticated;
