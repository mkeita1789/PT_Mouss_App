/* ═══ Préparation football : pré-saison (4 semaines) et trêve (2 semaines) ═══
   Contenu des programmes transmis par le coach, réécrit pour l'appli :
   même structure et mêmes charges, sans les visuels ni les coordonnées d'origine. */
import type { SeanceReath, SemaineReath, Txt } from "./reath-lca";

const b = (fr: string, en: string): Txt => ({ fr, en });

/* ─── Les circuits ─── */
export const GAINAGE: Txt[] = [
  b("Gainage face", "Front plank"),
  b("Gainage latéral droit", "Right side plank"),
  b("Gainage latéral gauche", "Left side plank"),
  b("Pont fessier dynamique", "Dynamic glute bridge"),
  b("Planche 2 appuis bras D – jambe G", "Bird plank right arm – left leg"),
  b("Planche 2 appuis bras G – jambe D", "Bird plank left arm – right leg"),
  b("Superman", "Superman"),
];
export const RENFO: Txt[] = [
  b("Squat", "Squat"),
  b("Pompes", "Push-ups"),
  b("Fente avant pied droit devant", "Forward lunge, right foot front"),
  b("Fente avant pied gauche devant", "Forward lunge, left foot front"),
  b("Mollets excentriques", "Eccentric calf raises"),
  b("Glissade adducteurs excentrique", "Eccentric adductor slide"),
];
export const SPECIFIQUE: Txt[] = [
  b("Ischios excentriques jambe droite", "Eccentric hamstrings, right leg"),
  b("Ischios excentriques jambe gauche", "Eccentric hamstrings, left leg"),
  b("Good morning jambe droite", "Single-leg good morning, right"),
  b("Good morning jambe gauche", "Single-leg good morning, left"),
  b("Squat sumo", "Sumo squat"),
];
export const ETIREMENTS: Txt[] = [
  b("Hanche", "Hip"),
  b("Fessiers et lombaires", "Glutes and lower back"),
  b("Psoas", "Hip flexors (psoas)"),
  b("Quadriceps", "Quadriceps"),
  b("Ischio-jambiers", "Hamstrings"),
  b("Fermeture de hanche jambe fléchie", "Hip closing, bent leg"),
  b("Ouverture de hanche jambe fléchie", "Hip opening, bent leg"),
];

/* ─── Blocs de séance ─── */
const course = (fr: string[], en: string[]): Txt[] => fr.map((f, i) => b(f, en[i] ?? f));
const bloc = (titre: Txt, lignes: Txt[], exos?: Txt[], format?: Txt, type: SeanceReath["type"] = "renfo"): SeanceReath => ({ type, titre, lignes, circuit: exos ? { format, exos } : undefined });
const repos: SeanceReath = { type: "repos", titre: b("Repos", "Rest"), lignes: [] };
const collectif: SeanceReath = { type: "repos", titre: b("Reprise des entraînements collectifs", "Back to team training"), lignes: [], info: true };

const etirements = (tours: number): Txt => b(`Étirements et mobilité : tenir 20" par position, ${tours} tour${tours > 1 ? "s" : ""}`, `Stretching and mobility: hold each position 20", ${tours} round${tours > 1 ? "s" : ""}`);
const specifique = (reps: number): Txt => b(`Prévention spécifique : 3 × ${reps} répétitions par exercice`, `Specific prevention: 3 × ${reps} reps per exercise`);
const gainage = (format: string, tours: number): Txt => b(`Gainage ${format}, ${tours} tours`, `Core ${format}, ${tours} rounds`);
const renfo = (reps: number, tours: number): Txt => b(`Renforcement : ${reps} répétitions par exercice, ${tours} tours`, `Strength: ${reps} reps per exercise, ${tours} rounds`);

/* Séance course + étirements (+ prévention) */
const jourCourse = (titre: Txt, run: Txt[], extras: Txt[], exos: Txt[]): SeanceReath => ({ type: "course", titre, lignes: [...run, ...extras], circuit: { exos } });

