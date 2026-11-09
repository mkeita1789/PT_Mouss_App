/* ═══════════════════════════════════════════════
   JIGI — Bilan, cycles de phases et générateur de programme
   Port fidèle de app.js (PWA). Les valeurs des réponses restent
   en FR : ce sont des identifiants que buildProgram() teste.
   ═══════════════════════════════════════════════ */
import type { Bilan, Checkin, Jour, Objectif, Phase, PhaseCourante, Programme } from "./types";

/* ═══ BILAN ═══ */
export const OBJECTIFS: Objectif[] = [
  "Développer mes fessiers 🍑",
  "Prendre du muscle",
  "Perdre du gras",
  "Performance sportive ⚽",
  "Me sentir mieux",
];

export type QuestionBilan = {
  k: keyof Bilan;
  q: string;
  type?: "text";
  ph?: string;
  o?: string[];
};

export function questionsBilan(a: Partial<Bilan>): QuestionBilan[] {
  const q: QuestionBilan[] = [
    { k: "prenom", type: "text", q: "Comment tu t'appelles ?", ph: "Ton prénom" },
    { k: "objectif", q: "Ton objectif principal ?", o: OBJECTIFS },
    { k: "niveau", q: "Où tu en es ?", o: ["Je débute", "J'ai déjà pratiqué", "Je m'entraîne régulièrement", "Niveau avancé"] },
    { k: "freq", q: "Combien de séances par semaine ?", o: ["2", "3", "4", "5 ou +"] },
    { k: "materiel", q: "Où t'entraînes-tu ?", o: ["En salle", "À la maison", "Les deux"] },
    { k: "sante", q: "Un point de vigilance santé ?", o: ["Aucun", "Dos sensible", "Genoux", "Épaules"] },
    { k: "sommeil", q: "Tu dors combien ?", o: ["Moins de 6 h", "6-7 h", "7-8 h", "Plus de 8 h"] },
  ];
  if (a.objectif === "Performance sportive ⚽")
    q.splice(
      3,
      0,
      { k: "periode", q: "Tu es dans quelle période ?", o: ["Coupure / vacances", "Pré-saison", "En saison", "Pas de compétition"] },
      { k: "allure", q: "Ton allure de footing ?", o: ["14 km/h (4'20)", "13 km/h (4'40)", "12 km/h (5'00)", "11 km/h ou moins"] },
    );
  return q;
}

/* ═══ CYCLES DE PHASES ═══ */
export const CYCLE_JIGI: Phase[] = [
  { n: "RM TEST", pct: "Découverte des charges", reps: null, rir: "3", drop: false, mult: 1, tip: "On cherche tes charges de référence. Note tout." },
  { n: "HYPERTROPHY", pct: "70 %", reps: "10-12", rir: "2-3", drop: true, mult: 1, tip: "Le volume construit. Technique propre." },
  { n: "HYPERTROPHY+", pct: "75-80 %", reps: "8-12", rir: "1-2", drop: true, mult: 1, tip: "On densifie. Les charges montent." },
  { n: "DELOAD", pct: "50-60 %", reps: "12-15", rir: "3-4", drop: false, mult: 0.6, tip: "Semaine LÉGÈRE — volontaire. C'est là que le muscle se construit. Ne rajoute rien." },
  { n: "FORCE", pct: "80-85 %", reps: "6-8", rir: "1-2", drop: false, mult: 1, tip: "Lourd, propre, reposé entre les séries." },
  { n: "FORCE+", pct: "90 %", reps: "4-6", rir: "1", drop: false, mult: 1, tip: "Très lourd. Repos complets (2-3 min)." },
  { n: "PEAK", pct: "95 %", reps: "2-3", rir: "0-1", drop: false, mult: 0.85, tip: "Le sommet du cycle. Qualité > quantité." },
  { n: "RETEST", pct: "Nouveaux maxis", reps: null, rir: "2", drop: false, mult: 1, tip: "Compare à la semaine 1. C'est ça, ta progression." },
];
export const CYCLE_GRAS: Phase[] = [
  { n: "MAINTIEN 1", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "On garde les charges. La nutrition et les pas font le déficit." },
  { n: "MAINTIEN 2", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "Force stable = victoire." },
  { n: "MAINTIEN 3", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "Si la force chute → le déficit est trop agressif. On corrige." },
  { n: "ALLÉGÉE", pct: "60 %", reps: "10-12", rir: "3", drop: false, mult: 0.7, tip: "En déficit, la récupération est réduite. Cette semaine protège la suite." },
];
export const CYCLE_BIEN: Phase[] = [
  { n: "DÉCOUVERTE 1", pct: "Léger", reps: "12-15", rir: "3-4", drop: false, mult: 1, tip: "Finis en te disant « j'aurais pu en faire plus »." },
  { n: "DÉCOUVERTE 2", pct: "Léger", reps: "12-15", rir: "3-4", drop: false, mult: 1, tip: "La victoire, c'est de revenir." },
  { n: "CONSTRUCTION 1", pct: "Modéré", reps: "12-15", rir: "3", drop: false, mult: 1, tip: "Ton corps s'habitue. On ajoute un peu." },
  { n: "CONSTRUCTION 2", pct: "Modéré", reps: "12-15", rir: "3", drop: false, mult: 1, tip: "La régularité paie déjà — énergie, sommeil." },
  { n: "CONSTRUCTION 3", pct: "Modéré", reps: "10-15", rir: "3", drop: false, mult: 1, tip: "Tu tiens le rythme. C'est ça qui compte." },
  { n: "DOUCE", pct: "Très léger", reps: "15", rir: "4", drop: false, mult: 0.7, tip: "On souffle. Marche, mobilité, plaisir." },
];

