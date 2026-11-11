-- ═══════════════════════════════════════════════
-- Baara — les coachs et préparateurs physiques voient LEURS sportifs
--
-- Un professionnel lit les données d'un sportif seulement si ce sportif l'a
-- accepté (table suivis) comme coach ou préparateur physique. Les kinés,
-- ostéos et entraîneurs ne voient rien de plus que le prénom pour l'instant.
-- Les politiques sont AJOUTÉES (elles s'additionnent aux existantes) : rien
-- ne change pour le coach historique ni pour les sportifs.
-- ═══════════════════════════════════════════════

create function private.mes_sportifs_suivis() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select sportif_id from public.suivis
  where pro_id = (select auth.uid()) and metier_pro in ('coach', 'prepa');
$$;

-- ─── Lecture des données d'entraînement ───
do $$
declare t text;
begin
  foreach t in array array['bilans', 'checkins', 'seances', 'seance_exercices'] loop
    execute format(
      'create policy "%1$s: lecture par son professionnel" on public.%1$I for select to authenticated
         using (user_id in (select private.mes_sportifs_suivis()))', t);
  end loop;
end $$;

-- ─── Mots du professionnel ───
create policy "mots: lecture par son auteur" on public.mots_coach
  for select to authenticated
  using (coach_id = (select auth.uid()));
create policy "mots: écriture par son professionnel" on public.mots_coach
  for insert to authenticated
  with check (coach_id = (select auth.uid()) and client_id in (select private.mes_sportifs_suivis()));
create policy "mots: suppression par son auteur" on public.mots_coach
  for delete to authenticated
  using (coach_id = (select auth.uid()));

-- ─── Charges imposées ───
create policy "charges imposées: lecture par son professionnel" on public.charges_imposees
  for select to authenticated using (client_id in (select private.mes_sportifs_suivis()));
create policy "charges imposées: ajout par son professionnel" on public.charges_imposees
  for insert to authenticated with check (client_id in (select private.mes_sportifs_suivis()));
create policy "charges imposées: modification par son professionnel" on public.charges_imposees
  for update to authenticated
  using (client_id in (select private.mes_sportifs_suivis()))
  with check (client_id in (select private.mes_sportifs_suivis()));
create policy "charges imposées: suppression par son professionnel" on public.charges_imposees
  for delete to authenticated using (client_id in (select private.mes_sportifs_suivis()));

-- ─── Fil d'activité et téléphones (pour prévenir le sportif d'un mot) ───
create policy "activité: lecture par son professionnel" on public.activites
  for select to authenticated using (client_id in (select private.mes_sportifs_suivis()));
create policy "push: lecture par son professionnel" on public.push_abonnements
  for select to authenticated using (user_id in (select private.mes_sportifs_suivis()));

-- ─── Le sportif prévient aussi ses professionnels quand il s'entraîne ───
create or replace function public.abonnements_coachs()
returns table (endpoint text, p256dh text, auth text, lang text)
language sql
stable
security definer set search_path = ''
as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.push_abonnements a
  join public.profiles p on p.id = a.user_id
  where a.user_id <> (select auth.uid())
    and (
      p.role = 'coach'
      or exists (
        select 1 from public.suivis s
        where s.pro_id = p.id and s.sportif_id = (select auth.uid()) and s.metier_pro in ('coach', 'prepa')
      )
    )
    and exists (
      select 1 from public.activites v
      where v.client_id = (select auth.uid()) and v.cree_le > now() - interval '2 minutes'
    );
$$;
