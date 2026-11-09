/* Types partagés du moteur de coaching JIGI */

/** Catégorie SRA : S = gros polyarticulaire, A = intermédiaire, P = isolation, "-" = non chargé / non suivi */
export type Categorie = "S" | "A" | "P" | "-";

export type Objectif =
  | "Développer mes fessiers 🍑"
  | "Prendre du muscle"
  | "Perdre du gras"
  | "Performance sportive ⚽"
  | "Me sentir mieux";

/** Réponses du bilan (valeurs FR = identifiants figés, comme dans la PWA) */
export type Bilan = {
  prenom: string;
  objectif: Objectif;
  niveau: string;
  freq: string;
  materiel: string;
  sante: string;
  sommeil: string;
  periode?: string;
  allure?: string;
};

export type Exercice = {
  n: string;
  s: number;
  r: string;
  rir: string;
  c: Categorie;
  drop?: boolean;
  note: string;
};

export type Jour = { d: string; f: string; crit?: boolean; ex: Exercice[] };

export type Phase = {
  n: string;
  pct: string;
  reps: string | null;
  rir: string;
  drop: boolean;
  mult: number;
  tip: string;
};

export type PhaseCourante = Phase & { week: number; len: number; cycle: number; label: string };

export type Programme = {
  proto: string;
  icon: string;
  officiel: boolean;
  cle: string;
  marqueur: string;
  zone: [number, number];
  days: Jour[];
  neat?: string;
  repos?: boolean;
  citation?: string;
  phase?: string;
  phaseNom?: string;
  stats?: string;
  phaseTip?: string;
  deload?: boolean;
};

export type FicheExercice = {
  video?: string;
  groupe: string;
  primaires: string;
  secondaires: string;
  diff: string;
  materiel: string;
  tempo: string;
  repos: string;
  depart: string;
  arrivee: string;
  points: string[];
  erreurs: string[];
  coach: string;
  variantes: { deb: string; int: string; av: string };
  alternatives: string;
};

export type Checkin = { sommeil: string; energie: string; corps: string };