export function cycleFor(p: Bilan): Phase[] | null {
  if (p.objectif === "Perdre du gras") return CYCLE_GRAS;
  if (p.objectif === "Me sentir mieux") return CYCLE_BIEN;
  if (p.objectif === "Performance sportive ⚽") return null;
  return CYCLE_JIGI;
}

/** Semaine écoulée depuis le début du programme (0 = première semaine) */
export function weekNum(start: string | Date | null | undefined, now: Date = new Date()): number {
  if (!start) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(start).getTime()) / (7 * 864e5)));
}

export function phaseFor(p: Bilan, start: string | Date | null | undefined, now?: Date): PhaseCourante | null {
  const cyc = cycleFor(p);
  if (!cyc) return null;
  const w = weekNum(start, now);
  const c = cyc[w % cyc.length];
  const cycle = Math.floor(w / cyc.length) + 1;
  return {
    ...c,
    week: (w % cyc.length) + 1,
    len: cyc.length,
    cycle,
    label: `SEMAINE ${(w % cyc.length) + 1}/${cyc.length}${cycle > 1 ? " · CYCLE " + cycle : ""}`,
  };
}

/* ═══ ÉCHAUFFEMENTS / NUTRITION ═══ */
export function warmup(p: Bilan) {
  if (p.objectif === "Développer mes fessiers 🍑")
    return { t: "Le rituel JIGI (10-15 min) — jamais sauté", ex: ["Glute Bridge — 2×15", "Lateral Band Walk — 2×20", "Donkey Kicks — 2×12/jambe", "Fire Hydrant — 2×12/jambe", "Hip Flexor Stretch — 30 s/côté", "90/90 — 30 s/côté", "Deep Squat Hold — 30 s"] };
  if (p.objectif === "Performance sportive ⚽")
    return { t: "Déverrouillage articulaire (2 tours)", ex: ["Rotations chevilles — 5/sens", "Montées pointes — ×10", "Rotations genoux, bassin, rachis", "Squats complets — ×10", "Rotations épaules + cervicales"] };
  if (p.objectif === "Me sentir mieux")
    return { t: "Mise en route douce (5-8 min)", ex: ["Marche rapide — 3 min", "Rotations d'épaules — ×10", "Cat-Cow — ×8", "Squat au poids de corps lent — ×8", "Respiration profonde — 5 cycles"] };
  return { t: "Échauffement général (8-10 min)", ex: ["Cardio léger — 5 min", "Rotations articulaires complètes", "2 séries légères du premier exercice (50 %, puis 70 %)"] };
}

