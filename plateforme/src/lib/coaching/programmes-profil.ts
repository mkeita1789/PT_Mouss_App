/* ═══ Programmes par profil ═══
   Football : performance, maintien en saison, préparation de la saison.
   Forme : tonification, et versions « à la maison » des fessiers.
   Le lieu d'entraînement (terrain, salle, maison) choisit les exercices.
   Prévention intégrée côté foot : Nordic (ischio-jambiers) et Copenhagen
   (adducteurs), les deux exercices les mieux étayés pour réduire ces blessures. */
import type { Bilan, Jour, Phase, Programme } from "./types";

export type Contexte = {
  rir: string;
  reps: (fallback: string) => string;
  adjS: (series: number) => number;
  drop: boolean;
  deb: boolean;
  av: boolean;
  dos: boolean;
  gen: boolean;
  freq: number;
};

/* ─── Cycles ─── */
export const CYCLE_FOOT: Phase[] = [
  { n: "FORCE", pct: "80-85 %", reps: "4-6", rir: "2", drop: false, mult: 1, tip: "Lourd et propre. Une jambe forte est une jambe qui ne se blesse pas." },
  { n: "PUISSANCE", pct: "Charges moyennes, vitesse max", reps: "3-5", rir: "3", drop: false, mult: 1, tip: "Chaque répétition le plus vite possible. Si ça ralentit, on arrête la série." },
  { n: "VITESSE", pct: "Explosif", reps: "3-5", rir: "3", drop: false, mult: 0.9, tip: "Qualité avant quantité : récupération complète entre les sprints." },
  { n: "ALLÉGÉE", pct: "60 %", reps: "5", rir: "4", drop: false, mult: 0.6, tip: "Semaine légère volontaire : tu assimiles le travail des trois dernières." },
];
export const CYCLE_PRESA: Phase[] = [
  { n: "REPRISE 1", pct: "Léger", reps: "12-15", rir: "3", drop: false, mult: 0.8, tip: "On réveille le corps. Rien ne doit faire mal." },
  { n: "REPRISE 2", pct: "Modéré", reps: "10-12", rir: "2-3", drop: false, mult: 1, tip: "Le volume monte doucement, la VMA aussi." },
  { n: "DÉVELOPPEMENT", pct: "Soutenu", reps: "8-10", rir: "2", drop: false, mult: 1, tip: "La semaine la plus dure. Dors et mange en conséquence." },
  { n: "AFFÛTAGE", pct: "Vif", reps: "6-8", rir: "2", drop: false, mult: 0.8, tip: "Moins de volume, plus de vitesse : tu arrives frais au premier match." },
];
export const CYCLE_TONIQUE: Phase[] = [
  { n: "BASE", pct: "Modéré", reps: "12-15", rir: "2-3", drop: false, mult: 1, tip: "On apprend les mouvements. La technique avant la charge." },
  { n: "DENSITÉ", pct: "Modéré", reps: "12-15", rir: "2", drop: false, mult: 1, tip: "Moins de repos entre les exercices : le cœur travaille aussi." },
  { n: "INTENSITÉ", pct: "Soutenu", reps: "10-12", rir: "1-2", drop: true, mult: 1, tip: "Les charges montent. C'est là que le corps se dessine." },
  { n: "ALLÉGÉE", pct: "Léger", reps: "15", rir: "3-4", drop: false, mult: 0.7, tip: "On souffle pour mieux repartir. Marche et mobilité en plus." },
];

/* ─── Lieu d'entraînement ─── */
export const lieu = (p: Bilan) => ({
  salle: p.materiel === "En salle" || p.materiel === "Terrain + salle" || p.materiel === "Les deux",
  terrain: p.materiel === "Sur le terrain" || p.materiel === "Terrain + salle",
  maison: p.materiel === "À la maison",
});

