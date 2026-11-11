-- ═══════════════════════════════════════════════
-- Baara — chacun son travail sur les charges imposées
-- • Le coach historique ne modifie plus les charges fixées par un autre
--   professionnel (préparateur physique) : il les voit seulement.
-- • Il peut lui demander un changement : la demande arrive au préparateur,
--   qui reste seul à modifier son plan.
-- ═══════════════════════════════════════════════

drop policy "charges imposées: modification par le coach" on public.charges_imposees;
drop policy "charges imposées: suppression par le coach" on public.charges_imposees;
create policy "charges imposées: modification par le coach, des siennes" on public.charges_imposees
  for update to authenticated
  using ((select private.is_coach()) and auteur_id = (select auth.uid()))
  with check ((select private.is_coach()) and auteur_id = (select auth.uid()));
create policy "charges imposées: suppression par le coach, des siennes" on public.charges_imposees
  for delete to authenticated
  using ((select private.is_coach()) and auteur_id = (select auth.uid()));
drop policy "charges imposées: ajout par le coach" on public.charges_imposees;
create policy "charges imposées: ajout par le coach" on public.charges_imposees
  for insert to authenticated
  with check ((select private.is_coach()) and auteur_id = (select auth.uid()));

create table public.demandes_charges (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.profiles (id) on delete cascade,
  auteur_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  destinataire_id  uuid not null references public.profiles (id) on delete cascade,
  message          text not null check (char_length(message) between 1 and 500),
  cree_le          timestamptz not null default now(),
  traitee_le       timestamptz,
  check (auteur_id <> destinataire_id)
);
create index demandes_charges_dest on public.demandes_charges (destinataire_id, traitee_le);
alter table public.demandes_charges enable row level security;

create policy "demandes: lecture par les deux professionnels" on public.demandes_charges
  for select to authenticated
  using (auteur_id = (select auth.uid()) or destinataire_id = (select auth.uid()));
-- On ne demande qu'à quelqu'un qui a vraiment fixé des charges à ce sportif, et seulement si on le suit soi-même
create policy "demandes: envoi" on public.demandes_charges
  for insert to authenticated
  with check (
    auteur_id = (select auth.uid())
    and ((select private.is_coach()) or client_id in (select private.mes_sportifs_suivis()))
    and exists (select 1 from public.charges_imposees c where c.client_id = demandes_charges.client_id and c.auteur_id = demandes_charges.destinataire_id)
  );
create policy "demandes: traitée par le destinataire" on public.demandes_charges
  for update to authenticated
  using (destinataire_id = (select auth.uid())) with check (destinataire_id = (select auth.uid()));
create policy "demandes: suppression par l'un des deux" on public.demandes_charges
  for delete to authenticated
  using (auteur_id = (select auth.uid()) or destinataire_id = (select auth.uid()));
revoke update on public.demandes_charges from authenticated;
grant update (traitee_le) on public.demandes_charges to authenticated;

-- Téléphones du destinataire d'une demande, pour le prévenir (seulement par l'auteur, juste après l'envoi)
create function public.abonnements_demande(p_demande uuid)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.demandes_charges d
  join public.push_abonnements a on a.user_id = d.destinataire_id
  where d.id = p_demande and d.auteur_id = (select auth.uid()) and d.cree_le > now() - interval '2 minutes';
$$;
revoke execute on function public.abonnements_demande(uuid) from public, anon;
grant execute on function public.abonnements_demande(uuid) to authenticated;

-- Prénom des auteurs de charges d'un sportif que je suis (pour afficher « fixé par … »)
create function public.auteurs_charges(p_client uuid)
returns table (id uuid, prenom text, metier text)
language sql stable security definer set search_path = '' as $$
  select distinct p.id, p.prenom, p.metier
  from public.charges_imposees c join public.profiles p on p.id = c.auteur_id
  where c.client_id = p_client
    and ((select private.is_coach()) or p_client in (select private.mes_sportifs_suivis()) or p_client = (select auth.uid()));
$$;
revoke execute on function public.auteurs_charges(uuid) from public, anon;
grant execute on function public.auteurs_charges(uuid) to authenticated;
