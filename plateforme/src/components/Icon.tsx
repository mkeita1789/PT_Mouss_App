/* Icônes vectorielles au trait (1.75 px), dessinées pour la plateforme. */
const PATHS = {
  accueil: "M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4.25v-5.5h-5.5v5.5H5A1.5 1.5 0 0 1 3.5 19z",
  programme: "M4 6.5h16M4 12h16M4 17.5h10M18.5 15.5v4M16.5 17.5h4",
  seance: "M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11",
  suivi: "M4 19.5h16M6.5 15.5l4-4.5 3 3 5-6.5M15 7.5h3.5V11",
  profil: "M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.25c.8-3.6 3.9-5.75 7.5-5.75s6.7 2.15 7.5 5.75",
  coach: "M4.5 19.5V9.75a1.5 1.5 0 0 1 .8-1.33l6-3.15a1.5 1.5 0 0 1 1.4 0l6 3.15a1.5 1.5 0 0 1 .8 1.33v9.75M9 19.5v-6h6v6M3 19.5h18",
  sortie: "M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14M10.5 16l4-4-4-4M14.5 12H4",
  chrono: "M12 20.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM12 9v4l2.5 1.5M9.5 2.5h5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  fleche: "M9.5 5.5 16 12l-6.5 6.5",
  retour: "M14.5 5.5 8 12l6.5 6.5",
  alerte: "M12 9v4.5M12 17h.01M10.3 4.4 2.9 17.3A2 2 0 0 0 4.6 20.3h14.8a2 2 0 0 0 1.7-3l-7.4-12.9a2 2 0 0 0-3.4 0Z",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 11v5M12 8h.01",
  video: "M4.5 6.5h10a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 16V8a1.5 1.5 0 0 1 1.5-1.5ZM16 10.5l5-3v9l-5-3",
  transfert: "M4 8h13.5M14 4.5 17.5 8 14 11.5M20 16H6.5M10 12.5 6.5 16l3.5 3.5",
  feuille: "M5 19c0-8 5.5-13.5 14-14-.5 8.5-6 14-14 14ZM5 19l7-7",
  plus: "M12 5v14M5 12h14",
  moins: "M5 12h14",
  photo: "M4.5 8h3l1.5-2.5h6L16.5 8h3A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-9A1.5 1.5 0 0 1 4.5 8ZM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  message: "M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z",
} as const;

export type NomIcone = keyof typeof PATHS;

export function Icon({ nom, taille = 20, className }: { nom: NomIcone; taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={PATHS[nom]} />
    </svg>
  );
}