/* ─── Football : performance ─── */
export function perfFoot(p: Bilan, x: Contexte): Programme {
  const L = lieu(p);
  const { rir, reps, adjS } = x;
  const charniere = x.dos
    ? { n: "Hip Thrust", c: "A" as const, note: "chaîne postérieure sans charge sur le dos" }
    : { n: "RDL", c: "S" as const, note: "ischios, dos neutre" };
  const prevention = [
    { n: "Nordic ischio-jambiers", s: adjS(3), r: x.deb ? "3-4" : "5-6", rir: "-", c: "-" as const, note: "🔴 prévention n°1 — descente la plus lente possible" },
    { n: "Copenhagen adducteurs", s: adjS(2), r: x.deb ? "6/côté (genou)" : "8/côté", rir: "-", c: "-" as const, note: "🔴 pubalgie — version genou pour commencer" },
  ];
  const forceSalle: Jour = { d: "FORCE", f: "Force bas du corps · prévention", ex: [
    { n: x.gen ? "Leg Press" : "Back Squat", s: adjS(4), r: reps("5"), rir, c: "S", note: "descente contrôlée, montée explosive" },
    { n: charniere.n, s: adjS(3), r: reps("6"), rir, c: charniere.c, note: charniere.note },
    { n: "Bulgarian Split Squat", s: adjS(3), r: "6/j", rir, c: "S", note: "la force d'appui, jambe par jambe" },
    ...prevention] };
  const puissanceSalle: Jour = { d: "PUISSANCE", f: "Puissance · haut du corps · gainage", ex: [
    { n: "Box Jump", s: adjS(4), r: "4", rir: "-", c: "-", note: "réception silencieuse, on remonte en marchant" },
    { n: "Hip Thrust", s: adjS(3), r: reps("5"), rir, c: "A", note: "montée explosive, pause en haut" },
    { n: "Traction / Lat Pulldown", s: adjS(3), r: reps("6-8"), rir, c: "A", note: "duels et protection du ballon" },
    { n: "Développé militaire", s: adjS(3), r: reps("6-8"), rir, c: "A", note: "épaules solides" },
    { n: "Pallof press", s: adjS(3), r: "10/côté", rir: "2", c: "-", note: "gainage anti-rotation" }] };
  const vitesseTerrain: Jour = { d: "VITESSE", f: "Terrain — vitesse et accélérations", ex: [
    { n: "Gammes athlétiques", s: 2, r: "20 m", rir: "-", c: "-", note: "montées de genoux, talons-fesses, pas chassés" },
    { n: "Sprint départ arrêté", s: adjS(6), r: "10 m", rir: "-", c: "-", note: "récup 1 min — 100 % à chaque fois" },
    { n: "Sprint lancé", s: adjS(4), r: "20 m", rir: "-", c: "-", note: "10 m d'élan, récup 2 min" },
    { n: "Bonds horizontaux", s: adjS(3), r: "5", rir: "-", c: "-", note: "pieds joints, réception stable" }] };
  const appuisTerrain: Jour = { d: "APPUIS", f: "Terrain — changements de direction · VMA", ex: [
    { n: "Test 505 / changements de direction", s: adjS(6), r: "1", rir: "-", c: "-", note: "appui bas, regard devant, récup 1 min" },
    { n: "Course 15-15", s: 2, r: "8 min", rir: "-", c: "-", note: "15 s vite / 15 s trot, à ta VMA" },
    { n: "Nordic ischio-jambiers", s: adjS(3), r: x.deb ? "3-4" : "5", rir: "-", c: "-", note: "🔴 avec un partenaire qui tient les chevilles" }] };
  const forceMaison: Jour = { d: "FORCE MAISON", f: "Force poids du corps · prévention", ex: [
    { n: "DB Split Squat", s: adjS(4), r: "8/j", rir, c: "S", note: "sac à dos lesté si trop facile" },
    { n: "DB Single Leg RDL", s: adjS(3), r: "8/j", rir, c: "A", note: "équilibre et ischios" },
    { n: "Pont fessier unilatéral", s: adjS(3), r: "12/j", rir: "2", c: "-", note: "bassin bien haut" },
    { n: "Nordic ischio-jambiers", s: adjS(3), r: "3-5", rir: "-", c: "-", note: "🔴 pieds calés sous un canapé" },
    { n: "Copenhagen adducteurs", s: adjS(2), r: "6/côté (genou)", rir: "-", c: "-", note: "🔴 jambe du dessus sur une chaise" }] };
  const plioMaison: Jour = { d: "PLIO", f: "Pliométrie · gainage", ex: [
    { n: "Squat sauté", s: adjS(4), r: "5", rir: "-", c: "-", note: "on saute le plus haut possible, réception douce" },
    { n: "Bonds latéraux", s: adjS(3), r: "6/côté", rir: "-", c: "-", note: "stabilise 1 s à chaque réception" },
    { n: "Fentes sautées", s: adjS(3), r: "6/j", rir: "-", c: "-", note: "genou dans l'axe" },
    { n: "Gainage latéral", s: adjS(3), r: "30 s/côté", rir: "-", c: "-", note: "hanches hautes" }] };

  const jours = L.maison ? [forceMaison, plioMaison, vitesseTerrain]
    : L.salle && L.terrain ? [forceSalle, vitesseTerrain, puissanceSalle, appuisTerrain]
    : L.terrain ? [vitesseTerrain, forceMaison, appuisTerrain, plioMaison]
    : [forceSalle, puissanceSalle, { ...forceSalle, d: "FORCE B", f: "Force unilatérale · prévention" }, vitesseTerrain];

  return {
    proto: "PERFORMANCE FOOT", icon: "⚡", officiel: true,
    cle: "Force, puissance puis vitesse : chaque bloc prépare le suivant. Nordic et Copenhagen à chaque semaine, sans exception.",
    marqueur: "Plus vite sur 10 m, zéro blessure",
    zone: x.deb ? [12, 20] : [18, 28],
    days: jours.slice(0, Math.max(1, Math.min(x.freq, 4))),
  };
}