/** Repères d'assiette — jamais de compteur de calories (invariant de sécurité JIGI) */
export function nutri(p: Bilan) {
  const plate = "🍗 Protéines à chaque repas · 🥦 moitié de l'assiette en légumes · 🍚 glucides à ta faim · 🫒 un peu de bon gras · 💧 eau toute la journée";
  if (p.objectif === "Perdre du gras")
    return { t: "Côté assiette — perte de gras", pts: [plate, "🚶 8-12 000 pas/jour : le levier n°1, devant le cardio", "🍽️ Volume : légumes et fibres pour la satiété", "⚖️ Pesée 1×/semaine MAX. La balance ment — la force stable, c'est ça la victoire", "🚫 Aucun aliment interdit. Des quantités, des fréquences."] };
  if (p.objectif === "Performance sportive ⚽")
    return { t: "L'entraînement invisible", pts: ["😴 Sommeil 8-9 h — le premier facteur anti-blessure", "🍚 Glucides autour des séances et des matchs", "🍽️ Repas complet 3-4 h avant le match, collation 1-2 h avant", "🥤 Dans les 30-60 min après : glucides + protéines", "💧 Hydratation stricte, plus s'il fait chaud"] };
  if (p.objectif === "Me sentir mieux")
    return { t: "Côté assiette — sans compter", pts: [plate, "🕐 Des repas à heures régulières — la base", "🔋 Ce qu'on regarde : ton énergie, ton sommeil, ton humeur. Pas le poids.", "☝️ Une habitude à la fois."] };
  return { t: "Côté assiette — construire", pts: [plate, "🍚 Glucides autour de l'entraînement — le carburant", "😴 Sommeil 7-8 h : c'est là que le muscle se construit", "📈 Le meilleur signal : les charges qui montent"] };
}

/* ═══ GÉNÉRATEUR DE PROGRAMME ═══ */
export const SRA: Record<string, number> = { S: 1.0, A: 0.71, P: 0.43 };

