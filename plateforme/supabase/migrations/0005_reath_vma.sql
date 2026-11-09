-- VMA de la cliente (km/h), saisie par le coach : les allures du plan
-- sont exprimées en % de VMA et converties en min/km pour elle.
alter table public.reath add column vma numeric(4, 1) check (vma is null or vma between 8 and 25);
