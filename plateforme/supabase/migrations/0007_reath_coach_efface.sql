-- Changer le programme d'un client repart d'une feuille blanche : le coach peut effacer ses séances notées.
create policy "reath séances: effacement par le coach" on public.reath_seances
  for delete to authenticated using ((select private.is_coach()));
