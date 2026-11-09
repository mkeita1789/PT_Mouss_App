-- ═══════════════════════════════════════════════
-- PT Mouss IA — réathlétisation (LCA)
--   • reath          : clientes inscrites par le coach, semaine en cours ;
--   • reath_seances  : séances faites, avec douleur (0-10) et gonflement.
-- Seul le coach inscrit et fait passer les semaines ; la cliente note ses séances.
-- ═══════════════════════════════════════════════

create table public.reath (
  client_id  uuid primary key references public.profiles (id) on delete cascade,
  programme  text not null default 'lca' check (programme in ('lca')),
  semaine    int  not null default 1 check (semaine between 1 and 7),   -- 7 = programme terminé
  debut      date not null default current_date,
  cree_le    timestamptz not null default now(),
  maj_le     timestamptz not null default now()
);
alter table public.reath enable row level security;

create policy "reath: lecture" on public.reath
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_coach()));
create policy "reath: inscription par le coach" on public.reath
  for insert to authenticated with check ((select private.is_coach()));
create policy "reath: suivi par le coach" on public.reath
  for update to authenticated using ((select private.is_coach())) with check ((select private.is_coach()));
create policy "reath: arrêt par le coach" on public.reath
  for delete to authenticated using ((select private.is_coach()));

create table public.reath_seances (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  semaine     int  not null check (semaine between 1 and 6),
  jour        int  not null check (jour between 0 and 6),
  douleur     int  check (douleur between 0 and 10),
  gonflement  boolean not null default false,
  note        text check (char_length(note) <= 300),
  fait_le     timestamptz not null default now(),
  unique (client_id, semaine, jour)
);
create index reath_seances_client on public.reath_seances (client_id, fait_le desc);
alter table public.reath_seances enable row level security;

create policy "reath séances: lecture" on public.reath_seances
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_coach()));
-- La cliente ne note que les semaines déjà ouvertes par le coach
create policy "reath séances: ajout" on public.reath_seances
  for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (select 1 from public.reath r where r.client_id = (select auth.uid()) and reath_seances.semaine <= r.semaine)
  );
create policy "reath séances: annulation" on public.reath_seances
  for delete to authenticated
  using (client_id = (select auth.uid()));