/* ─── Football : maintien en saison ─── */
export function maintienSaison(p: Bilan, x: Contexte): Programme {
  const L = lieu(p);
  const force: Jour = L.salle
    ? { d: "J+2", f: "Force express (2 jours après le match)", ex: [
        { n: x.gen ? "Leg Press" : "Back Squat", s: 3, r: "4", rir: "3", c: "S", note: "lourd mais loin de l'échec" },
        { n: x.dos ? "Hip Thrust" : "RDL", s: 3, r: "5", rir: "3", c: x.dos ? "A" : "S", note: "chaîne postérieure" },
        { n: "Nordic ischio-jambiers", s: 2, r: "4-5", rir: "-", c: "-", note: "🔴 prévention" },
        { n: "Copenhagen adducteurs", s: 2, r: "6/côté", rir: "-", c: "-", note: "🔴 prévention" }] }
    : { d: "J+2", f: "Force express (2 jours après le match)", ex: [
        { n: "DB Split Squat", s: 3, r: "6/j", rir: "3", c: "S", note: "sac lesté si possible" },
        { n: "DB Single Leg RDL", s: 3, r: "6/j", rir: "3", c: "A", note: "ischios" },
        { n: "Nordic ischio-jambiers", s: 2, r: "4-5", rir: "-", c: "-", note: "🔴 prévention" },
        { n: "Copenhagen adducteurs", s: 2, r: "6/côté", rir: "-", c: "-", note: "🔴 prévention" }] };
  const reactivite: Jour = { d: "J-4", f: "Réactivité courte (4 jours avant le match)", ex: [
    { n: "Sauts verticaux (CMJ)", s: 3, r: "4", rir: "-", c: "-", note: "repos 1 min, qualité max" },
    { n: "Sprint lancé", s: 4, r: "20 m", rir: "-", c: "-", note: "récupération complète" },
    { n: "Bonds unipodaux", s: 2, r: "5/j", rir: "-", c: "-", note: "réception stable" },
    { n: "Mobilité hanches", s: 1, r: "5 min", rir: "-", c: "-", note: "90/90, fente basse" }] };
  const recup: Jour = { d: "RÉCUP", f: "Récupération active", ex: [
    { n: "Vélo ou footing très léger", s: 1, r: "20 min", rir: "-", c: "-", note: "on doit pouvoir parler" },
    { n: "Mobilité complète", s: 1, r: "10 min", rir: "-", c: "-", note: "chevilles, hanches, dos" },
    { n: "Étirements passifs", s: 1, r: "20 s/position", rir: "-", c: "-", note: "jamais d'à-coup" }] };
  return {
    proto: "MAINTIEN EN SAISON", icon: "🔁", officiel: true,
    phase: "SAISON — VOLUME BAS",
    stats: "Jamais de séance lourde à moins de 48 h d'un match",
    cle: "Le but : garder la force et la vitesse de la pré-saison sans arriver fatigué le week-end. Court, intense, loin du match.",
    marqueur: "Frais le jour du match, toute la saison",
    zone: [8, 14],
    days: [force, reactivite, recup].slice(0, Math.max(1, Math.min(x.freq, 3))),
  };
}

