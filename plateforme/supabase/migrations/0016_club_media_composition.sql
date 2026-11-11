-- ═══════════════════════════════════════════════
-- Baara — identité du club, responsable média, compositions
-- • Le staff personnalise l'équipe : couleurs, logo, valeurs du club.
-- • Nouveau rôle « media » : il met les photos des joueurs (photo d'équipe,
--   visible des seuls membres), sans aucun autre droit de gestion.
-- • Compositions façon FIFA : schéma tactique, titulaires, remplaçants,
--   par match ; les joueurs la voient une fois publiée.
-- ═══════════════════════════════════════════════

-- ─── Identité du club ───
alter table public.equipes
  add column couleur1 text check (couleur1 is null or couleur1 ~ '^#[0-9a-fA-F]{6}$'),
  add column couleur2 text check (couleur2 is null or couleur2 ~ '^#[0-9a-fA-F]{6}$'),
  add column logo_path text check (logo_path is null or char_length(logo_path) <= 200),
  add column valeurs text check (valeurs is null or char_length(valeurs) <= 1000);
grant update (nom, saison, couleur1, couleur2, logo_path, valeurs) on public.equipes to authenticated;

-- ─── Rôle média et photo d'équipe ───
alter table public.equipe_membres drop constraint equipe_membres_role_check;
alter table public.equipe_membres add constraint equipe_membres_role_check
  check (role in ('entraineur', 'adjoint', 'prepa', 'media', 'joueur'));
alter table public.equipe_membres
  add column photo_path text check (photo_path is null or char_length(photo_path) <= 200),
  add column photo_accord timestamptz;
-- photo_path n'est PAS dans les colonnes modifiables : elle passe par definir_photo_membre()

create function private.equipes_photos() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select equipe_id from public.equipe_membres
  where user_id = (select auth.uid()) and role in ('entraineur', 'adjoint', 'prepa', 'media');
$$;

-- Le staff ou le responsable média met (ou retire) la photo d'un membre, avec l'accord de la personne
create function public.definir_photo_membre(p_membre uuid, p_chemin text, p_accord boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare e uuid;
begin
  select equipe_id into e from public.equipe_membres where id = p_membre;
  if e is null or e not in (select private.equipes_photos()) then raise exception 'refusé'; end if;
  if p_chemin is not null and (not p_accord or split_part(p_chemin, '/', 1) <> e::text) then raise exception 'refusé'; end if;
  update public.equipe_membres
    set photo_path = p_chemin, photo_accord = case when p_chemin is null then null else now() end
    where id = p_membre;
end;
$$;
revoke execute on function public.definir_photo_membre(uuid, text, boolean) from public, anon;
grant execute on function public.definir_photo_membre(uuid, text, boolean) to authenticated;

-- Stockage : dossier = identifiant de l'équipe ; les membres voient, le staff et le média déposent
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipes', 'equipes', false, 2097152, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;
create policy "équipes: lecture des images par les membres" on storage.objects
  for select to authenticated
  using (bucket_id = 'equipes' and (storage.foldername(name))[1] in (select e::text from private.mes_equipes() e));
create policy "équipes: dépôt par le staff et le média" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'equipes' and (storage.foldername(name))[1] in (select e::text from private.equipes_photos() e));
create policy "équipes: suppression par le staff et le média" on storage.objects
  for delete to authenticated
  using (bucket_id = 'equipes' and (storage.foldername(name))[1] in (select e::text from private.equipes_photos() e));

-- ─── Compositions ───
create table public.compositions (
  id            uuid primary key default gen_random_uuid(),
  equipe_id     uuid not null references public.equipes (id) on delete cascade,
  evenement_id  uuid references public.evenements (id) on delete cascade,  -- null = composition type de l'équipe
  formation     text not null check (formation in ('4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1', '4-5-1')),
  titulaires    jsonb not null default '{}'::jsonb,   -- { "0": membre_id, "1": membre_id, … } index du poste → joueur
  remplacants   jsonb not null default '[]'::jsonb,   -- [membre_id, …]
  publiee       boolean not null default false,
  maj_le        timestamptz not null default now(),
  unique nulls not distinct (equipe_id, evenement_id),
  foreign key (evenement_id, equipe_id) references public.evenements (id, equipe_id) on delete cascade,
  check (jsonb_typeof(titulaires) = 'object' and jsonb_typeof(remplacants) = 'array')
);
alter table public.compositions enable row level security;
create policy "compositions: lecture" on public.compositions
  for select to authenticated
  using (equipe_id in (select private.equipes_gerees()) or (publiee and equipe_id in (select private.mes_equipes())));
create policy "compositions: ajout par le staff" on public.compositions
  for insert to authenticated with check (equipe_id in (select private.equipes_gerees()));
create policy "compositions: modification par le staff" on public.compositions
  for update to authenticated
  using (equipe_id in (select private.equipes_gerees())) with check (equipe_id in (select private.equipes_gerees()));
create policy "compositions: suppression par le staff" on public.compositions
  for delete to authenticated using (equipe_id in (select private.equipes_gerees()));

-- Le créateur reste dans le staff (le rôle média ne suffit pas pour gérer l'équipe)
create or replace function private.proteger_createur() returns trigger
language plpgsql security definer set search_path = '' as $$
declare createur uuid;
begin
  select cree_par into createur from public.equipes where id = old.equipe_id;
  if createur is null or old.user_id is distinct from createur then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then raise exception 'Le créateur de l''équipe ne peut pas en être retiré'; end if;
  if new.role not in ('entraineur', 'adjoint', 'prepa') then raise exception 'Le créateur de l''équipe reste dans le staff'; end if;
  return new;
end;
$$;
