-- Programmes spéciaux : la table « reath » accueille aussi la pré-saison et la trêve.
-- Ressenti de séance (RPE 0-10) pour les programmes hors genou.
alter table public.reath drop constraint if exists reath_programme_check;
alter table public.reath add constraint reath_programme_check check (programme in ('lca', 'presaison', 'treve'));
alter table public.reath_seances add column rpe int check (rpe is null or rpe between 0 and 10);
