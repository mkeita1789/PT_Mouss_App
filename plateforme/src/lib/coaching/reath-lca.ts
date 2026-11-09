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

/* Force lourde, sur une jambe : le manque de force du quadriceps et des ischios
   est le premier facteur de rechute. Deux séances par semaine, de plus en plus lourdes. */
const FORCE_A = ["Leg extension 90°→30° : 3 × 12 (léger, contrôlé)", "Presse à une jambe : 3 × 10 par jambe", "Pont fessier sur une jambe : 3 × 12 par jambe", "Leg curl : 3 × 10", "Mollets sur une jambe : 3 × 15", "Abduction à l'élastique : 2 × 15 par côté"];
const FORCE_B = ["Leg extension amplitude complète (si le kiné valide) : 4 × 8", "Split squat bulgare chargé : 4 × 8 par jambe", "RDL sur une jambe : 3 × 8 par jambe", "Nordic assisté : 3 × 5", "Descente de marche excentrique : 3 × 8 par jambe", "Mollets lestés sur une jambe : 3 × 12"];
const FORCE_C = ["Squat lourd : 4 × 5", "Split squat bulgare : 3 × 6 par jambe", "Nordic : 3 × 6", "Leg extension : 3 × 10", "Hip thrust : 3 × 8", "Adducteurs (Copenhague) : 3 × 20\" par côté"];
const force = (exos: string[], titre = "Force"): SeanceReath => ({ type: "renfo", titre, lignes: ["Charge : 2 répétitions en réserve, montée explosive, descente en 3 s", "Récup 2' entre les séries"], circuit: { exos } });
const forceEt = (titre: string, avant: string[], exos: string[]): SeanceReath => ({ type: "renfo", titre, lignes: avant, circuit: { exos } });
/* Pliométrie de qualité (remplace le volume) : peu de sauts, réception parfaite */
const PLIO = ["Squat jump : 4 × 6", "Fentes sautées : 3 × 6 par jambe", "Impulsions latérales : 3 × 6 par côté (tenue 2 s à la réception)", "Sauts sur une jambe vers l'avant : 3 × 5 par jambe", "Pompes sautées : 3 × 6", "Levée de bassin D/G : 3 × 12"];