/* ─── Football : préparer la saison ─── */
export function preparerSaison(p: Bilan, x: Contexte): Programme {
  const L = lieu(p);
  const { rir, reps, adjS } = x;
  const aerobie: Jour = { d: "VMA", f: "Aérobie · VMA", ex: [
    { n: "Footing progressif", s: 1, r: "20-30 min", rir: "-", c: "-", note: `aisance respiratoire — ${p.allure || "ton allure"}` },
    { n: "Course 30-30", s: adjS(2), r: "6 min", rir: "-", c: "-", note: "30 s à ta VMA / 30 s trot — 3 min entre les blocs" },
    { n: "Étirements passifs", s: 1, r: "20 s/position", rir: "-", c: "-", note: "après, jamais avant" }] };
  const renfo: Jour = L.salle
    ? { d: "RENFO", f: "Renforcement général", ex: [
        { n: x.gen ? "Leg Press" : "Goblet Squat", s: adjS(3), r: reps("10"), rir, c: "S", note: "on reconstruit la base" },
        { n: x.dos ? "Hip Thrust" : "RDL", s: adjS(3), r: reps("10"), rir, c: x.dos ? "A" : "S", note: "chaîne postérieure" },
        { n: "Walking Lunges", s: adjS(3), r: "10/j", rir, c: "S", note: "amplitude" },
        { n: "Traction / Lat Pulldown", s: adjS(3), r: reps("10"), rir, c: "A", note: "haut du corps" },
        { n: "Gainage", s: adjS(3), r: "40 s", rir: "-", c: "-", note: "face et côtés" }] }
    : { d: "RENFO", f: "Renforcement poids du corps", ex: [
        { n: "Squat poids du corps", s: adjS(3), r: "15", rir, c: "-", note: "lent à la descente" },
        { n: "DB Split Squat", s: adjS(3), r: "10/j", rir, c: "S", note: "sac lesté si trop facile" },
        { n: "Pont fessier unilatéral", s: adjS(3), r: "12/j", rir: "2", c: "-", note: "bassin haut" },
        { n: "Pompes", s: adjS(3), r: "10-15", rir: "2", c: "-", note: "corps gainé" },
        { n: "Gainage", s: adjS(3), r: "40 s", rir: "-", c: "-", note: "face et côtés" }] };
  const prevention: Jour = { d: "PRÉVENTION", f: "Prévention · proprioception", crit: true, ex: [
    { n: "Nordic ischio-jambiers", s: adjS(3), r: x.deb ? "3-4" : "5-6", rir: "-", c: "-", note: "🔴 blessure n°1 du footballeur" },
    { n: "Copenhagen adducteurs", s: adjS(2), r: "6-8/côté", rir: "-", c: "-", note: "🔴 pubalgie" },
    { n: "Excentrique mollets", s: adjS(3), r: "10", rir: "-", c: "-", note: "🔴 tendon d'Achille — descente lente" },
    { n: "Unipodal yeux fermés", s: 3, r: "30 s/côté", rir: "-", c: "-", note: "chevilles" }] };
  const vitesse: Jour = { d: "VITESSE", f: "Vitesse · appuis", ex: [
    { n: "Gammes athlétiques", s: 2, r: "20 m", rir: "-", c: "-", note: "échauffement dynamique" },
    { n: "Sprint départ arrêté", s: adjS(5), r: "15 m", rir: "-", c: "-", note: "récup 1 min 30" },
    { n: "Test 505 / changements de direction", s: adjS(5), r: "1", rir: "-", c: "-", note: "appuis bas" }] };
  return {
    proto: "PRÉPARER LA SAISON", icon: "📅", officiel: true,
    cle: "4 semaines pour arriver prêt : l'endurance d'abord, la force ensuite, la vitesse à la fin. Dès que le championnat commence, passe en « Maintien en saison ».",
    marqueur: "Prêt au premier match, sans blessure",
    zone: x.deb ? [12, 20] : [18, 26],
    days: [aerobie, renfo, prevention, vitesse].slice(0, Math.max(1, Math.min(x.freq, 4))),
  };
}