export const PRESAISON: SemaineReath[] = [
  {
    n: 1,
    theme: b("Remise en route", "Getting going again"),
    jours: [
      repos,
      repos,
      jourCourse(b("Course + mobilité", "Run + mobility"), course(["Course 20' à 11 km/h"], ["Run 20' at 11 km/h"]), [etirements(2)], ETIREMENTS),
      repos,
      jourCourse(b("Course + mobilité", "Run + mobility"), course(["Course 30' à 11 km/h"], ["Run 30' at 11 km/h"]), [etirements(1)], ETIREMENTS),
      repos,
      repos,
    ],
  },
  {
    n: 2,
    theme: b("Volume et premier fractionné", "Volume and first intervals"),
    jours: [
      jourCourse(b("Course + prévention", "Run + prevention"), course(["Course 40' à 11 km/h"], ["Run 40' at 11 km/h"]), [specifique(8), etirements(1)], [...SPECIFIQUE, ...ETIREMENTS]),
      bloc(b("Gainage + renforcement", "Core + strength"), [gainage(`45" / 15"`, 3), renfo(15, 2)], [...GAINAGE, ...RENFO]),
      jourCourse(b("Course + prévention", "Run + prevention"), course(["Course 30' à 13 km/h"], ["Run 30' at 13 km/h"]), [specifique(10), etirements(2)], [...SPECIFIQUE, ...ETIREMENTS]),
      repos,
      jourCourse(b("Fractionné long", "Long intervals"), course(["Échauffement : footing 10'", "3 × 10' à 14 km/h", "Récupération entre les blocs : 2' à ≈ 9 km/h"], ["Warm-up: 10' easy jog", "3 × 10' at 14 km/h", "Recovery between blocks: 2' at ≈ 9 km/h"]), [etirements(1)], ETIREMENTS),
      bloc(b("Gainage + prévention + renforcement", "Core + prevention + strength"), [gainage(`45" / 15"`, 4), specifique(10), renfo(15, 3)], [...GAINAGE, ...SPECIFIQUE, ...RENFO]),
      repos,
    ],
  },
  {
    n: 3,
    theme: b("Intermittent 1'/1' et volume", "1'/1' intervals and volume"),
    jours: [
      jourCourse(b("Course + prévention", "Run + prevention"), course(["Course 45' à 11 km/h"], ["Run 45' at 11 km/h"]), [specifique(12), etirements(1)], [...SPECIFIQUE, ...ETIREMENTS]),
      bloc(b("Gainage + renforcement", "Core + strength"), [gainage(`1' / 15"`, 3), renfo(20, 2)], [...GAINAGE, ...RENFO]),
      jourCourse(b("Intermittent 1'/1'", "1'/1' intervals"), course(["Échauffement : footing 10'", "3 × 10' en 1'/1' : 15-16 km/h sur la minute d'effort, 10 km/h sur la minute de récup", "Entre les blocs : 2' à ≈ 9 km/h"], ["Warm-up: 10' easy jog", "3 × 10' of 1'/1': 15-16 km/h on the work minute, 10 km/h on the recovery minute", "Between blocks: 2' at ≈ 9 km/h"]), [etirements(1)], ETIREMENTS),
      bloc(b("Gainage + prévention + renforcement", "Core + prevention + strength"), [gainage(`1' / 15"`, 4), specifique(12), renfo(20, 3)], [...GAINAGE, ...SPECIFIQUE, ...RENFO]),
      jourCourse(b("Course longue + prévention", "Long run + prevention"), course(["Course 60' à 11 km/h"], ["Run 60' at 11 km/h"]), [specifique(16), etirements(2)], [...SPECIFIQUE, ...ETIREMENTS]),
      repos,
      repos,
    ],
  },
  {
    n: 4,
    theme: b("Dernier bloc avant la reprise", "Last block before the restart"),
    jours: [
      jourCourse(b("Intermittent 1'/1'", "1'/1' intervals"), course(["Échauffement : footing 10'", "3 × 12' en 1'/1' : 15-16 km/h effort, 10 km/h récup", "Entre les blocs : 2' à ≈ 9 km/h"], ["Warm-up: 10' easy jog", "3 × 12' of 1'/1': 15-16 km/h work, 10 km/h recovery", "Between blocks: 2' at ≈ 9 km/h"]), [etirements(1)], ETIREMENTS),
      bloc(b("Gainage + renforcement", "Core + strength"), [gainage(`1' / 15"`, 3), renfo(20, 2)], [...GAINAGE, ...RENFO]),
      collectif,
      collectif,
      collectif,
      collectif,
      collectif,
    ],
  },
];