export const REATH_LCA: SemaineReath[] = [
  {
    n: 1,
    theme: "Reprise de la course",
    jours: [
      course("Footing", "2 × 8' allure libre"),
      force(FORCE_A),
      course("Footing", "2 × 12' allure libre"),
      renfo("4 tours · 20\" effort / 20\" récup", CIRCUIT_1),
      course("Footing", "2 × 15' allure libre"),
      force(FORCE_A),
      repos,
    ],
  },
  {
    n: 2,
    theme: "Volume et premières allures",
    jours: [
      course("Footing", "2 × 20' allure libre"),
      forceEt("Footing + force", ["Footing 30' allure libre", "Puis la séance de force :"], FORCE_A),
      repos,
      course("Allures + intermittent", "20' échauffement", "2 km à {80}", "1 km à {82}", "1 km à {84}", "25' intermittent : 3 × 6' (récup 2')"),
      forceEt("Force + gainage", ["Force, puis 4 tours de gainage 30\" / 20\" (ventral, costal D, costal G)"], FORCE_A),
      course("Allures + intermittent", "20' échauffement", "2 km à {82}", "1 km à {84}", "1 km à {86}", "25' intermittent : 6 × 3' (récup 2')"),
      repos,
    ],
  },
  {
    n: 3,
    theme: "Intermittent court et premiers rebonds",
    jours: [
      course("Allures + intermittent", "20' échauffement", "2 km à {84}", "2 km à {86}", "25' intermittent : 2 × 8 × 1'30\" (240-250 m)"),
      force(FORCE_B),
      course("Allures + intermittent", "20' échauffement", "2 km à {84}", "1 km à {86}", "1 km à {87}", "25' intermittent : 2 × 7 × 1'/1' (270-280 m)"),
      course("Footing", "45' allure libre"),
      forceEt("Force + rebonds", ["Circuit rebonds : 4 tours 20\" / 20\"", "Puis la séance de force :"], [...CIRCUIT_2, ...FORCE_B]),
      course("Tempo + pyramide", "20' à {87} de moyenne", "Pyramide 3' - 2' - 1' - 1' - 2' - 3'"),
      repos,
    ],
  },
  {
    n: 4,
    theme: "Intermittent 30\"/30\" et allers-retours",
    jours: [
      forceEt("Force + rebonds", ["Circuit rebonds : 4 tours 30\" / 20\"", "Puis la séance de force :"], [...CIRCUIT_2, ...FORCE_B]),
      course("Allures + intermittent", "20' échauffement", "1 km à {84}", "2 km à {86}", "1 km à {87}", "25' intermittent : 2 × 10 × 40\"/20\" (100 m aller-retour)"),
      force(FORCE_B),
      course("Allures + intermittent", "20' échauffement", "1 km à {84}", "1 km à {86}", "2 km à {87}", "25' intermittent : 2 × 12 × 30\"/30\" (largeur de terrain aller-retour)"),
      course("Footing", "40' allure libre"),
      course("Allures + intermittent", "20' échauffement", "1 km à {84}", "3 km à {87}", "25' intermittent : 2 × 12 × 30\"/20\" (100 + 50 m)"),
      repos,
    ],
  },
  {
    n: 5,
    theme: "Pliométrie et appuis",
    jours: [
      course("Allures + intermittent", "20' échauffement", "2 km à {86}", "2 km à {89}", "25' intermittent : 2 × 14 × 30\"/15\" (100 m + largeur de terrain)"),
      forceEt("Pliométrie + force", ["Pliométrie : réception silencieuse, genou dans l'axe, arrêt dès que la qualité baisse", "Puis la séance de force :"], [...PLIO.slice(0, 4), ...FORCE_C]),
      terrain("Gammes + appuis axiaux", "15' gammes", "10' appuis axiaux", "Freinages : 6 × sprint 10 m + arrêt en 3 appuis", "25' intermittent : 3 × 12 × 20\"/20\" (100 m)"),
      repos,
      forceEt("Terrain + force", ["15' gammes", "10' appuis axiaux", "25' intermittent : 2 × 14 × 15\"/15\" (85 m)", "Puis la séance de force :"], FORCE_C),
      course("Fartlek 40'", "2 km d'échauffement allure libre", "8 × 3' (récup 1')"),
      repos,
    ],
  },
  {
    n: 6,
    theme: "Appuis latéraux et vitesse",
    jours: [
      terrain("Gammes + appuis latéraux", "15' gammes", "15' appuis latéraux", "Changements de direction à 45° : 6 × 2 par côté", "20' intermittent : 2 × 8 × 10\"/20\" (60 m)"),
      forceEt("Terrain + force", ["15' gammes", "15' appuis latéraux", "20' intermittent", "Puis la séance de force :"], FORCE_C),
      repos,
      forceEt("Pliométrie de qualité + force", ["Environ 80 sauts au total : la qualité avant le volume", "Puis la séance de force :"], [...PLIO, ...FORCE_C.slice(0, 3)], ),
      terrain("Gammes + appuis latéraux", "15' gammes", "15' appuis latéraux", "Changements de direction à 90° et réaction au signal : 6 × 2 par côté", "Avec ballon : conduite + passe, 10'", "20' intermittent : 3 × 6 × 5\"/25\" (30 m)"),
      repos,
      repos,
    ],
  },
];