/* ─── Forme : tonifier ─── */
export function tonifier(p: Bilan, x: Contexte): Programme {
  const L = lieu(p);
  const { rir, reps, adjS, drop } = x;
  const sq = x.gen ? { n: "Squat sur chaise (assis-debout)", c: "S" as const } : { n: "Goblet Squat", c: "S" as const };
  const salle: Jour[] = [
    { d: "BAS + GAINAGE", f: "Jambes, fessiers, abdos", ex: [
      { n: sq.n, s: adjS(3), r: reps("12-15"), rir, c: sq.c, note: "descends en contrôlant" },
      { n: "Hip Thrust", s: adjS(3), r: reps("12-15"), rir, c: "A", drop, note: "serre en haut 1 s" },
      { n: "Walking Lunges", s: adjS(3), r: "10/j", rir, c: "S", note: "grands pas" },
      { n: "Hip Abduction", s: adjS(3), r: "20", rir: "1-2", c: "P", note: "buste penché" },
      { n: "Gainage", s: adjS(3), r: "30-45 s", rir: "-", c: "-", note: "face" }] },
    { d: "HAUT + CARDIO", f: "Dos, épaules, bras, cardio", ex: [
      { n: "Lat Pulldown", s: adjS(3), r: reps("12-15"), rir, c: "A", note: "omoplates serrées" },
      { n: "Développé haltères assis", s: adjS(3), r: reps("12-15"), rir, c: "A", note: "épaules" },
      { n: "Seated Row", s: adjS(3), r: reps("12-15"), rir, c: "A", note: "posture" },
      { n: "Lateral Raise", s: adjS(3), r: "15", rir: "2", c: "P", note: "épaules dessinées" },
      { n: "Rameur ou vélo en intervalles", s: 1, r: "8 min", rir: "-", c: "-", note: "30 s vite / 30 s lent" }] },
    { d: "CIRCUIT", f: "Full body en circuit", ex: [
      { n: "DB Single Leg RDL", s: adjS(3), r: "10/j", rir, c: "A", note: "équilibre" },
      { n: "Pompes inclinées (mur)", s: adjS(3), r: "10-15", rir: "2", c: "-", note: "adapte l'inclinaison" },
      { n: "DB Curtsy Lunge", s: adjS(3), r: "10/j", rir, c: "A", note: "fessier moyen" },
      { n: "Rowing haltère", s: adjS(3), r: "12/bras", rir, c: "A", note: "dos" },
      { n: "Mountain climbers", s: adjS(3), r: "30 s", rir: "-", c: "-", note: "fin de circuit" }] },
    { d: "FESSIERS + ABDOS", f: "Fessiers, taille", ex: [
      { n: "Hip Thrust (pause)", s: adjS(3), r: reps("12"), rir, c: "A", note: "pause 2 s" },
      { n: "Cable Kickback", s: adjS(3), r: "15/j", rir: "2", c: "P", note: "squeeze" },
      { n: "RB Side Step", s: adjS(3), r: "20 pas", rir: "-", c: "-", note: "élastique aux genoux" },
      { n: "Dead Bug", s: adjS(3), r: "10/côté", rir: "-", c: "-", note: "dos plaqué au sol" }] },
  ];
  const maison: Jour[] = [
    { d: "BAS + GAINAGE", f: "Jambes, fessiers, abdos (maison)", ex: [
      { n: "Goblet Squat", s: adjS(3), r: "15", rir, c: "S", note: "haltère, bouteille ou sac" },
      { n: "RB Hip Bridge", s: adjS(3), r: "15", rir, c: "-", note: "élastique au-dessus des genoux" },
      { n: "DB Split Squat", s: adjS(3), r: "10/j", rir, c: "S", note: "pied arrière sur une chaise si à l'aise" },
      { n: "RB Side Step", s: adjS(3), r: "20 pas", rir: "-", c: "-", note: "fessier moyen" },
      { n: "Gainage", s: adjS(3), r: "30-45 s", rir: "-", c: "-", note: "face" }] },
    { d: "HAUT + CARDIO", f: "Haut du corps, cardio (maison)", ex: [
      { n: "Pompes", s: adjS(3), r: "8-15", rir: "2", c: "-", note: "sur les genoux pour commencer" },
      { n: "Rowing haltère", s: adjS(3), r: "12/bras", rir, c: "A", note: "appui sur une chaise" },
      { n: "Élévations latérales", s: adjS(3), r: "15", rir: "2", c: "P", note: "bouteilles d'eau si besoin" },
      { n: "Dips sur chaise", s: adjS(3), r: "10", rir: "2", c: "-", note: "triceps" },
      { n: "Jumping jacks", s: adjS(4), r: "40 s", rir: "-", c: "-", note: "20 s de pause" }] },
    { d: "CIRCUIT", f: "Full body en circuit (maison)", ex: [
      { n: "DB Sumo Squat", s: adjS(3), r: "15", rir, c: "S", note: "pieds larges" },
      { n: "DB Single Leg RDL", s: adjS(3), r: "10/j", rir, c: "A", note: "équilibre" },
      { n: "DB Curtsy Lunge", s: adjS(3), r: "10/j", rir, c: "A", note: "fessier moyen" },
      { n: "Superman", s: adjS(3), r: "12", rir: "-", c: "-", note: "dos" },
      { n: "Mountain climbers", s: adjS(3), r: "30 s", rir: "-", c: "-", note: "fin de circuit" }] },
    { d: "FESSIERS + ABDOS", f: "Fessiers, taille (maison)", ex: [
      { n: "Hip Thrust", s: adjS(3), r: "15", rir, c: "A", note: "dos sur le canapé, charge sur les hanches" },
      { n: "RB Donkey Kick", s: adjS(3), r: "15/j", rir: "-", c: "-", note: "squeeze en haut" },
      { n: "RB Side Step", s: adjS(3), r: "20 pas", rir: "-", c: "-", note: "élastique aux genoux" },
      { n: "Dead Bug", s: adjS(3), r: "10/côté", rir: "-", c: "-", note: "dos plaqué au sol" }] },
  ];
  return {
    proto: "TONIFIER", icon: "✨", officiel: false,
    cle: "Tout le corps, chaque semaine : des charges modérées, peu de repos, et des pas au quotidien. Le corps se dessine en gardant du muscle.",
    neat: "🚶 7 000 – 10 000 pas/jour en plus des séances",
    marqueur: "Des charges qui montent et des vêtements qui tombent mieux",
    zone: x.deb ? [12, 20] : [18, 28],
    days: (L.maison ? maison : salle).slice(0, Math.max(2, Math.min(x.freq, 4))),
  };
}

