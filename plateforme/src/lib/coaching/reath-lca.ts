/* ═══ Réathlétisation après ligament croisé antérieur (LCA) ═══
   Plan de reprise course → terrain en 6 semaines, transcrit tel quel du
   programme du coach (PDF « Reprise LCA »). La progression d'une semaine
   à l'autre est validée par le coach, pas seulement par le calendrier. */
import type { Lang } from "@/lib/i18n";

export type TypeSeanceReath = "course" | "renfo" | "terrain" | "repos";
export type SeanceReath = {
  type: TypeSeanceReath;
  titre: string;
  lignes: string[];
  circuit?: { format?: string; exos: string[] };
};
export type SemaineReath = { n: number; theme: string; jours: SeanceReath[] };

export const JOURS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const JOURS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const repos: SeanceReath = { type: "repos", titre: "Repos", lignes: [] };
const course = (titre: string, ...lignes: string[]): SeanceReath => ({ type: "course", titre, lignes });
const terrain = (titre: string, ...lignes: string[]): SeanceReath => ({ type: "terrain", titre, lignes });
const renfo = (format: string | undefined, exos: string[], titre = "Renfo"): SeanceReath => ({ type: "renfo", titre, lignes: [], circuit: { format, exos } });

const CIRCUIT_1 = ["Squat", "Gainage ventral", "Fentes avant", "Pompes", "Fentes arrières", "Gainage costal D", "Levée de bassin", "Gainage costal G"];
const CIRCUIT_2 = ["Squat rebond", "Gainage ventral", "Fentes rebonds avant", "Pompes", "Fentes rebonds arrières", "Gainage costal D", "Levée de bassin D/G", "Gainage costal G"];
const CIRCUIT_3 = ["Squat jump", "Gainage ventral", "Fentes sautées", "Pompes sautées", "Impulsions latérales", "Gainage costal D", "Levée de bassin D/G", "Gainage costal G"];

export const REATH_LCA: SemaineReath[] = [
  {
    n: 1,
    theme: "Reprise de la course",
    jours: [
      course("Footing", "2 × 8' allure libre"),
      renfo("allure libre", CIRCUIT_1),
      course("Footing", "2 × 12' allure libre"),
      renfo("4 tours · 20\" effort / 20\" récup", CIRCUIT_1),
      course("Footing", "2 × 15' allure libre"),
      repos,
      repos,
    ],
  },
  {
    n: 2,
    theme: "Volume et premières allures",
    jours: [
      course("Footing", "2 × 20' allure libre"),
      course("Footing", "45' allure libre"),
      repos,
      course("Allures + intermittent", "20' échauffement", "2 km à 4'55/km", "1 km à 4'50/km", "1 km à 4'45/km", "25' intermittent : 3 × 6' (récup 2')"),
      renfo("4 tours · 30\" effort / 20\" récup", CIRCUIT_1),
      course("Allures + intermittent", "20' échauffement", "2 km à 4'50/km", "1 km à 4'45/km", "1 km à 4'40/km", "25' intermittent : 6 × 3' (récup 2')"),
      repos,
    ],
  },
  {
    n: 3,
    theme: "Intermittent court et premiers rebonds",
    jours: [
      course("Allures + intermittent", "20' échauffement", "2 km à 4'45/km", "2 km à 4'40/km", "25' intermittent : 2 × 8 × 1'30\" (240-250 m)"),
      repos,
      course("Allures + intermittent", "20' échauffement", "2 km à 4'45/km", "1 km à 4'40/km", "1 km à 4'35/km", "25' intermittent : 2 × 7 × 1'/1' (270-280 m)"),
      course("Tempo + pyramide", "20' à 4'37/km de moyenne", "Pyramide 3' - 2' - 1' - 1' - 2' - 3'"),
      renfo("4 tours · 20\" effort / 20\" récup", CIRCUIT_2),
      course("Footing", "45' allure libre"),
      repos,
    ],
  },
  {
    n: 4,
    theme: "Intermittent 30\"/30\" et allers-retours",
    jours: [
      renfo("4 tours · 30\" effort / 20\" récup", CIRCUIT_2),
      course("Allures + intermittent", "20' échauffement", "1 km à 4'45/km", "2 km à 4'40/km", "1 km à 4'35/km", "25' intermittent : 2 × 10 × 40\"/20\" (100 m aller-retour)"),
      repos,
      course("Allures + intermittent", "20' échauffement", "1 km à 4'45/km", "1 km à 4'40/km", "2 km à 4'35/km", "25' intermittent : 2 × 12 × 30\"/30\" (largeur de terrain aller-retour)"),
      course("Allures + intermittent", "20' échauffement", "1 km à 4'45/km", "3 km à 4'35/km", "25' intermittent : 2 × 12 × 30\"/20\" (100 + 50 m)"),
      course("Footing", "40' allure libre"),
      repos,
    ],
  },
  {
    n: 5,
    theme: "Pliométrie et appuis",
    jours: [
      course("Allures + intermittent", "20' échauffement", "2 km à 4'40/km", "2 km à 4'30/km", "25' intermittent : 2 × 14 × 30\"/15\" (100 m + largeur de terrain)"),
      renfo(undefined, CIRCUIT_3),
      terrain("Gammes + appuis axiaux", "15' gammes", "10' appuis axiaux", "25' intermittent : 3 × 12 × 20\"/20\" (100 m)"),
      repos,
      terrain("Gammes + appuis axiaux", "15' gammes", "10' appuis axiaux", "25' intermittent : 2 × 14 × 15\"/15\" (85 m)"),
      course("Fartlek 40'", "2 km d'échauffement allure libre", "8 × 3' (récup 1')"),
      repos,
    ],
  },
  {
    n: 6,
    theme: "Appuis latéraux et vitesse",
    jours: [
      terrain("Gammes + appuis latéraux", "15' gammes", "15' appuis latéraux", "20' intermittent : 2 × 8 × 10\"/20\" (60 m)"),
      terrain("Gammes + appuis latéraux", "15' gammes", "15' appuis latéraux", "20' intermittent"),
      repos,
      renfo("WOD", ["100 squat jump", "100 pompes", "100 fentes sautées", "100 impulsions latérales", "150 levées de bassin"], "Renfo WOD"),
      terrain("Gammes + appuis latéraux", "15' gammes", "15' appuis latéraux", "20' intermittent : 3 × 6 × 5\"/25\" (30 m)"),
      repos,
      repos,
    ],
  },
];

