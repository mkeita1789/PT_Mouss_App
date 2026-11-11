-- ═══════════════════════════════════════════════
-- Baara — rôles de club, invitations par rôle, messages d'équipe,
-- suivi du préparateur physique avec l'accord du joueur
-- ═══════════════════════════════════════════════

-- ─── Nouveaux rôles : président, dirigeant ───
alter table public.equipe_membres drop constraint equipe_membres_role_check;
alter table public.equipe_membres add constraint equipe_membres_role_check
  check (role in ('entraineur', 'adjoint', 'prepa', 'media', 'president', 'dirigeant', 'joueur'));

-- Mon rôle dans une équipe (security definer : pas de récursion RLS)
create function private.mon_role(p_equipe uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.equipe_membres where equipe_id = p_equipe and user_id = (select auth.uid()) limit 1;
$$;
create function private.mon_membre(p_equipe uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.equipe_membres where equipe_id = p_equipe and user_id = (select auth.uid()) limit 1;
$$;

-- Le président peut aussi faire vivre l'identité du club (logo, couleurs, valeurs)
drop policy "équipes: modification par le staff" on public.equipes;
create policy "équipes: modification par le staff ou le président" on public.equipes
  for update to authenticated
  using (id in (select private.equipes_gerees()) or private.mon_role(id) = 'president')
  with check (id in (select private.equipes_gerees()) or private.mon_role(id) = 'president');

-- ─── Invitations par rôle (envoyées par l'entraîneur) ───
create table public.equipe_invitations (
  code         text primary key check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  equipe_id    uuid not null references public.equipes (id) on delete cascade,
  role         text not null check (role in ('entraineur', 'adjoint', 'prepa', 'media', 'president', 'dirigeant')),
  cree_par     uuid not null references public.profiles (id) on delete cascade,
  cree_le      timestamptz not null default now(),
  expire_le    timestamptz not null default now() + interval '14 days',
  utilisee_par uuid references public.profiles (id) on delete set null,
  utilisee_le  timestamptz
);
create index equipe_invitations_equipe on public.equipe_invitations (equipe_id);
alter table public.equipe_invitations enable row level security;
create policy "invitations d'équipe: lecture par l'entraîneur" on public.equipe_invitations
  for select to authenticated using (private.mon_role(equipe_id) = 'entraineur');
create policy "invitations d'équipe: annulation par l'entraîneur" on public.equipe_invitations
  for delete to authenticated using (private.mon_role(equipe_id) = 'entraineur');

create function public.creer_invitation_equipe(p_equipe uuid, p_role text)
returns text
language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if private.mon_role(p_equipe) is distinct from 'entraineur' then raise exception 'refusé'; end if;
  if p_role not in ('entraineur', 'adjoint', 'prepa', 'media', 'president', 'dirigeant') then raise exception 'refusé'; end if;
  if (select count(*) from public.equipe_invitations where equipe_id = p_equipe and utilisee_par is null and expire_le > now()) >= 30 then raise exception 'trop d''invitations'; end if;
  for essai in 1..20 loop
    c := private.nouveau_code();
    begin
      if exists (select 1 from public.equipes where code = c) then continue; end if;
      insert into public.equipe_invitations (code, equipe_id, role, cree_par) values (c, p_equipe, p_role, (select auth.uid()));
      return c;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'code indisponible';
end;
$$;

-- Rejoindre : code d'équipe = joueur ; code d'invitation = le rôle prévu (une seule fois, 14 jours)
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
    select * into inv from public.equipe_invitations i where i.code = c and i.utilisee_par is null and i.expire_le > now() for update;
    if inv.code is null then return; end if;
    e := inv.equipe_id; r := inv.role;
    update public.equipe_invitations set utilisee_par = u, utilisee_le = now() where code = c;
  end if;
  insert into public.equipe_membres (equipe_id, user_id, nom, role)
  select e, u, coalesce(nullif(p.prenom, ''), 'Membre'), r from public.profiles p where p.id = u
  on conflict (equipe_id, user_id) do update set role = case when r = 'joueur' then public.equipe_membres.role else excluded.role end;
  return query select q.id, q.nom from public.equipes q where q.id = e;
end;
$$;
revoke execute on function public.creer_invitation_equipe(uuid, text) from public, anon;
grant execute on function public.creer_invitation_equipe(uuid, text) to authenticated;

-- ─── Messages d'équipe ───
-- Qui écrit : entraîneur, adjoint, préparateur, président, dirigeant.
-- À qui : tous, les joueurs, le staff (tous les non-joueurs), ou des membres choisis.
create table public.equipe_messages (
  id            uuid primary key default gen_random_uuid(),
  equipe_id     uuid not null references public.equipes (id) on delete cascade,
  auteur_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  auteur_nom    text not null check (char_length(auteur_nom) between 1 and 60),
  auteur_role   text not null,
  cible         text not null check (cible in ('tous', 'joueurs', 'staff', 'selection')),
  destinataires uuid[] not null default '{}',
  texte         text not null check (char_length(texte) between 1 and 1000),
  cree_le       timestamptz not null default now(),
  check (cible <> 'selection' or cardinality(destinataires) between 1 and 60)
);
create index equipe_messages_equipe on public.equipe_messages (equipe_id, cree_le desc);
alter table public.equipe_messages enable row level security;

create policy "messages d'équipe: lecture par les destinataires" on public.equipe_messages
  for select to authenticated
  using (
    equipe_id in (select private.mes_equipes()) and (
      auteur_id = (select auth.uid())
      or cible = 'tous'
      or (cible = 'joueurs' and private.mon_role(equipe_id) = 'joueur')
      or (cible = 'staff' and private.mon_role(equipe_id) <> 'joueur')
      or (cible = 'selection' and private.mon_membre(equipe_id) = any (destinataires))
    )
  );
create policy "messages d'équipe: envoi" on public.equipe_messages
  for insert to authenticated
  with check (
    auteur_id = (select auth.uid())
    and private.mon_role(equipe_id) in ('entraineur', 'adjoint', 'prepa', 'president', 'dirigeant')
    and auteur_role = private.mon_role(equipe_id)
  );
create policy "messages d'équipe: suppression par l'auteur" on public.equipe_messages
  for delete to authenticated using (auteur_id = (select auth.uid()));

-- Téléphones des destinataires d'un message (seulement par son auteur, juste après l'envoi)
create function public.abonnements_message(p_message uuid)
returns table (endpoint text, p256dh text, auth text, lang text)
language sql stable security definer set search_path = '' as $$
  select a.endpoint, a.p256dh, a.auth, a.lang
  from public.equipe_messages m
  join public.equipe_membres em on em.equipe_id = m.equipe_id and em.user_id is not null and em.user_id <> m.auteur_id
  join public.push_abonnements a on a.user_id = em.user_id
  where m.id = p_message and m.auteur_id = (select auth.uid()) and m.cree_le > now() - interval '2 minutes'
    and (
      m.cible = 'tous'
      or (m.cible = 'joueurs' and em.role = 'joueur')
      or (m.cible = 'staff' and em.role <> 'joueur')
      or (m.cible = 'selection' and em.id = any (m.destinataires))
    );
$$;
revoke execute on function public.abonnements_message(uuid) from public, anon;
grant execute on function public.abonnements_message(uuid) to authenticated;

-- ─── Préparateur de l'équipe : suivi individuel, seulement si le joueur accepte ───
create function public.accepter_suivi_equipe(p_equipe uuid, p_pro_membre uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare pro uuid;
begin
  if private.mon_role(p_equipe) is distinct from 'joueur' then raise exception 'refusé'; end if;
  select user_id into pro from public.equipe_membres where id = p_pro_membre and equipe_id = p_equipe and role = 'prepa' and user_id is not null;
  if pro is null or pro = (select auth.uid()) then raise exception 'refusé'; end if;
  insert into public.suivis (pro_id, sportif_id, metier_pro) values (pro, (select auth.uid()), 'prepa') on conflict do nothing;
end;
$$;
revoke execute on function public.accepter_suivi_equipe(uuid, uuid) from public, anon;
grant execute on function public.accepter_suivi_equipe(uuid, uuid) to authenticated;