export function buildProgram(p: Bilan, start: string | Date | null | undefined, now?: Date): Programme {
  const deb = p.niveau === "Je débute", av = p.niveau === "Niveau avancé";
  const dos = p.sante === "Dos sensible", gen = p.sante === "Genoux";
  const freq = parseInt(p.freq) || 3;
  const ph = phaseFor(p, start, now);
  const rir = ph?.rir || (deb ? "2-3" : av ? "0-1" : "1-2");
  const reps = (fb: string) => ph?.reps || fb;
  const drop = ph ? ph.drop && !deb : !deb;
  const mult = ph?.mult ?? 1;
  const adjS = (s: number) => Math.max(2, Math.round(s * mult));
  let base: Programme;

  if (p.objectif === "Développer mes fessiers 🍑") {
    const hinge = dos
      ? { n: "Cable Pull Through", c: "P" as const, r: reps("12-15"), note: "remplace le RDL (dos sensible)" }
      : { n: "RDL", c: "S" as const, r: reps(deb ? "10-12" : "8-10"), note: "dos neutre, étirement ischios" };
    base = {
      proto: "FESSIERS", icon: "🍑", officiel: true,
      cle: "Le Hip Thrust ouvre chaque jour fessiers. Isolation en fin. 3 angles jamais identiques.",
      marqueur: "Les charges qui montent", zone: [25, 35],
      days: ([
        { d: "DAY 1", f: "Glutes Heavy", ex: [
          { n: "Hip Thrust", s: adjS(4), r: reps(deb ? "10-12" : "8-10"), rir, c: "A", drop, note: "Pause 1 s en haut" },
          { n: hinge.n, s: adjS(4), r: hinge.r, rir, c: hinge.c, note: hinge.note },
          { n: dos ? "DB Step Up" : "Bulgarian Split Squat", s: adjS(3), r: "10/j", rir, c: dos ? "A" : "S", note: "contrôle unilatéral" },
          { n: "Hip Abduction", s: adjS(3), r: "20", rir: "1-2", c: "P", drop, note: "burnout, buste penché" }] },
        { d: "DAY 2", f: "Upper Body", ex: [
          { n: "Lat Pulldown", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "tirage vertical" },
          { n: "Seated Row", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "tirage horizontal" },
          { n: "Lateral Raise", s: adjS(3), r: "12-15", rir: "2", c: "-", note: "épaules" },
          { n: "Triceps Pushdown", s: adjS(3), r: "12", rir: "2", c: "-", note: "bras" }] },
        { d: "DAY 3", f: "Glutes Volume+", ex: [
          { n: "Hip Thrust", s: adjS(4), r: reps("12-15"), rir, c: "A", drop, note: "tempo contrôlé" },
          { n: "Leg Press (pieds hauts)", s: adjS(4), r: reps("12-15"), rir, c: "S", note: "accent fessier" },
          { n: "Cable Kickback", s: adjS(3), r: "15/j", rir: "2", c: "P", note: "squeeze en haut" },
          { n: "Hip Abduction", s: adjS(3), r: "20", rir: "1-2", c: "P", drop, note: "volume élevé" }] },
        { d: "DAY 5", f: "Glutes Shape", ex: [
          { n: "DB Step Up", s: adjS(3), r: "10/j", rir: "2", c: "A", note: "montée contrôlée" },
          { n: "Walking Lunges", s: adjS(3), r: "10/j", rir: "2", c: "S", note: "amplitude" },
          { n: "Hip Thrust (pause)", s: adjS(3), r: reps(deb ? "10-12" : "8-10"), rir: "2", c: "A", note: "pause 2 s" },
          { n: "Kickback (slow)", s: adjS(3), r: "15/j", rir: "1-2", c: "P", note: "tempo lent" }] },
      ] satisfies Jour[]).slice(0, Math.max(2, Math.min(freq, 4))),
    };
  } else if (p.objectif === "Prendre du muscle") {
    const hinge = dos ? { n: "Leg Curl", c: "P" as const } : { n: "Romanian Deadlift", c: "S" as const };
    const R = reps("8-12");
    const push = [
      { n: "Développé couché", s: adjS(4), r: R, rir, c: "-" as const, drop, note: "ouverture lourde" },
      { n: "Développé incliné haltères", s: adjS(3), r: reps("10-12"), rir, c: "-" as const, note: "haut des pecs" },
      { n: "Développé militaire", s: adjS(3), r: reps("10-12"), rir, c: "-" as const, note: "épaules" },
      { n: "Élévations latérales", s: adjS(3), r: "12-15", rir: "1-2", c: "-" as const, note: "deltoïde" },
      { n: "Triceps Pushdown", s: adjS(3), r: "12", rir: "1-2", c: "-" as const, drop, note: "isolation finale" }];
    const pull = [
      { n: "Traction / Lat Pulldown", s: adjS(4), r: R, rir, c: "-" as const, drop, note: "ouverture" },
      { n: "Rowing barre", s: adjS(4), r: R, rir, c: "-" as const, note: "tirage horizontal" },
      { n: "Face Pull", s: adjS(3), r: "15", rir: "2", c: "-" as const, note: "santé d'épaule" },
      { n: "Curl barre", s: adjS(3), r: reps("10-12"), rir: "1-2", c: "-" as const, drop, note: "isolation finale" }];
    const legs = [
      { n: "Back Squat", s: adjS(4), r: R, rir, c: "S" as const, drop, note: "ouverture lourde" },
      { n: hinge.n, s: adjS(4), r: R, rir, c: hinge.c, note: dos ? "adapté dos sensible" : "chaîne postérieure" },
      { n: "Leg Press", s: adjS(3), r: "12", rir, c: "S" as const, note: "volume quadriceps" },
      { n: "Leg Extension", s: adjS(3), r: "12-15", rir: "1-2", c: "P" as const, drop, note: "isolation finale" }];
    const days =
      freq <= 2
        ? [
            { d: "FULL BODY A", f: "Haut dominant", ex: [push[0], pull[1], legs[0], push[2], pull[3]] },
            { d: "FULL BODY B", f: "Bas dominant", ex: [legs[1], legs[2], pull[0], push[1], push[4]] }]
        : freq === 3
          ? [
              { d: "PUSH", f: "Pecs · Épaules · Triceps", ex: push },
              { d: "PULL", f: "Dos · Biceps", ex: pull },
              { d: "LEGS", f: "Jambes", ex: legs }]
          : [
              { d: "UPPER A", f: "Haut (force)", ex: push.slice(0, 4) },
              { d: "LOWER A", f: "Bas (force)", ex: legs },
              { d: "UPPER B", f: "Haut (volume)", ex: pull },
              { d: "LOWER B", f: "Bas (volume)", ex: [
                legs[1],
                { n: "Fentes marchées", s: adjS(3), r: "10/j", rir, c: "S" as const, note: "unilatéral" },
                { n: "Leg Curl", s: adjS(3), r: "12", rir: "1-2", c: "P" as const, note: "ischios" },
                { n: "Mollets debout", s: adjS(4), r: "15", rir: "1-2", c: "P" as const, drop, note: "isolation" }] }];
    base = {
      proto: "PRISE DE MUSCLE", icon: "💪", officiel: false,
      cle: "Ouvrir par le polyarticulaire le plus lourd, finir par une isolation. Surcharge progressive.",
      marqueur: "Les charges qui montent", zone: deb ? [15, 25] : [25, 35], days,
    };
  } else if (p.objectif === "Perdre du gras") {
    const hinge = dos ? { n: "Leg Curl", c: "P" as const } : { n: "Romanian Deadlift", c: "S" as const };
    base = {
      proto: "PERTE DE GRAS", icon: "🔥", officiel: false,
      cle: "⚠️ On NE baisse PAS les charges. La salle sert à GARDER le muscle — la nutrition et le NEAT font le déficit.",
      neat: "🚶 8 000 – 12 000 pas/jour = le levier n°1",
      marqueur: "Force STABLE = victoire. La balance ment.", zone: deb ? [12, 20] : [20, 30],
      days: ([
        { d: "FULL BODY A", f: "Maintien force", ex: [
          { n: "Back Squat", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "S", note: "LOURD — on garde" },
          { n: "Développé couché", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "-", note: "LOURD" },
          { n: "Rowing barre", s: adjS(3), r: "8-10", rir: "1-2", c: "-", note: "tirage" },
          { n: "Gainage", s: adjS(3), r: "45 s", rir: "-", c: "-", note: "superset possible" }] },
        { d: "FULL BODY B", f: "Maintien force", ex: [
          { n: hinge.n, s: adjS(4), r: reps("6-10"), rir: "1-2", c: hinge.c, note: dos ? "adapté" : "LOURD" },
          { n: "Traction / Lat Pulldown", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "-", note: "LOURD" },
          { n: "Développé militaire", s: adjS(3), r: "8-10", rir: "1-2", c: "-", note: "épaules" },
          { n: "Fentes", s: adjS(3), r: "10/j", rir: "1-2", c: "S", note: "unilatéral" }] },
        { d: "FULL BODY C", f: "Maintien force", ex: [
          { n: "Leg Press", s: adjS(4), r: "8-12", rir: "1-2", c: "S", note: "jambes" },
          { n: "Dips / Développé incliné", s: adjS(3), r: "8-12", rir: "1-2", c: "-", note: "pecs" },
          { n: "Rowing haltère", s: adjS(3), r: "10/bras", rir: "1-2", c: "-", note: "dos unilatéral" },
          { n: "Circuit abdos", s: adjS(3), r: "10 min", rir: "-", c: "-", note: "densité" }] },
      ] satisfies Jour[]).slice(0, Math.max(2, Math.min(freq, 3))),
    };
  } else if (p.objectif === "Performance sportive ⚽") {
    if (p.periode === "Coupure / vacances")
      return {
        proto: "PERF — COUPURE", icon: "⚽", officiel: true, repos: true,
        phase: "REPOS COMPLET IMPOSÉ", stats: "0 séance · 19 jours",
        cle: "🛑 Le repos fait PARTIE du programme. Amiens SC impose 19 jours de repos complet.",
        citation: "« La récupération fait partie intégrante du développement des qualités athlétiques. »",
        marqueur: "Revenir frais. Un joueur cramé se blesse.", zone: [0, 0], days: [],
      };
    const enS = p.periode === "En saison";
    return {
      proto: enS ? "PERF — EN SAISON" : "PERF — PRÉ-SAISON", icon: "⚽", officiel: true,
      phase: enS ? "MAINTIEN — VOLUME BAS" : "REPRISE PROGRESSIVE",
      stats: enS ? "2 séances/sem max · jamais à 48 h d'un match" : `Allure : ${p.allure || "12 km/h"}`,
      cle: "Mobilité et proprioception AVANT le renforcement. Prévention excentrique NON négociable.",
      citation: "« Un joueur blessé est un joueur qui n'est pas performant. » — Amiens SC",
      marqueur: "Le terrain. ZÉRO blessure = le meilleur indicateur.", zone: enS ? [10, 18] : [20, 28],
      days: [
        { d: "P1-P3", f: "Déverrouillage · Mobilité · Proprio", ex: [
          { n: "Routine déverrouillage", s: 2, r: "circuit", rir: "-", c: "-", note: "10 rotations articulaires, 2 tours" },
          { n: "Mobilité (chevilles/hanches/thorax)", s: 3, r: "×3 exos", rir: "-", c: "-", note: "focus tournant" },
          { n: "Unipodal yeux fermés", s: 3, r: "30 s/côté", rir: "-", c: "-", note: "proprioception" },
          { n: "Squat lent surface instable", s: 3, r: "10", rir: "-", c: "-", note: "lit/canapé, yeux fermés" }] },
        { d: "P4-P5", f: "Gainage · Renforcement", ex: [
          { n: "Gainage face + obliques + lombaire", s: 4, r: "30 s", rir: "-", c: "-", note: "4 tours, R=30s" },
          { n: "Pompes", s: 4, r: "20 s stat.", rir: "-", c: "-", note: "coudes 90°" },
          { n: "Chaise (mur)", s: 4, r: "20 s", rir: "-", c: "-", note: "cuisses parallèles" },
          { n: "Fente avant", s: 4, r: "20 s", rir: "-", c: "-", note: "genou ≤ orteils" }] },
        { d: "SPÉ ⚠️", f: "Prévention — 100 % excentrique", crit: true, ex: [
          { n: "Excentrique ischio-jambiers", s: 3, r: "8", rir: "-", c: "-", note: "🔴 blessure n°1 — descente LENTE" },
          { n: "Glissade adducteur", s: 3, r: "8/côté", rir: "-", c: "-", note: "🔴 pubalgie — retenir" },
          { n: "Excentrique mollets", s: 3, r: "8", rir: "-", c: "-", note: "🔴 tendon d'Achille" },
          { n: "Good morning unilatéral", s: 3, r: "8/j", rir: "-", c: "-", note: "chaîne postérieure" }] },
        { d: "P6-P7", f: "Aérobie · Étirements", ex: [
          { n: enS ? "Footing léger" : "Footing progressif", s: 1, r: enS ? "20 min" : "20-35 min", rir: "-", c: "-", note: `aisance respiratoire — ${p.allure || ""}` },
          { n: "Étirements passifs", s: 1, r: "20 s/position", rir: "-", c: "-", note: "⚠️ jamais d'à-coup" }] },
      ],
    };
  } else {
    const sq = gen ? { n: "Squat sur chaise (assis-debout)", c: "S" as const } : { n: "Goblet Squat", c: "S" as const };
    base = {
      proto: "ME SENTIR MIEUX", icon: "🌿", officiel: false,
      cle: "🌿 On sous-charge VOLONTAIREMENT. Finis en te disant « j'aurais pu en faire plus ».",
      marqueur: "LA RÉGULARITÉ — le seul chiffre qui compte", zone: [8, 15],
      days: ([
        { d: "FULL BODY A", f: "En douceur", ex: [
          { n: sq.n, s: 2, r: reps("12-15"), rir: "3-4", c: sq.c, note: "mouvement du quotidien" },
          { n: "Pompes inclinées (mur)", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "adapte l'inclinaison" },
          { n: "Tirage poulie basse", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "ouvre la poitrine" },
          { n: "Gainage face", s: 2, r: "20-30 s", rir: "-", c: "-", note: "le dos te dira merci" },
          { n: "Marche", s: 1, r: "10-15 min", rir: "-", c: "-", note: "tranquille" }] },
        { d: "FULL BODY B", f: "En douceur", ex: [
          { n: dos ? "Hip Thrust" : "Soulevé haltères léger", s: 2, r: reps("12-15"), rir: "3-4", c: dos ? "A" : "S", note: dos ? "rien sur la colonne" : "dos neutre" },
          { n: "Développé haltères assis", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "épaules" },
          { n: "Tirage vertical assisté", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "dos" },
          { n: "Dead Bug", s: 2, r: "10/côté", rir: "-", c: "-", note: "gainage doux" },
          { n: "Marche", s: 1, r: "10-15 min", rir: "-", c: "-", note: "tranquille" }] },
      ] satisfies Jour[]).slice(0, Math.max(2, Math.min(freq, 3))),
    };
  }

  if (ph) {
    base.phase = `${ph.label} — ${ph.n}`;
    base.phaseNom = ph.n;
    base.stats = `${ph.pct}${ph.reps ? " · " + ph.reps + " reps" : ""} · RIR ${ph.rir}`;
    base.phaseTip = ph.tip;
    base.deload = ph.mult < 1;
  }
  return base;
}