/* ─── Trêve : couper sans tout arrêter ─── */
const PREVENTION_PERSO = b("+ tes 3 exercices de prévention personnalisés (envoyés par ton coach) : 8 à 12 répétitions", "+ your 3 personalised prevention exercises (sent by your coach): 8 to 12 reps");
const circuitTreve: Txt[] = [
  b("Circuit gainage et prévention : 45\" d'effort / 10\" de récup, 3 tours (≈ 20')", "Core and prevention circuit: 45\" work / 10\" rest, 3 rounds (≈ 20')"),
  PREVENTION_PERSO,
  b("Alterne positions statiques et dynamiques ; nombril rentré, fessiers serrés", "Mix static and dynamic positions; belly button in, glutes tight"),
];
const seanceTreve = (titre: Txt, run: Txt[]): SeanceReath => ({ type: "course", titre, lignes: [...circuitTreve, ...run], circuit: { exos: GAINAGE } });
const activite: SeanceReath = {
  type: "terrain",
  titre: b("Activité légère (sans foot)", "Light activity (no football)"),
  lignes: [b("Au choix : natation, pilates, randonnée, sports de raquette, un autre sport collectif…", "Your choice: swimming, pilates, hiking, racket sports, another team sport…")],
};

export const TREVE: SemaineReath[] = [
  {
    n: 1,
    theme: b("Couper et se régénérer", "Switch off and recharge"),
    jours: [
      activite,
      activite,
      activite,
      seanceTreve(b("Séance 1 · gainage + footing", "Session 1 · core + easy run"), [b("Course 30 à 40' : allure légère, effort modéré", "Run 30 to 40': easy pace, moderate effort")]),
      repos,
      seanceTreve(b("Séance 2 · gainage + allure soutenue", "Session 2 · core + steady pace"), [
        b("Course 15' allure légère, puis 2' de marche", "Run 15' easy pace, then walk 2'"),
        b("5 × (10\" de gammes dynamiques + 4 à 6' d'allure soutenue, effort assez difficile)", "5 × (10\" dynamic running drills + 4 to 6' steady pace, fairly hard effort)"),
      ]),
      repos,
    ],
  },
  {
    n: 2,
    theme: b("Réactiver avant la reprise", "Reactivate before the restart"),
    jours: [
      seanceTreve(b("Séance 3 · gainage + pyramide", "Session 3 · core + pyramid"), [
        b("Course 12' allure légère, puis 2' de marche", "Run 12' easy pace, then walk 2'"),
        b("Pyramide (26') : 1' - 1' - 2' - 1' - 1' - 3' - 1' - 1' - 2' - 1' - 1' à allure élevée, récup 1' entre les blocs", "Pyramid (26'): 1' - 1' - 2' - 1' - 1' - 3' - 1' - 1' - 2' - 1' - 1' at high pace, 1' rest between blocks"),
        b("Course 5' allure légère", "Run 5' easy pace"),
      ]),
      repos,
      seanceTreve(b("Séance 4 · gainage + footing", "Session 4 · core + easy run"), [b("Course 35 à 45' : allure légère, effort modéré", "Run 35 to 45': easy pace, moderate effort")]),
      repos,
      collectif,
      collectif,
      collectif,
    ],
  },
];

