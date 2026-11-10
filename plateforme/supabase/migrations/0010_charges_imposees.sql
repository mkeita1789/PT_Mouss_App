-- ═══════════════════════════════════════════════
-- Baara — charges imposées par le coach, semaine par semaine
-- La cliente ne peut s'en écarter qu'en donnant une raison (le coach est prévenu).
-- ═══════════════════════════════════════════════

create table public.charges_imposees (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles (id) on delete cascade,
  exercice   text not null check (char_length(exercice) between 1 and 80),
  -- null = ce jour du programme n'est pas précisé : la charge vaut pour tous les jours où l'exercice apparaît
  jour_code  text check (jour_code is null or char_length(jour_code) <= 40),
  lundi      date not null check (extract(isodow from lundi) = 1),
  charge     numeric(6, 2) not null check (charge > 0 and charge <= 1000),
  cree_le    timestamptz not null default now(),
  unique nulls not distinct (client_id, exercice, jour_code, lundi)
);
create index charges_imposees_client on public.charges_imposees (client_id, lundi);
alter table public.charges_imposees enable row level security;

create policy "charges imposées: lecture" on public.charges_imposees
  for select to authenticated
  using ((select private.is_coach()) or client_id = (select auth.uid()));
create policy "charges imposées: ajout par le coach" on public.charges_imposees
  for insert to authenticated with check ((select private.is_coach()));
create policy "charges imposées: modification par le coach" on public.charges_imposees
  for update to authenticated using ((select private.is_coach())) with check ((select private.is_coach()));
create policy "charges imposées: suppression par le coach" on public.charges_imposees
  for delete to authenticated using ((select private.is_coach()));

-- Ce qui était prévu, et pourquoi la cliente s'en est écartée
alter table public.seance_exercices
  add column charge_prevue numeric(6, 2) check (charge_prevue is null or (charge_prevue > 0 and charge_prevue <= 1000)),
  add column ecart text check (ecart is null or ecart in ('douleur', 'lourd', 'facile', 'materiel'));