/** Volume hebdomadaire en unités fonctionnelles (jauge SRA) */
export function volumeUF(P: Programme): number {
  return P.days.reduce((a, d) => a + d.ex.reduce((b, e) => b + (SRA[e.c] || 0) * e.s, 0), 0);
}

/* ═══ CHECK-IN DU JOUR ═══ */
export const CHECKIN_Q: { k: keyof Checkin; q: string; o: string[] }[] = [
  { k: "sommeil", q: "Ton sommeil cette nuit ?", o: ["😴 Bon (7 h+)", "🙂 Correct", "😵 Mauvais (<6 h)"] },
  { k: "energie", q: "Ton énergie là, maintenant ?", o: ["⚡ Haute", "🙂 Normale", "🪫 Faible"] },
  { k: "corps", q: "Ton corps ?", o: ["✅ Frais", "😬 Courbatures fortes", "🔴 Une douleur"] },
];

export const DOULEUR = "🔴 Une douleur";

export function verdictCheckin(ci: Checkin) {
  if (ci.corps === DOULEUR)
    return { v: "REPORTER" as const, col: "var(--ko)", msg: "Une douleur, ce n'est pas une courbature. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé, et préviens Moustapha." };
  let score = 0;
  if (ci.sommeil === "😵 Mauvais (<6 h)") score++;
  if (ci.energie === "🪫 Faible") score++;
  if (ci.corps === "😬 Courbatures fortes") score++;
  if (score >= 2)
    return { v: "ALLÉGER" as const, col: "var(--gold)", msg: "Aujourd'hui : −1 série par exercice, garde 1-2 reps de plus en réserve. Une séance allégée vaut mieux qu'une séance sautée." };
  return { v: "MAINTENIR" as const, col: "var(--ok)", msg: "Tu es opérationnel. Séance normale — vas-y." };
}

export function scoreForme(ci: Checkin, seancesSemaine: number, freq: string) {
  let s = 50;
  if (ci.sommeil === "😴 Bon (7 h+)") s += 15; else if (ci.sommeil === "🙂 Correct") s += 5; else s -= 15;
  if (ci.energie === "⚡ Haute") s += 15; else if (ci.energie === "🙂 Normale") s += 5; else s -= 15;
  if (ci.corps === "✅ Frais") s += 15; else if (ci.corps === "😬 Courbatures fortes") s -= 10; else s -= 30;
  const target = parseInt(freq) || 3;
  s += Math.min(10, Math.round((seancesSemaine / target) * 10));
  s = Math.max(5, Math.min(100, s));
  const col = s >= 70 ? "var(--ok)" : s >= 45 ? "var(--gold)" : "var(--ko)";
  const lab = s >= 70 ? "FRAIS" : s >= 45 ? "CORRECT" : "FATIGUÉ";
  return { s, col, lab };
}

/** Lundi 00:00 de la semaine courante */
export function lundiCourant(now: Date = new Date()): Date {
  const m = new Date(now);
  m.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  m.setHours(0, 0, 0, 0);
  return m;
}