export const NB_SEMAINES = REATH_LCA.length;

/** Jours à faire dans une semaine (hors repos) */
export const joursActifs = (s: SemaineReath) => s.jours.map((j, i) => ({ j, i })).filter(({ j }) => j.type !== "repos");

/* Règle de la douleur : au-delà, on lève le pied et on prévient le coach */
export const DOULEUR_MAX = 3;
export const alerteGenou = (douleur: number | null, gonflement: boolean) => gonflement || (douleur ?? 0) > DOULEUR_MAX;

/* Critères avant d'inscrire une cliente (cochés par le coach) */
export const CRITERES_ENTREE = {
  fr: [
    "Feu vert du chirurgien ou du kiné pour reprendre la course",
    "Extension complète du genou, flexion d'au moins 120°",
    "Pas de gonflement du genou (ou très léger et stable)",
    "Marche, escaliers et squat à deux jambes sans douleur",
    "10 squats sur une jambe contrôlés, genou dans l'axe",
  ],
  en: [
    "Green light from the surgeon or physio to start running",
    "Full knee extension, at least 120° of flexion",
    "No knee swelling (or very slight and stable)",
    "Walking, stairs and double-leg squat without pain",
    "10 controlled single-leg squats, knee in line",
  ],
};

/* Avant le retour à l'entraînement collectif (après la semaine 6) */
export const CRITERES_SORTIE = {
  fr: [
    "Tests de sauts sur une jambe : au moins 90 % de la jambe saine",
    "Force du quadriceps et des ischios : au moins 90 % de la jambe saine",
    "Changements de direction à pleine vitesse sans appréhension",
    "Aucune douleur ni gonflement après les séances de la semaine 6",
    "Feu vert du chirurgien ou du staff médical",
  ],
  en: [
    "Single-leg hop tests: at least 90% of the healthy leg",
    "Quadriceps and hamstring strength: at least 90% of the healthy leg",
    "Full-speed changes of direction without apprehension",
    "No pain or swelling after week 6 sessions",
    "Green light from the surgeon or medical staff",
  ],
};

