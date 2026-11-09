-- ═══════════════════════════════════════════════
-- PT Mouss IA — photos de profil, photos de progression, mot du coach
-- Même principe que 0001 : chaque client ne voit que ses données, le coach lit tout.
-- Les photos sont dans des espaces de stockage PRIVÉS : on y accède seulement
-- par des liens signés de courte durée, générés pour un utilisateur autorisé.
-- ═══════════════════════════════════════════════

-- ─── Profil : photo et accord pour les photos de progression ───
alter table public.profiles
  add column avatar_path   text check (avatar_path is null or avatar_path like id::text || '/%'),
  add column photos_accord timestamptz;   -- date de l'accord explicite (null = pas d'accord)

-- Le client peut modifier son prénom, sa photo et son accord — jamais son rôle
grant update (prenom, avatar_path, photos_accord) on public.profiles to authenticated;

-- Le profil du coach (prénom, photo) est visible des clients : il signe ses messages
drop policy "profil: lecture" on public.profiles;
create policy "profil: lecture" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or role = 'coach' or (select private.is_coach()));

-- ─── Mot du coach ───────────────────────────────
create table public.mots_coach (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles (id) on delete cascade,
  coach_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  texte      text not null check (char_length(texte) between 1 and 600),
  cree_le    timestamptz not null default now()
);
create index mots_coach_client on public.mots_coach (client_id, cree_le desc);
alter table public.mots_coach enable row level security;

create policy "mots: lecture" on public.mots_coach
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_coach()));
create policy "mots: écriture par le coach" on public.mots_coach
  for insert to authenticated
  with check ((select private.is_coach()) and coach_id = (select auth.uid()));
create policy "mots: suppression par le coach" on public.mots_coach
  for delete to authenticated
  using ((select private.is_coach()) and coach_id = (select auth.uid()));

-- ─── Photos de progression ──────────────────────
create table public.photos_progression (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  chemin      text not null unique check (chemin like user_id::text || '/%'),
  vue         text not null check (vue in ('face', 'profil', 'dos')),
  prise_le    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index photos_user_date on public.photos_progression (user_id, prise_le desc);
alter table public.photos_progression enable row level security;

-- L'accord explicite de la cliente est vérifié côté base, pas seulement dans l'appli
create function private.a_donne_accord()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and photos_accord is not null
  );
$$;
revoke execute on function private.a_donne_accord() from public, anon;
grant execute on function private.a_donne_accord() to authenticated;

create policy "photos: lecture" on public.photos_progression
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_coach()));
create policy "photos: ajout avec accord" on public.photos_progression
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.a_donne_accord()));
create policy "photos: suppression" on public.photos_progression
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ─── Espaces de stockage privés ─────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',     'avatars',     false, 2097152, array['image/jpeg', 'image/webp']),
  ('progression', 'progression', false, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Chaque fichier est rangé dans un dossier au nom de son propriétaire : <uid>/<fichier>
create policy "stockage: lecture" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('avatars', 'progression') and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_coach())
      -- la photo du coach est visible de ses clients
      or (bucket_id = 'avatars' and exists (
            select 1 from public.profiles p
            where p.id::text = (storage.foldername(name))[1] and p.role = 'coach'))
    )
  );
create policy "stockage: ajout" on storage.objects
  for insert to authenticated
  with check (
    (storage.foldername(name))[1] = (select auth.uid())::text and (
      bucket_id = 'avatars'
      or (bucket_id = 'progression' and (select private.a_donne_accord()))
    )
  );
create policy "stockage: suppression" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'progression')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