export const CONSEILS_TREVE = {
  fr: [
    "Cours sur terrain souple (herbe, sentiers) : évite le bitume et le tapis",
    "Couche-toi à des heures raisonnables et soigne tes petits bobos",
    "Bois au moins 1,5 L d'eau par jour",
    "Garde un œil sur la balance : évite les excès (soirées, repas copieux, chicha…)",
  ],
  en: [
    "Run on soft ground (grass, trails): avoid tarmac and the treadmill",
    "Go to bed at reasonable times and look after small niggles",
    "Drink at least 1.5 L of water a day",
    "Keep an eye on the scales: avoid excesses (parties, heavy meals, shisha…)",
  ],
};
export const CONSEILS_PRESAISON = {
  fr: [
    "Les vitesses (11, 13, 14, 15-16 km/h) sont données pour un joueur type : si ton coach a ta VMA, il peut les adapter",
    "Étirements : tiens chaque position 20\", sans à-coups, sans douleur",
    "Exercices excentriques : la descente est lente et contrôlée, c'est elle qui protège tes ischios et tes adducteurs",
  ],
  en: [
    "Speeds (11, 13, 14, 15-16 km/h) are for a typical player: if your coach has your MAS, they can adapt them",
    "Stretching: hold each position 20\", no bouncing, no pain",
    "Eccentric exercises: lower slowly and with control, that's what protects your hamstrings and adductors",
  ],
};