/* ─── Traduction anglaise des textes du plan ─── */
const EN: [RegExp, string][] = [
  [/Reprise de la course/g, "Back to running"],
  [/Volume et premières allures/g, "Volume and first paces"],
  [/Intermittent court et premiers rebonds/g, "Short intervals and first bounces"],
  [/Intermittent 30"\/30" et allers-retours/g, "30\"/30\" intervals and shuttles"],
  [/Pliométrie et appuis/g, "Plyometrics and footwork"],
  [/Appuis latéraux et vitesse/g, "Lateral footwork and speed"],
  [/Allures \+ intermittent/g, "Paces + intervals"],
  [/Tempo \+ pyramide/g, "Tempo + pyramid"],
  [/Gammes \+ appuis axiaux/g, "Running drills + linear footwork"],
  [/Gammes \+ appuis latéraux/g, "Running drills + lateral footwork"],
  [/Renfo WOD/g, "Strength WOD"],
  [/^Renfo$/g, "Strength"],
  [/^Repos$/g, "Rest"],
  [/Footing/g, "Easy run"],
  [/allure libre/g, "easy pace"],
  [/échauffement/g, "warm-up"],
  [/d'warm-up/g, "warm-up"],
  [/de moyenne/g, "average"],
  [/intermittent/g, "intervals"],
  [/\(récup /g, "(rest "],
  [/effort \/ /g, "work / "],
  [/ récup/g, " rest"],
  [/aller-retour/g, "there and back"],
  [/largeur de terrain/g, "pitch width"],
  [/ à (\d)/g, " at $1"],
  [/Pyramide/g, "Pyramid"],
  [/gammes/g, "running drills"],
  [/appuis axiaux/g, "linear footwork"],
  [/appuis latéraux/g, "lateral footwork"],
  [/tours/g, "rounds"],
  [/Gainage ventral/g, "Front plank"],
  [/Gainage costal D/g, "Side plank (right)"],
  [/Gainage costal G/g, "Side plank (left)"],
  [/Fentes rebonds avant/g, "Forward bounce lunges"],
  [/Fentes rebonds arrières/g, "Reverse bounce lunges"],
  [/Fentes avant/g, "Forward lunges"],
  [/Fentes arrières/g, "Reverse lunges"],
  [/fentes sautées|Fentes sautées/g, "jump lunges"],
  [/Pompes sautées/g, "Plyo push-ups"],
  [/pompes|Pompes/g, "push-ups"],
  [/Impulsions latérales|impulsions latérales/g, "lateral bounds"],
  [/Levée de bassin D\/G/g, "Glute bridge (R/L)"],
  [/levées de bassin|Levée de bassin/g, "glute bridges"],
  [/Squat rebond/g, "Bounce squat"],
];
export function tr(lang: Lang, s: string): string {
  if (lang === "fr") return s;
  let out = s;
  for (const [re, by] of EN) out = out.replace(re, by);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/* Petit lexique, affiché dans la page */
export const LEXIQUE = {
  fr: [
    ["Allure libre", "à l'aise, tu peux parler en courant."],
    ["4'45/km", "4 min 45 s pour faire 1 km."],
    ["30\"/15\"", "30 s d'effort rapide, 15 s de récupération (marche ou trot)."],
    ["Récup 2'", "2 minutes de récupération entre les répétitions."],
    ["Gammes", "éducatifs de course : talons-fesses, montées de genoux, pas chassés…"],
    ["Appuis", "changements d'appuis rapides, dans l'axe (axiaux) ou sur les côtés (latéraux)."],
    ["Pyramide", "efforts de 3', 2', 1', 1', 2', 3' avec récupération égale."],
    ["Fartlek", "course où l'on alterne librement allure rapide et lente."],
  ],
  en: [
    ["Easy pace", "comfortable, you can talk while running."],
    ["4'45/km", "4 min 45 s per kilometre."],
    ["30\"/15\"", "30 s fast, 15 s recovery (walk or jog)."],
    ["Rest 2'", "2 minutes of recovery between reps."],
    ["Running drills", "butt kicks, high knees, side shuffles…"],
    ["Footwork", "quick foot changes, straight ahead (linear) or sideways (lateral)."],
    ["Pyramid", "efforts of 3', 2', 1', 1', 2', 3' with equal recovery."],
    ["Fartlek", "run freely alternating fast and easy pace."],
  ],
};