/* ─── Forme : fessiers à la maison ─── */
export function fessiersMaison(x: Contexte): Jour[] {
  const { rir, reps, adjS, drop } = x;
  return ([
    { d: "DAY 1", f: "Glutes Heavy (maison)", ex: [
      { n: "Hip Thrust", s: adjS(4), r: reps("10-12"), rir, c: "A", drop, note: "dos sur le canapé, haltère ou sac sur les hanches" },
      { n: "DB Single Leg RDL", s: adjS(3), r: "10/j", rir, c: "A", note: "étirement ischios" },
      { n: "DB Split Squat", s: adjS(3), r: "10/j", rir, c: "S", note: "pied arrière sur une chaise" },
      { n: "RB Side Step", s: adjS(3), r: "20 pas", rir: "-", c: "-", note: "burnout fessier moyen" }] },
    { d: "DAY 2", f: "Upper Body (maison)", ex: [
      { n: "Pompes", s: adjS(3), r: "8-15", rir: "2", c: "-", note: "sur les genoux pour commencer" },
      { n: "Rowing haltère", s: adjS(3), r: "12/bras", rir, c: "A", note: "dos" },
      { n: "Élévations latérales", s: adjS(3), r: "15", rir: "2", c: "P", note: "épaules" },
      { n: "Dips sur chaise", s: adjS(3), r: "10", rir: "2", c: "-", note: "bras" }] },
    { d: "DAY 3", f: "Glutes Volume+ (maison)", ex: [
      { n: "RB Hip Bridge", s: adjS(4), r: "15-20", rir, c: "-", note: "élastique au-dessus des genoux" },
      { n: "DB Sumo Squat", s: adjS(4), r: reps("12-15"), rir, c: "S", note: "pieds larges" },
      { n: "RB Donkey Kick", s: adjS(3), r: "15/j", rir: "2", c: "-", note: "squeeze en haut" },
      { n: "DB Curtsy Lunge", s: adjS(3), r: "10/j", rir, c: "A", note: "fessier moyen" }] },
    { d: "DAY 5", f: "Glutes Shape (maison)", ex: [
      { n: "DB Step Up", s: adjS(3), r: "10/j", rir: "2", c: "A", note: "chaise stable" },
      { n: "Walking Lunges", s: adjS(3), r: "10/j", rir: "2", c: "S", note: "amplitude" },
      { n: "Hip Thrust (pause)", s: adjS(3), r: reps("12"), rir: "2", c: "A", note: "pause 2 s" },
      { n: "RB Donkey Kick", s: adjS(3), r: "15/j", rir: "1-2", c: "-", note: "tempo lent" }] },
  ] satisfies Jour[]).slice(0, Math.max(2, Math.min(x.freq, 4)));
}