/* ─── Fiches exercices (consignes réécrites) ─── */
export const FICHES_PREPA: Record<string, { fr: string; en: string }> = {
  "Gainage face": { fr: "Sur les avant-bras et les pointes de pieds, corps aligné. Dos droit, fessiers serrés, ventre rentré.", en: "On forearms and toes, body in line. Straight back, glutes tight, belly in." },
  "Gainage latéral droit": { fr: "Coude droit sous l'épaule, corps bien droit de la tête aux pieds. Fessiers serrés, ventre rentré.", en: "Right elbow under the shoulder, body straight head to toe. Glutes tight, belly in." },
  "Gainage latéral gauche": { fr: "Coude gauche sous l'épaule, corps bien droit de la tête aux pieds. Fessiers serrés, ventre rentré.", en: "Left elbow under the shoulder, body straight head to toe. Glutes tight, belly in." },
  "Pont fessier dynamique": { fr: "Sur le dos, pieds largeur de bassin. Monte les fessiers le plus vite possible, redescends lentement.", en: "On your back, feet hip-width. Drive the hips up as fast as possible, lower slowly." },
  "Planche 2 appuis bras D – jambe G": { fr: "À quatre pattes puis en planche : lève le bras droit et la jambe gauche, cheville, hanche et épaule alignées. Fessiers serrés.", en: "From a plank: lift the right arm and left leg, ankle, hip and shoulder in line. Glutes tight." },
  "Planche 2 appuis bras G – jambe D": { fr: "Même chose avec le bras gauche et la jambe droite.", en: "Same with the left arm and right leg." },
  "Superman": { fr: "À plat ventre, bras tendus au-dessus de la tête, jambes tendues : décolle bras et jambes. Fessiers serrés, ventre rentré.", en: "Face down, arms overhead, legs straight: lift arms and legs. Glutes tight, belly in." },
  "Squat": { fr: "Pieds largeur d'épaules et parallèles. Fesses vers l'arrière, buste droit, descente lente. Remonte en soufflant, en poussant dans les talons.", en: "Feet shoulder-width and parallel. Hips back, chest up, slow descent. Come up breathing out, pushing through the heels." },
  "Pompes": { fr: "Mains largeur d'épaules. Descends jusqu'à 90° aux coudes, dos plat (fesses ni trop hautes ni trop basses). Remonte en soufflant, bras tendus.", en: "Hands shoulder-width. Lower to 90° at the elbows, flat back. Push up breathing out, arms straight." },
  "Fente avant pied droit devant": { fr: "Grand pas en avant avec 10 cm d'écart entre les pieds. Genou arrière vers le sol sans le toucher, buste droit, genou avant pas au-delà des orteils. Reviens pieds joints.", en: "Big step forward with 10 cm between the feet. Back knee towards the floor without touching, chest up, front knee not past the toes. Return feet together." },
  "Fente avant pied gauche devant": { fr: "Même chose, pied gauche devant.", en: "Same, left foot in front." },
  "Mollets excentriques": { fr: "Pointes de pieds sur une marche, talons dans le vide. Monte le plus haut possible, puis redescends lentement.", en: "Balls of the feet on a step, heels off. Rise as high as possible, then lower slowly." },
  "Glissade adducteurs excentrique": { fr: "Debout, fais glisser un pied sur le côté lentement en retenant la descente, pieds parallèles, jambe d'appui fléchie. Reviens. Fais les deux côtés.", en: "Standing, slide one foot out to the side slowly, controlling the descent, feet parallel, standing leg bent. Come back. Do both sides." },
  "Ischios excentriques jambe droite": { fr: "Sur le ventre, jambe droite pliée : la jambe gauche la pousse vers le sol pendant que la droite retient la descente, lentement.", en: "Face down, right leg bent: the left leg pushes it down while the right resists the descent, slowly." },
  "Ischios excentriques jambe gauche": { fr: "Même chose : la jambe droite pousse la gauche, qui retient la descente.", en: "Same: the right leg pushes the left, which resists the descent." },
  "Good morning jambe droite": { fr: "Debout sur la jambe droite : descends les mains vers le sol en montant la jambe gauche tendue derrière toi. Dos droit.", en: "Standing on the right leg: reach the hands to the floor while lifting the straight left leg behind you. Flat back." },
  "Good morning jambe gauche": { fr: "Debout sur la jambe gauche, même mouvement avec la jambe droite tendue.", en: "Standing on the left leg, same movement with the straight right leg." },
  "Squat sumo": { fr: "Pieds plus larges que les épaules, pointes vers l'extérieur. Fesses en arrière, buste droit, descente lente, remonte en poussant dans les talons.", en: "Feet wider than shoulders, toes out. Hips back, chest up, slow descent, push up through the heels." },
  "Hanche": { fr: "Étirements de la hanche en position assise ou au sol. Tiens 20\", sans à-coups.", en: "Hip stretches, sitting or on the floor. Hold 20\", no bouncing." },
  "Fessiers et lombaires": { fr: "Sur le dos, ramène un genou vers l'épaule opposée. Ne décolle pas les fesses du sol.", en: "On your back, pull one knee towards the opposite shoulder. Keep your hips on the floor." },
  "Psoas": { fr: "Position de fente, genou arrière au sol : bascule le bassin vers l'avant sans cambrer. Tu peux lever le bras du côté étiré.", en: "Lunge position, back knee down: tilt the pelvis forward without arching. You can raise the arm on the stretched side." },
  "Quadriceps": { fr: "En fente, genou arrière au sol : attrape le pied arrière et rapproche le talon des fesses, buste droit.", en: "In a lunge, back knee down: hold the back foot and bring the heel towards the glutes, chest up." },
  "Ischio-jambiers": { fr: "Jambe tendue devant, pointe de pied vers soi : penche le buste vers l'avant en gardant le dos droit. Jamais d'à-coups.", en: "Straight leg in front, toes up: lean forward with a flat back. Never bounce." },
  "Fermeture de hanche jambe fléchie": { fr: "Debout, genou fléchi à 90° : ramène le genou de l'extérieur vers l'intérieur, en contrôle.", en: "Standing, knee bent at 90°: bring the knee from outside to inside, under control." },
  "Ouverture de hanche jambe fléchie": { fr: "Debout, genou fléchi à 90° : ouvre le genou de l'intérieur vers l'extérieur, en contrôle.", en: "Standing, knee bent at 90°: open the knee from inside to outside, under control." },
};
