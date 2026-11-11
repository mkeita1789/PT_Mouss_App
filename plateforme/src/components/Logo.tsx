/* Logo Baara (« travail » en bambara) : un ballon de foot monté sur une barre de musculation.
   Le doré suit la couleur du thème choisi ; les détails du ballon reprennent le fond de la tuile. */
export const LOGO = {
  barre: "M4 30.4h56v3.2H4z",
  disqueG: "M5.5 24.5h1.6a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z",
  disqueD: "M56.9 24.5h1.6a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z",
  pentagone: "M32 25.4L38.28 29.96L35.88 37.34H28.12L25.72 29.96Z",
  coutures: "M32 23.2V17.6M40.37 29.28L45.7 27.55M37.17 39.12L40.46 43.65M26.83 39.12L23.54 43.65M23.63 29.28L18.3 27.55",
};
const FOND = "#0b0a08";

export function LogoMarque({ taille = 24 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="4 4 56 56" aria-hidden>
      <g fill="currentColor">
        <path d={LOGO.barre} />
        <path d={LOGO.disqueG} />
        <path d={LOGO.disqueD} />
        <circle cx="32" cy="32" r="16" />
      </g>
      <path d={LOGO.pentagone} fill={FOND} />
      <path d={LOGO.coutures} stroke={FOND} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Tuile du logo (en-têtes, menu) */
export function Logo() {
  return (
    <span className="monogram" aria-label="Baara">
      <LogoMarque />
    </span>
  );
}

/** Nom + signature */
export function Marque() {
  return (
    <span>
      <div className="wordmark">BAARA</div>
    </span>
  );
}