/* Plan d'origine du coach (avant ajustements), gardé pour référence */
export const ORIGINE = "PDF « Reprise LCA » — 6 semaines";

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
  [/Footing \+ force/g, "Easy run + strength"],
  [/Force \+ gainage/g, "Strength + core"],
  [/Force \+ rebonds/g, "Strength + bounces"],
  [/Pliométrie de qualité \+ force/g, "Quality plyometrics + strength"],
  [/Pliométrie \+ force/g, "Plyometrics + strength"],
  [/Terrain \+ force/g, "Field + strength"],
  [/^Force$/g, "Strength"],
  [/Puis la séance de force :/g, "Then the strength session:"],
  [/Force, puis 4 tours de gainage 30" \/ 20" \(ventral, costal D, costal G\)/g, "Strength, then 4 rounds of core 30\" / 20\" (front, right side, left side)"],
  [/Circuit rebonds : /g, "Bounce circuit: "],
  [/Charge : 2 répétitions en réserve, montée explosive, descente en 3 s/g, "Load: 2 reps in reserve, explosive up, 3 s down"],
  [/Récup 2' entre les séries/g, "Rest 2' between sets"],
  [/Pliométrie : réception silencieuse, genou dans l'axe, arrêt dès que la qualité baisse/g, "Plyometrics: quiet landing, knee in line, stop as soon as quality drops"],
  [/Environ 80 sauts au total : la qualité avant le volume/g, "About 80 jumps in total: quality over volume"],
  [/Leg extension 90°→30°/g, "Leg extension 90°→30°"],
  [/\(léger, contrôlé\)/g, "(light, controlled)"],
  [/amplitude complète \(si le kiné valide\)/g, "full range (if the physio agrees)"],
  [/Presse à une jambe/g, "Single-leg press"],
  [/Pont fessier sur une jambe/g, "Single-leg glute bridge"],
  [/Mollets lestés sur une jambe/g, "Weighted single-leg calf raises"],
  [/Mollets sur une jambe/g, "Single-leg calf raises"],
  [/Abduction à l'élastique/g, "Band hip abduction"],
  [/Split squat bulgare chargé/g, "Loaded Bulgarian split squat"],
  [/Split squat bulgare/g, "Bulgarian split squat"],
  [/RDL sur une jambe/g, "Single-leg RDL"],
  [/Nordic assisté/g, "Assisted Nordic curl"],
  [/Descente de marche excentrique/g, "Eccentric step-down"],
  [/Squat lourd/g, "Heavy squat"],
  [/Adducteurs \(Copenhague\)/g, "Copenhagen adductors"],
  [/Sauts sur une jambe vers l'avant/g, "Forward single-leg hops"],
  [/\(tenue 2 s à la réception\)/g, "(hold the landing 2 s)"],
  [/Freinages : 6 × sprint 10 m \+ arrêt en 3 appuis/g, "Decelerations: 6 × 10 m sprint + stop in 3 steps"],
  [/Changements de direction à 90° et réaction au signal/g, "90° changes of direction reacting to a signal"],
  [/Changements de direction à 45°/g, "45° changes of direction"],
  [/Avec ballon : conduite \+ passe/g, "With the ball: dribble + pass"],
  [/Footing (\d+)' allure libre/g, "Easy run $1' easy pace"],
  [/par jambe/g, "per leg"],
  [/par côté/g, "per side"],
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
  [/ à ([\d{])/g, " at $1"],
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
/* « {84} » = 84 % de la VMA. Avec la VMA de la cliente, on affiche aussi l'allure. */
export function allure(pct: number, vma: number | null): string | null {
  if (!vma) return null;
  const minKm = 60 / ((vma * pct) / 100);
  let m = Math.floor(minKm), sec = Math.round((minKm - m) * 60);
  if (sec === 60) { m += 1; sec = 0; }
  return `${m}'${String(sec).padStart(2, "0")}/km`;
}
export function avecVma(lang: Lang, s: string, vma: number | null): string {
  return s.replace(/\{(\d+)\}/g, (_, p) => {
    const a = allure(Number(p), vma);
    return `${p} % ${lang === "en" ? "MAS" : "VMA"}${a ? ` (≈ ${a})` : ""}`;
  });
}

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
    ["84 % VMA", "84 % de ta vitesse maximale aérobie. Ex. VMA 14 km/h → 11,8 km/h, soit 5'06/km."],
    ["30\"/15\"", "30 s d'effort rapide, 15 s de récupération (marche ou trot)."],
    ["Récup 2'", "2 minutes de récupération entre les répétitions."],
    ["Gammes", "éducatifs de course : talons-fesses, montées de genoux, pas chassés…"],
    ["Appuis", "changements d'appuis rapides, dans l'axe (axiaux) ou sur les côtés (latéraux)."],
    ["Pyramide", "efforts de 3', 2', 1', 1', 2', 3' avec récupération égale."],
    ["Fartlek", "course où l'on alterne librement allure rapide et lente."],
  ],
  en: [
    ["Easy pace", "comfortable, you can talk while running."],
    ["84% MAS", "84% of your maximal aerobic speed. E.g. MAS 14 km/h → 11.8 km/h, i.e. 5'06/km."],
    ["30\"/15\"", "30 s fast, 15 s recovery (walk or jog)."],
    ["Rest 2'", "2 minutes of recovery between reps."],
    ["Running drills", "butt kicks, high knees, side shuffles…"],
    ["Footwork", "quick foot changes, straight ahead (linear) or sideways (lateral)."],
    ["Pyramid", "efforts of 3', 2', 1', 1', 2', 3' with equal recovery."],
    ["Fartlek", "run freely alternating fast and easy pace."],
  ],
};
