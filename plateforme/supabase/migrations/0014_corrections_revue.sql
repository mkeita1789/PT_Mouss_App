-- ═══════════════════════════════════════════════
-- Baara — corrections après revue de code
-- 1. Charges imposées : chaque professionnel ne remplace que SES charges
--    (un préparateur n'efface plus le plan du coach, et inversement).
-- 2. Équipe : le rôle du créateur ne peut pas être retiré, et il ne peut pas
--    être sorti de l'équipe tant qu'elle existe (sinon plus personne ne la gère).
-- ═══════════════════════════════════════════════

alter table public.charges_imposees add column auteur_id uuid references public.profiles (id) on delete set null default auth.uid();
update public.charges_imposees c set auteur_id = (select id from public.profiles where role = 'coach' order by created_at limit 1) where auteur_id is null;

drop policy "charges imposées: modification par son professionnel" on public.charges_imposees;
drop policy "charges imposées: suppression par son professionnel" on public.charges_imposees;
create policy "charges imposées: modification par son auteur" on public.charges_imposees
  for update to authenticated
  using (client_id in (select private.mes_sportifs_suivis()) and auteur_id = (select auth.uid()))
  with check (client_id in (select private.mes_sportifs_suivis()) and auteur_id = (select auth.uid()));
create policy "charges imposées: suppression par son auteur" on public.charges_imposees
  for delete to authenticated
  using (client_id in (select private.mes_sportifs_suivis()) and auteur_id = (select auth.uid()));
drop policy "charges imposées: ajout par son professionnel" on public.charges_imposees;
create policy "charges imposées: ajout par son professionnel" on public.charges_imposees
  for insert to authenticated
  with check (client_id in (select private.mes_sportifs_suivis()) and auteur_id = (select auth.uid()));

create function private.proteger_createur() returns trigger
language plpgsql security definer set search_path = '' as $$
declare createur uuid;
begin
  select cree_par into createur from public.equipes where id = old.equipe_id;
  -- équipe supprimée (cascade) : rien à protéger
  if createur is null or old.user_id is distinct from createur then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then raise exception 'Le créateur de l''équipe ne peut pas en être retiré'; end if;
  if new.role = 'joueur' then raise exception 'Le créateur de l''équipe reste dans le staff'; end if;
  return new;
end;
$$;
create trigger equipe_membres_createur
  before update of role or delete on public.equipe_membres
  for each row execute function private.proteger_createur();
