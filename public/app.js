/* ═══════════════════════════════════════════════
   PT MOUSS IA — App coach v3
   + Coach en bouton central   + Score de forme (anneau)
   + Messages intelligents du coach   + RPE & notes par exercice
   + Roadmap de phases   + Swipe entre onglets
   ═══════════════════════════════════════════════ */

const $ = (s) => document.querySelector(s);
const store = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) {} },
};
const today = () => new Date().toISOString().slice(0, 10);

let S = {
  tab: "home",
  profile: store.get("profile", null),
  history: store.get("history", []),
  daily: store.get("daily", {}),
  measures: store.get("measures", []),
  chat: store.get("chat", []),
  bilanIdx: 0, bilanAns: {}, txt: "",
  dayIdx: 0, session: null, rest: null, restTotal: 60, restTimer: null,
  chatBusy: false, warmOpen: false, ciStep: 0, ciTmp: {},
};
const D = () => S.daily[today()] || (S.daily[today()] = { water: 0, steps: 0 });
const saveDaily = () => store.set("daily", S.daily);

/* ═══ BILAN ═══ */
const OBJ = ["Développer mes fessiers 🍑", "Prendre du muscle", "Perdre du gras", "Performance sportive ⚽", "Me sentir mieux"];
function questions(a) {
  const q = [
    { k: "prenom", type: "text", q: "Comment tu t'appelles ?", ph: "Ton prénom" },
    { k: "objectif", q: "Ton objectif principal ?", o: OBJ },
    { k: "niveau", q: "Où tu en es ?", o: ["Je débute", "J'ai déjà pratiqué", "Je m'entraîne régulièrement", "Niveau avancé"] },
    { k: "freq", q: "Combien de séances par semaine ?", o: ["2", "3", "4", "5 ou +"] },
    { k: "materiel", q: "Où t'entraînes-tu ?", o: ["En salle", "À la maison", "Les deux"] },
    { k: "sante", q: "Un point de vigilance santé ?", o: ["Aucun", "Dos sensible", "Genoux", "Épaules"] },
    { k: "sommeil", q: "Tu dors combien ?", o: ["Moins de 6 h", "6-7 h", "7-8 h", "Plus de 8 h"] },
  ];
  if (a.objectif === "Performance sportive ⚽") q.splice(3, 0,
    { k: "periode", q: "Tu es dans quelle période ?", o: ["Coupure / vacances", "Pré-saison", "En saison", "Pas de compétition"] },
    { k: "allure", q: "Ton allure de footing ?", o: ["14 km/h (4'20)", "13 km/h (4'40)", "12 km/h (5'00)", "11 km/h ou moins"] });
  return q;
}

/* ═══ CYCLES DE PHASES ═══ */
const CYCLE_JIGI = [
  { n: "RM TEST", pct: "Découverte des charges", reps: null, rir: "3", drop: false, mult: 1, tip: "On cherche tes charges de référence. Note tout." },
  { n: "HYPERTROPHY", pct: "70 %", reps: "10-12", rir: "2-3", drop: true, mult: 1, tip: "Le volume construit. Technique propre." },
  { n: "HYPERTROPHY+", pct: "75-80 %", reps: "8-12", rir: "1-2", drop: true, mult: 1, tip: "On densifie. Les charges montent." },
  { n: "DELOAD", pct: "50-60 %", reps: "12-15", rir: "3-4", drop: false, mult: 0.6, tip: "Semaine LÉGÈRE — volontaire. C'est là que le muscle se construit. Ne rajoute rien." },
  { n: "FORCE", pct: "80-85 %", reps: "6-8", rir: "1-2", drop: false, mult: 1, tip: "Lourd, propre, reposé entre les séries." },
  { n: "FORCE+", pct: "90 %", reps: "4-6", rir: "1", drop: false, mult: 1, tip: "Très lourd. Repos complets (2-3 min)." },
  { n: "PEAK", pct: "95 %", reps: "2-3", rir: "0-1", drop: false, mult: 0.85, tip: "Le sommet du cycle. Qualité > quantité." },
  { n: "RETEST", pct: "Nouveaux maxis", reps: null, rir: "2", drop: false, mult: 1, tip: "Compare à la semaine 1. C'est ça, ta progression." },
];
const CYCLE_GRAS = [
  { n: "MAINTIEN 1", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "On garde les charges. La nutrition et les pas font le déficit." },
  { n: "MAINTIEN 2", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "Force stable = victoire." },
  { n: "MAINTIEN 3", pct: "75-80 %", reps: "6-10", rir: "1-2", drop: false, mult: 1, tip: "Si la force chute → le déficit est trop agressif. On corrige." },
  { n: "ALLÉGÉE", pct: "60 %", reps: "10-12", rir: "3", drop: false, mult: 0.7, tip: "En déficit, la récupération est réduite. Cette semaine protège la suite." },
];
const CYCLE_BIEN = [
  { n: "DÉCOUVERTE 1", pct: "Léger", reps: "12-15", rir: "3-4", drop: false, mult: 1, tip: "Finis en te disant « j'aurais pu en faire plus »." },
  { n: "DÉCOUVERTE 2", pct: "Léger", reps: "12-15", rir: "3-4", drop: false, mult: 1, tip: "La victoire, c'est de revenir." },
  { n: "CONSTRUCTION 1", pct: "Modéré", reps: "12-15", rir: "3", drop: false, mult: 1, tip: "Ton corps s'habitue. On ajoute un peu." },
  { n: "CONSTRUCTION 2", pct: "Modéré", reps: "12-15", rir: "3", drop: false, mult: 1, tip: "La régularité paie déjà — énergie, sommeil." },
  { n: "CONSTRUCTION 3", pct: "Modéré", reps: "10-15", rir: "3", drop: false, mult: 1, tip: "Tu tiens le rythme. C'est ça qui compte." },
  { n: "DOUCE", pct: "Très léger", reps: "15", rir: "4", drop: false, mult: 0.7, tip: "On souffle. Marche, mobilité, plaisir." },
];
function cycleFor(p) {
  if (p.objectif === "Perdre du gras") return CYCLE_GRAS;
  if (p.objectif === "Me sentir mieux") return CYCLE_BIEN;
  if (p.objectif === "Performance sportive ⚽") return null;
  return CYCLE_JIGI;
}
function weekNum() {
  if (!S.profile?.start) return 0;
  return Math.max(0, Math.floor((Date.now() - S.profile.start) / (7 * 864e5)));
}
function phaseFor(p) {
  const cyc = cycleFor(p);
  if (!cyc) return null;
  const w = weekNum();
  const c = cyc[w % cyc.length];
  return { ...c, week: (w % cyc.length) + 1, len: cyc.length, cycle: Math.floor(w / cyc.length) + 1,
    label: `SEMAINE ${(w % cyc.length) + 1}/${cyc.length}${Math.floor(w / cyc.length) ? " · CYCLE " + (Math.floor(w / cyc.length) + 1) : ""}` };
}

/* ═══ ÉCHAUFFEMENTS / NUTRITION ═══ */
function warmup(p) {
  if (p.objectif === "Développer mes fessiers 🍑") return { t: "Le rituel JIGI (10-15 min) — jamais sauté", ex: ["Glute Bridge — 2×15", "Lateral Band Walk — 2×20", "Donkey Kicks — 2×12/jambe", "Fire Hydrant — 2×12/jambe", "Hip Flexor Stretch — 30 s/côté", "90/90 — 30 s/côté", "Deep Squat Hold — 30 s"] };
  if (p.objectif === "Performance sportive ⚽") return { t: "Déverrouillage articulaire (2 tours)", ex: ["Rotations chevilles — 5/sens", "Montées pointes — ×10", "Rotations genoux, bassin, rachis", "Squats complets — ×10", "Rotations épaules + cervicales"] };
  if (p.objectif === "Me sentir mieux") return { t: "Mise en route douce (5-8 min)", ex: ["Marche rapide — 3 min", "Rotations d'épaules — ×10", "Cat-Cow — ×8", "Squat au poids de corps lent — ×8", "Respiration profonde — 5 cycles"] };
  return { t: "Échauffement général (8-10 min)", ex: ["Cardio léger — 5 min", "Rotations articulaires complètes", "2 séries légères du premier exercice (50 %, puis 70 %)"] };
}
function nutri(p) {
  const plate = "🍗 Protéines à chaque repas · 🥦 moitié de l'assiette en légumes · 🍚 glucides à ta faim · 🫒 un peu de bon gras · 💧 eau toute la journée";
  if (p.objectif === "Perdre du gras") return { t: "Côté assiette — perte de gras", pts: [plate, "🚶 8-12 000 pas/jour : le levier n°1, devant le cardio", "🍽️ Volume : légumes et fibres pour la satiété", "⚖️ Pesée 1×/semaine MAX. La balance ment — la force stable, c'est ça la victoire", "🚫 Aucun aliment interdit. Des quantités, des fréquences."] };
  if (p.objectif === "Performance sportive ⚽") return { t: "L'entraînement invisible", pts: ["😴 Sommeil 8-9 h — le premier facteur anti-blessure", "🍚 Glucides autour des séances et des matchs", "🍽️ Repas complet 3-4 h avant le match, collation 1-2 h avant", "🥤 Dans les 30-60 min après : glucides + protéines", "💧 Hydratation stricte, plus s'il fait chaud"] };
  if (p.objectif === "Me sentir mieux") return { t: "Côté assiette — sans compter", pts: [plate, "🕐 Des repas à heures régulières — la base", "🔋 Ce qu'on regarde : ton énergie, ton sommeil, ton humeur. Pas le poids.", "☝️ Une habitude à la fois."] };
  return { t: "Côté assiette — construire", pts: [plate, "🍚 Glucides autour de l'entraînement — le carburant", "😴 Sommeil 7-8 h : c'est là que le muscle se construit", "📈 Le meilleur signal : les charges qui montent"] };
}

/* ═══ GÉNÉRATEUR DE PROGRAMME ═══ */
const SRA = { S: 1.0, A: 0.71, P: 0.43 };
function buildProgram(p) {
  const deb = p.niveau === "Je débute", av = p.niveau === "Niveau avancé";
  const dos = p.sante === "Dos sensible", gen = p.sante === "Genoux";
  const freq = parseInt(p.freq) || 3;
  const ph = phaseFor(p);
  const rir = ph?.rir || (deb ? "2-3" : av ? "0-1" : "1-2");
  const reps = (fb) => ph?.reps || fb;
  const drop = ph ? (ph.drop && !deb) : !deb;
  const mult = ph?.mult ?? 1;
  const adjS = (s) => Math.max(2, Math.round(s * mult));
  let base;

  if (p.objectif === "Développer mes fessiers 🍑") {
    const hinge = dos ? { n: "Cable Pull Through", c: "P", r: reps("12-15"), note: "remplace le RDL (dos sensible)" } : { n: "RDL", c: "S", r: reps(deb ? "10-12" : "8-10"), note: "dos neutre, étirement ischios" };
    base = { proto: "FESSIERS", icon: "🍑", officiel: true,
      cle: "Le Hip Thrust ouvre chaque jour fessiers. Isolation en fin. 3 angles jamais identiques.",
      marqueur: "Les charges qui montent", zone: [25, 35],
      days: [
        { d: "DAY 1", f: "Glutes Heavy", ex: [
          { n: "Hip Thrust", s: adjS(4), r: reps(deb ? "10-12" : "8-10"), rir, c: "A", drop, note: "Pause 1 s en haut" },
          { n: hinge.n, s: adjS(4), r: hinge.r, rir, c: hinge.c, note: hinge.note },
          { n: dos ? "DB Step Up" : "Bulgarian Split Squat", s: adjS(3), r: "10/j", rir, c: dos ? "A" : "S", note: "contrôle unilatéral" },
          { n: "Hip Abduction", s: adjS(3), r: "20", rir: "1-2", c: "P", drop, note: "burnout, buste penché" }]},
        { d: "DAY 2", f: "Upper Body", ex: [
          { n: "Lat Pulldown", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "tirage vertical" },
          { n: "Seated Row", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "tirage horizontal" },
          { n: "Lateral Raise", s: adjS(3), r: "12-15", rir: "2", c: "-", note: "épaules" },
          { n: "Triceps Pushdown", s: adjS(3), r: "12", rir: "2", c: "-", note: "bras" }]},
        { d: "DAY 3", f: "Glutes Volume+", ex: [
          { n: "Hip Thrust", s: adjS(4), r: reps("12-15"), rir, c: "A", drop, note: "tempo contrôlé" },
          { n: "Leg Press (pieds hauts)", s: adjS(4), r: reps("12-15"), rir, c: "S", note: "accent fessier" },
          { n: "Cable Kickback", s: adjS(3), r: "15/j", rir: "2", c: "P", note: "squeeze en haut" },
          { n: "Hip Abduction", s: adjS(3), r: "20", rir: "1-2", c: "P", drop, note: "volume élevé" }]},
        { d: "DAY 5", f: "Glutes Shape", ex: [
          { n: "DB Step Up", s: adjS(3), r: "10/j", rir: "2", c: "A", note: "montée contrôlée" },
          { n: "Walking Lunges", s: adjS(3), r: "10/j", rir: "2", c: "S", note: "amplitude" },
          { n: "Hip Thrust (pause)", s: adjS(3), r: reps(deb ? "10-12" : "8-10"), rir: "2", c: "A", note: "pause 2 s" },
          { n: "Kickback (slow)", s: adjS(3), r: "15/j", rir: "1-2", c: "P", note: "tempo lent" }]},
      ].slice(0, Math.max(2, Math.min(freq, 4))) };
  }
  else if (p.objectif === "Prendre du muscle") {
    const hinge = dos ? { n: "Leg Curl", c: "P" } : { n: "Romanian Deadlift", c: "S" };
    const R = reps("8-12");
    const push = [{ n: "Développé couché", s: adjS(4), r: R, rir, c: "-", drop, note: "ouverture lourde" },
      { n: "Développé incliné haltères", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "haut des pecs" },
      { n: "Développé militaire", s: adjS(3), r: reps("10-12"), rir, c: "-", note: "épaules" },
      { n: "Élévations latérales", s: adjS(3), r: "12-15", rir: "1-2", c: "-", note: "deltoïde" },
      { n: "Triceps Pushdown", s: adjS(3), r: "12", rir: "1-2", c: "-", drop, note: "isolation finale" }];
    const pull = [{ n: "Traction / Lat Pulldown", s: adjS(4), r: R, rir, c: "-", drop, note: "ouverture" },
      { n: "Rowing barre", s: adjS(4), r: R, rir, c: "-", note: "tirage horizontal" },
      { n: "Face Pull", s: adjS(3), r: "15", rir: "2", c: "-", note: "santé d'épaule" },
      { n: "Curl barre", s: adjS(3), r: reps("10-12"), rir: "1-2", c: "-", drop, note: "isolation finale" }];
    const legs = [{ n: "Back Squat", s: adjS(4), r: R, rir, c: "S", drop, note: "ouverture lourde" },
      { n: hinge.n, s: adjS(4), r: R, rir, c: hinge.c, note: dos ? "adapté dos sensible" : "chaîne postérieure" },
      { n: "Leg Press", s: adjS(3), r: "12", rir, c: "S", note: "volume quadriceps" },
      { n: "Leg Extension", s: adjS(3), r: "12-15", rir: "1-2", c: "P", drop, note: "isolation finale" }];
    const days = freq <= 2 ? [{ d: "FULL BODY A", f: "Haut dominant", ex: [push[0], pull[1], legs[0], push[2], pull[3]] }, { d: "FULL BODY B", f: "Bas dominant", ex: [legs[1], legs[2], pull[0], push[1], push[4]] }]
      : freq === 3 ? [{ d: "PUSH", f: "Pecs · Épaules · Triceps", ex: push }, { d: "PULL", f: "Dos · Biceps", ex: pull }, { d: "LEGS", f: "Jambes", ex: legs }]
      : [{ d: "UPPER A", f: "Haut (force)", ex: push.slice(0, 4) }, { d: "LOWER A", f: "Bas (force)", ex: legs },
         { d: "UPPER B", f: "Haut (volume)", ex: pull }, { d: "LOWER B", f: "Bas (volume)", ex: [legs[1], { n: "Fentes marchées", s: adjS(3), r: "10/j", rir, c: "S", note: "unilatéral" }, { n: "Leg Curl", s: adjS(3), r: "12", rir: "1-2", c: "P", note: "ischios" }, { n: "Mollets debout", s: adjS(4), r: "15", rir: "1-2", c: "P", drop, note: "isolation" }] }];
    base = { proto: "PRISE DE MUSCLE", icon: "💪", officiel: false,
      cle: "Ouvrir par le polyarticulaire le plus lourd, finir par une isolation. Surcharge progressive.",
      marqueur: "Les charges qui montent", zone: deb ? [15, 25] : [25, 35], days };
  }
  else if (p.objectif === "Perdre du gras") {
    const hinge = dos ? { n: "Leg Curl", c: "P" } : { n: "Romanian Deadlift", c: "S" };
    base = { proto: "PERTE DE GRAS", icon: "🔥", officiel: false,
      cle: "⚠️ On NE baisse PAS les charges. La salle sert à GARDER le muscle — la nutrition et le NEAT font le déficit.",
      neat: "🚶 8 000 – 12 000 pas/jour = le levier n°1",
      marqueur: "Force STABLE = victoire. La balance ment.", zone: deb ? [12, 20] : [20, 30],
      days: [
        { d: "FULL BODY A", f: "Maintien force", ex: [
          { n: "Back Squat", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "S", note: "LOURD — on garde" },
          { n: "Développé couché", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "-", note: "LOURD" },
          { n: "Rowing barre", s: adjS(3), r: "8-10", rir: "1-2", c: "-", note: "tirage" },
          { n: "Gainage", s: adjS(3), r: "45 s", rir: "-", c: "-", note: "superset possible" }]},
        { d: "FULL BODY B", f: "Maintien force", ex: [
          { n: hinge.n, s: adjS(4), r: reps("6-10"), rir: "1-2", c: hinge.c, note: dos ? "adapté" : "LOURD" },
          { n: "Traction / Lat Pulldown", s: adjS(4), r: reps("6-10"), rir: "1-2", c: "-", note: "LOURD" },
          { n: "Développé militaire", s: adjS(3), r: "8-10", rir: "1-2", c: "-", note: "épaules" },
          { n: "Fentes", s: adjS(3), r: "10/j", rir: "1-2", c: "S", note: "unilatéral" }]},
        { d: "FULL BODY C", f: "Maintien force", ex: [
          { n: "Leg Press", s: adjS(4), r: "8-12", rir: "1-2", c: "S", note: "jambes" },
          { n: "Dips / Développé incliné", s: adjS(3), r: "8-12", rir: "1-2", c: "-", note: "pecs" },
          { n: "Rowing haltère", s: adjS(3), r: "10/bras", rir: "1-2", c: "-", note: "dos unilatéral" },
          { n: "Circuit abdos", s: adjS(3), r: "10 min", rir: "-", c: "-", note: "densité" }]},
      ].slice(0, Math.max(2, Math.min(freq, 3))) };
  }
  else if (p.objectif === "Performance sportive ⚽") {
    if (p.periode === "Coupure / vacances")
      return { proto: "PERF — COUPURE", icon: "⚽", officiel: true, repos: true,
        phase: "REPOS COMPLET IMPOSÉ", stats: "0 séance · 19 jours",
        cle: "🛑 Le repos fait PARTIE du programme. Amiens SC impose 19 jours de repos complet.",
        citation: "« La récupération fait partie intégrante du développement des qualités athlétiques. »",
        marqueur: "Revenir frais. Un joueur cramé se blesse.", zone: [0, 0], days: [] };
    const enS = p.periode === "En saison";
    base = { proto: enS ? "PERF — EN SAISON" : "PERF — PRÉ-SAISON", icon: "⚽", officiel: true,
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
          { n: "Squat lent surface instable", s: 3, r: "10", rir: "-", c: "-", note: "lit/canapé, yeux fermés" }]},
        { d: "P4-P5", f: "Gainage · Renforcement", ex: [
          { n: "Gainage face + obliques + lombaire", s: 4, r: "30 s", rir: "-", c: "-", note: "4 tours, R=30s" },
          { n: "Pompes", s: 4, r: "20 s stat.", rir: "-", c: "-", note: "coudes 90°" },
          { n: "Chaise (mur)", s: 4, r: "20 s", rir: "-", c: "-", note: "cuisses parallèles" },
          { n: "Fente avant", s: 4, r: "20 s", rir: "-", c: "-", note: "genou ≤ orteils" }]},
        { d: "SPÉ ⚠️", f: "Prévention — 100 % excentrique", crit: true, ex: [
          { n: "Excentrique ischio-jambiers", s: 3, r: "8", rir: "-", c: "-", note: "🔴 blessure n°1 — descente LENTE" },
          { n: "Glissade adducteur", s: 3, r: "8/côté", rir: "-", c: "-", note: "🔴 pubalgie — retenir" },
          { n: "Excentrique mollets", s: 3, r: "8", rir: "-", c: "-", note: "🔴 tendon d'Achille" },
          { n: "Good morning unilatéral", s: 3, r: "8/j", rir: "-", c: "-", note: "chaîne postérieure" }]},
        { d: "P6-P7", f: "Aérobie · Étirements", ex: [
          { n: enS ? "Footing léger" : "Footing progressif", s: 1, r: enS ? "20 min" : "20-35 min", rir: "-", c: "-", note: `aisance respiratoire — ${p.allure || ""}` },
          { n: "Étirements passifs", s: 1, r: "20 s/position", rir: "-", c: "-", note: "⚠️ jamais d'à-coup" }]},
      ] };
    return base;
  }
  else {
    const sq = gen ? { n: "Squat sur chaise (assis-debout)", c: "S" } : { n: "Goblet Squat", c: "S" };
    base = { proto: "ME SENTIR MIEUX", icon: "🌿", officiel: false,
      cle: "🌿 On sous-charge VOLONTAIREMENT. Finis en te disant « j'aurais pu en faire plus ».",
      marqueur: "LA RÉGULARITÉ — le seul chiffre qui compte", zone: [8, 15],
      days: [
        { d: "FULL BODY A", f: "En douceur", ex: [
          { n: sq.n, s: 2, r: reps("12-15"), rir: "3-4", c: sq.c, note: "mouvement du quotidien" },
          { n: "Pompes inclinées (mur)", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "adapte l'inclinaison" },
          { n: "Tirage poulie basse", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "ouvre la poitrine" },
          { n: "Gainage face", s: 2, r: "20-30 s", rir: "-", c: "-", note: "le dos te dira merci" },
          { n: "Marche", s: 1, r: "10-15 min", rir: "-", c: "-", note: "tranquille" }]},
        { d: "FULL BODY B", f: "En douceur", ex: [
          { n: dos ? "Hip Thrust" : "Soulevé haltères léger", s: 2, r: reps("12-15"), rir: "3-4", c: dos ? "A" : "S", note: dos ? "rien sur la colonne" : "dos neutre" },
          { n: "Développé haltères assis", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "épaules" },
          { n: "Tirage vertical assisté", s: 2, r: reps("12-15"), rir: "3-4", c: "-", note: "dos" },
          { n: "Dead Bug", s: 2, r: "10/côté", rir: "-", c: "-", note: "gainage doux" },
          { n: "Marche", s: 1, r: "10-15 min", rir: "-", c: "-", note: "tranquille" }]},
      ].slice(0, Math.max(2, Math.min(freq, 3))) };
  }

  if (ph) {
    base.phase = `${ph.label} — ${ph.n}`;
    base.stats = `${ph.pct}${ph.reps ? " · " + ph.reps + " reps" : ""} · RIR ${ph.rir}`;
    base.phaseTip = ph.tip;
    base.deload = ph.mult < 1;
  }
  return base;
}

/* ═══ SCORE DE FORME (0-100) ═══ */
function scoreForme() {
  const ci = D().checkin;
  if (!ci) return null;
  let s = 50;
  if (ci.sommeil === "😴 Bon (7 h+)") s += 15; else if (ci.sommeil === "🙂 Correct") s += 5; else s -= 15;
  if (ci.energie === "⚡ Haute") s += 15; else if (ci.energie === "🙂 Normale") s += 5; else s -= 15;
  if (ci.corps === "✅ Frais") s += 15; else if (ci.corps === "😬 Courbatures fortes") s -= 10; else s -= 30;
  const target = parseInt(S.profile?.freq) || 3;
  const wk = sessionsThisWeek();
  s += Math.min(10, Math.round(wk / target * 10));
  s = Math.max(5, Math.min(100, s));
  const col = s >= 70 ? "var(--ok)" : s >= 45 ? "var(--gold)" : "var(--ko)";
  const lab = s >= 70 ? "FRAIS" : s >= 45 ? "CORRECT" : "FATIGUÉ";
  return { s, col, lab };
}
function sessionsThisWeek() {
  const now = new Date(); const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
  return S.history.filter(h => h.iso && new Date(h.iso) >= monday).length;
}
function loadGains() {
  const exos = {};
  S.history.forEach(h => h.ex.forEach(e => {
    const v = parseFloat(String(e.load).replace(",", "."));
    if (!isNaN(v)) (exos[e.n] = exos[e.n] || []).push(v);
  }));
  const g = {};
  Object.entries(exos).forEach(([n, pts]) => g[n] = { d: pts[pts.length - 1] - pts[0], pts });
  return g;
}

/* ═══ MESSAGES INTELLIGENTS DU COACH ═══ */
function coachMessages(P) {
  const msgs = [];
  const ci = D().checkin;
  const prenom = S.profile?.prenom || "";

  /* 1. Douleur au check-in — priorité absolue */
  if (ci?.corps === "🔴 Une douleur")
    msgs.push({ col: "var(--ko)", t: `${prenom}, une douleur n'est pas un détail. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé — et préviens Moustapha, il adaptera.` });

  /* 2. Semaine de deload */
  if (P?.deload)
    msgs.push({ col: "var(--ok)", t: `Cette semaine est légère — c'est le programme, pas une erreur. C'est pendant la récupération que le corps construit. Ne rajoute rien.` });

  /* 3. Longue absence */
  const lastIso = [...S.history].reverse().find(h => h.iso)?.iso;
  if (lastIso) {
    const jours = Math.floor((Date.now() - new Date(lastIso)) / 864e5);
    if (jours >= 7)
      msgs.push({ col: "var(--gold)", t: `${jours} jours sans séance. Aucune culpabilité — ça arrive à tout le monde. On repart PLUS PETIT, pas en rattrapant : une séance courte aujourd'hui vaut mieux qu'une séance parfaite jamais faite.` });
  }

  /* 4. Stagnation sur un exercice (3 dernières charges plates ou en baisse) */
  const gains = loadGains();
  for (const [n, g] of Object.entries(gains)) {
    if (g.pts.length >= 3) {
      const last3 = g.pts.slice(-3);
      if (last3[2] <= last3[0])
        { msgs.push({ col: "var(--gold)", t: `${n} : la charge ne bouge plus depuis 3 séances. Avant de forcer, vérifie le sommeil et l'assiette. Si ça continue → une semaine légère, puis on repart −10 %. C'est comme ça qu'on débloque.` }); break; }
    }
  }

  /* 5. Progression à célébrer */
  const best = Object.entries(gains).filter(([, g]) => g.d > 0).sort((a, b) => b[1].d - a[1].d)[0];
  if (best)
    msgs.push({ col: "var(--ok)", t: `+${best[1].d.toFixed(1).replace(".", ",")} kg sur ${best[0]} depuis le début. C'est ça, la vraie progression — pas la balance. Continue. 👊` });

  /* 6. Objectif de la semaine atteint */
  const target = parseInt(S.profile?.freq) || 3;
  if (sessionsThisWeek() >= target)
    msgs.push({ col: "var(--ok)", t: `${sessionsThisWeek()}/${target} séances cette semaine — objectif atteint. La régularité, c'est LE truc que la plupart des gens n'ont pas. Toi, tu l'as.` });

  /* 7. Changement de phase cette semaine */
  const lastW = store.get("lastSeenWeek", -1);
  const w = weekNum();
  if (w !== lastW && P?.phase && !P.repos) {
    store.set("lastSeenWeek", w);
    if (lastW >= 0)
      msgs.unshift({ col: "var(--gold)", t: `Nouvelle semaine, nouvelle phase : ${P.phase.split("— ")[1] || P.phase}. ${P.phaseTip || ""}` });
  }

  return msgs.slice(0, 2);
}

/* ═══ CHECK-IN ═══ */
const CI_Q = [
  { k: "sommeil", q: "Ton sommeil cette nuit ?", o: ["😴 Bon (7 h+)", "🙂 Correct", "😵 Mauvais (<6 h)"] },
  { k: "energie", q: "Ton énergie là, maintenant ?", o: ["⚡ Haute", "🙂 Normale", "🪫 Faible"] },
  { k: "corps", q: "Ton corps ?", o: ["✅ Frais", "😬 Courbatures fortes", "🔴 Une douleur"] },
];
function verdict(ci) {
  if (ci.corps === "🔴 Une douleur") return { v: "REPORTER", col: "var(--ko)", msg: "Une douleur, ce n'est pas une courbature. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé, et préviens Moustapha." };
  let score = 0;
  if (ci.sommeil === "😵 Mauvais (<6 h)") score++;
  if (ci.energie === "🪫 Faible") score++;
  if (ci.corps === "😬 Courbatures fortes") score++;
  if (score >= 2) return { v: "ALLÉGER", col: "var(--gold)", msg: "Aujourd'hui : −1 série par exercice, garde 1-2 reps de plus en réserve. Une séance allégée vaut mieux qu'une séance sautée." };
  return { v: "MAINTENIR", col: "var(--ok)", msg: "Tu es opérationnel. Séance normale — vas-y." };
}

/* ═══ BADGES ═══ */
function badges() {
  const n = S.history.length;
  const kg = Object.values(loadGains()).filter(g => g.d > 0).length;
  const water7 = Object.values(S.daily).filter(d => (d.water || 0) >= 6).length;
  return [
    { e: "🎯", t: "Première séance", got: n >= 1 },
    { e: "🔥", t: "5 séances", got: n >= 5 },
    { e: "💪", t: "10 séances", got: n >= 10 },
    { e: "🏆", t: "25 séances", got: n >= 25 },
    { e: "👑", t: "50 séances", got: n >= 50 },
    { e: "📈", t: "Une charge qui monte", got: kg >= 1 },
    { e: "🚀", t: "3 charges qui montent", got: kg >= 3 },
    { e: "💧", t: "Hydratation ×7 jours", got: water7 >= 7 },
    { e: "🗓️", t: "Cycle complet", got: weekNum() >= 8 && n >= 16 },
  ];
}

/* ═══ COACH LOCAL ═══ */
function localCoach(txt) {
  const t = txt.toLowerCase();
  if (/(douleur|mal au|mal à|blessé|blessure|lancinant|pique)/.test(t))
    return "Stop. Une douleur — pas une courbature — c'est un signal, pas un obstacle à contourner. On ne s'entraîne pas dessus.\n\nSi elle est vive ou qu'elle persiste : professionnel de santé (médecin ou kiné). Et préviens Moustapha, il ajustera ton programme.\n\nJe ne te proposerai pas d'exercice de remplacement pour « passer autour » — ce serait t'exposer.";
  if (/(calorie|maigrir vite|perdre vite|jeûne|jeune intermittent|déficit|se peser|balance|poids)/.test(t))
    return "Pour tout ce qui touche aux chiffres alimentaires, tu passes par Moustapha directement — c'est lui qui connaît ta situation.\n\nCe que je peux te dire sans risque : protéines à chaque repas, la moitié de l'assiette en légumes, des glucides à ta faim, de l'eau. Et la balance : 1×/semaine maximum. La force stable en salle, c'est ça, la vraie victoire.";
  if (/(motiv|envie de rien|flemme|démotivé|nul|abandonner|arrêter)/.test(t))
    return "Ce que tu ressens est normal — la motivation, ça va, ça vient. C'est pour ça qu'on ne compte pas dessus : on compte sur la régularité.\n\nAujourd'hui, vise la version minimale : viens, fais l'échauffement et le premier exercice. Si après ça tu veux rentrer, tu rentres — et ça comptera quand même.\n\nEt si c'est plus lourd qu'une baisse de motivation, parles-en à Moustapha. Il est là pour ça aussi.";
  if (/(rpe|difficulté|c'était dur)/.test(t))
    return "Le RPE, c'est ta note d'effort sur 10 :\n\n· 6-7 = solide, il restait 3-4 reps\n· 8 = il restait 2 reps\n· 9 = il restait 1 rep\n· 10 = rien dans le réservoir\n\nNote-le après chaque exercice : c'est lui qui me dit si on monte la charge ou si on consolide. Un 10 partout n'est PAS l'objectif — la plupart du travail se fait à 7-8.";
  if (/(courbature|douleurs? musculaires?)/.test(t))
    return "Courbature = normal, surtout après du nouveau ou du volume. Ça passe en 24-72 h.\n\nCe qui aide : bouger léger (marche, vélo doux), boire, dormir. Ce qui n'aide pas : ne plus bouger du tout.\n\n⚠️ La différence avec une douleur : la courbature est diffuse et des deux côtés. Une douleur précise, d'un seul côté, qui pique ou qui lance → repos et avis pro.";
  if (/(échauffement|echauffement|chauffe)/.test(t))
    return "L'échauffement n'est jamais optionnel — c'est lui qui prépare tes articulations et ton système nerveux.\n\nOuvre l'onglet Séance : ton rituel d'échauffement est en haut, adapté à ton protocole. 10-15 minutes qui protègent tout le reste.";
  if (/(deload|semaine légère|semaine legere|pourquoi léger)/.test(t))
    return "La semaine légère (deload) est VOLONTAIRE. Le muscle ne se construit pas pendant la séance — il se construit pendant la récupération.\n\nBaisser une semaine permet d'encaisser le bloc suivant plus fort. Ne rajoute rien cette semaine : c'est le programme.";
  if (/(repos|combien de temps entre|récup)/.test(t))
    return "Entre les séries : 60-90 s en hypertrophie, 2-3 min sur le lourd. Entre deux séances qui chargent les mêmes muscles lourdement : 48 h minimum.\n\nEt le vrai outil de récupération, c'est le sommeil : 7-8 h. Aucun complément ne remplace ça.";
  if (/(eau|hydrat|boire)/.test(t))
    return "Vise 2-3 L d'eau par jour, répartis. Le compteur de l'accueil est là pour ça — 6-8 verres, c'est déjà très bien.\n\nSigne simple : des urines claires. Et plus s'il fait chaud ou si tu transpires beaucoup.";
  return "Je suis la version embarquée du coach — je réponds aux questions courantes (échauffement, courbatures, repos, RPE, motivation, deload…).\n\nPour une question précise sur TON programme, ta nutrition ou quelque chose qui t'inquiète : Moustapha directement. C'est lui, le vrai coach — moi je suis son assistant. 💬";
}
async function askCoach(txt) {
  S.chat.push({ role: "user", content: txt });
  store.set("chat", S.chat); S.chatBusy = true; render();
  let reply = null;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch("/api/coach", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: S.chat.slice(-12), profile: S.profile }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (r.ok) { const d = await r.json(); reply = d.text || null; }
  } catch (e) { /* pas d'API → coach local */ }
  if (!reply) reply = localCoach(txt);
  S.chat.push({ role: "assistant", content: reply });
  store.set("chat", S.chat); S.chatBusy = false; render();
  setTimeout(() => { const b = $("#chatBox"); if (b) b.scrollTop = b.scrollHeight; }, 60);
}

/* ═══ UI ═══ */
const TABS = [
  { id: "home", ico: "🏠", l: "Accueil" },
  { id: "prog", ico: "🏋️", l: "Programme" },
  { id: "coach", ico: "💬", l: "Coach", center: true },
  { id: "suivi", ico: "📈", l: "Progression" },
  { id: "profil", ico: "👤", l: "Profil" },
];
const TAB_ORDER = TABS.map(t => t.id);

function render() {
  const P = S.profile ? buildProgram(S.profile) : null;
  $("#topRight").innerHTML = P
    ? `<div style="cursor:pointer" onclick="go('seance')"><div class="n">🔥 Séance</div><div class="s">tracker ›</div></div>`
    : "";
  $("#tabbar").innerHTML = TABS.map(t => t.center
    ? `<button class="tab center ${S.tab === t.id ? "on" : ""}" onclick="go('${t.id}')">
        <span class="cbtn">${t.ico}</span><span class="lb">${t.l}</span></button>`
    : `<button class="tab ${S.tab === t.id ? "on" : ""}" onclick="go('${t.id}')">
        <span class="ico">${t.ico}</span><span class="lb">${t.l}</span><span class="dot"></span></button>`).join("");

  const sc = $("#screen");
  sc.className = "screen"; void sc.offsetWidth;
  if (!S.profile && S.tab !== "profil") S.tab = "profil";

  if (S.tab === "profil") sc.innerHTML = S.profile ? viewProfile(P) : viewBilan();
  else if (S.tab === "home") sc.innerHTML = viewHome(P);
  else if (S.tab === "prog") sc.innerHTML = viewProg(P);
  else if (S.tab === "seance") sc.innerHTML = viewSeance(P);
  else if (S.tab === "coach") sc.innerHTML = viewCoach();
  else if (S.tab === "suivi") sc.innerHTML = viewSuivi();
  if (S.tab === "coach") setTimeout(() => { const b = $("#chatBox"); if (b) b.scrollTop = b.scrollHeight; }, 40);
}
window.go = (t) => { S.tab = t; render(); };

/* Swipe entre onglets */
(function initSwipe() {
  let x0 = null, y0 = null;
  document.addEventListener("touchstart", (e) => {
    if (e.target.closest(".timer-wrap,.chatbox,input,textarea")) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 64 || Math.abs(dy) > 46) return;
    const cur = TAB_ORDER.indexOf(S.tab === "seance" ? "prog" : S.tab);
    if (cur < 0) return;
    const nxt = dx < 0 ? Math.min(cur + 1, TAB_ORDER.length - 1) : Math.max(cur - 1, 0);
    if (nxt !== cur) { S.tab = TAB_ORDER[nxt]; render(); }
  }, { passive: true });
})();

/* ── ACCUEIL ── */
function viewHome(P) {
  const d = D();
  const ci = d.checkin;
  const sf = scoreForme();
  const neatGoal = S.profile.objectif === "Perdre du gras" ? 10000 : 8000;
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Salut" : "Bonsoir";
  const target = parseInt(S.profile.freq) || 3;
  const msgs = coachMessages(P);

  /* Anneau de forme */
  const ring = sf
    ? `<div class="scorering anim-item" onclick="resetCI()">
        <svg width="150" height="150"><circle class="track" cx="75" cy="75" r="62"/>
        <circle cx="75" cy="75" r="62" fill="none" stroke="${sf.col}" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="389" stroke-dashoffset="${389 * (1 - sf.s / 100)}"
          style="transform-origin:center;transform:rotate(-90deg);transition:stroke-dashoffset 1s cubic-bezier(.22,.9,.3,1)"/></svg>
        <div class="scorenum"><div style="font-family:Oswald;font-weight:700;font-size:40px;color:${sf.col};line-height:1">${sf.s}</div>
          <div style="font-size:8.5px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-top:3px">Forme · ${sf.lab}</div></div>
      </div>
      ${(() => { const v = verdict(ci); return `<div style="text-align:center;margin:-4px 0 12px">
        <span class="badge" style="color:${v.col};border:1.5px solid ${v.col};font-size:11px;padding:6px 14px">Séance du jour : ${v.v}</span></div>`; })()}`
    : (() => {
      const q = CI_Q[S.ciStep];
      return `<div class="card gold glow anim-item">
        <div class="eyebrow" style="margin-top:0">Check-in du jour (${S.ciStep + 1}/3) — 20 secondes</div>
        <div style="font-family:Oswald;font-weight:600;font-size:17px;text-transform:uppercase;margin-bottom:11px">${q.q}</div>
        ${q.o.map(o => `<div class="choice" style="padding:12px 14px;font-size:14px" onclick="ciPick('${q.k}',\`${o}\`)">${o}<span class="chk">✓</span></div>`).join("")}
      </div>`;
    })();

  return `
    <div class="h1">${salut}, <em>${S.profile.prenom || ""}</em></div>
    <div class="sub">${P?.phase || P?.proto || ""}</div>
    ${ring}
    ${msgs.map((m, i) => `<div class="card anim-item" style="animation-delay:${.06 + i * .06}s;border-left:3px solid ${m.col}">
      <div style="display:flex;gap:10px">
        <div style="width:30px;height:30px;border-radius:9px;flex:none;background:linear-gradient(135deg,var(--gold),var(--gold-dim));display:flex;align-items:center;justify-content:center;font-family:Oswald;font-weight:700;color:#1a1206;font-size:14px">M</div>
        <div style="font-size:13px;line-height:1.6;padding-top:2px">${m.t}</div></div></div>`).join("")}
    <div class="statgrid anim-item" style="animation-delay:.14s">
      <div class="stat"><div class="v" style="color:var(--gold)">${sessionsThisWeek()}/${target}</div><div class="l">Séances cette semaine</div></div>
      <div class="stat"><div class="v" style="color:var(--ok)">${S.history.length}</div><div class="l">Total séances</div></div>
    </div>
    <div class="card anim-item" style="animation-delay:.18s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:600;font-size:14px">💧 Hydratation</div>
        <div style="font-family:Oswald;color:var(--gold)">${d.water || 0}/8</div></div>
      <div style="display:flex;gap:5px">${Array.from({length:8},(_,i)=>`<div onclick="setWater(${i+1})" style="flex:1;height:26px;border-radius:7px;cursor:pointer;transition:all .2s;background:${i<(d.water||0)?"var(--blue)":"var(--panel2)"};border:1px solid ${i<(d.water||0)?"var(--blue)":"var(--line)"}"></div>`).join("")}</div>
    </div>
    <div class="card anim-item" style="animation-delay:.22s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:600;font-size:14px">🚶 Pas du jour</div>
        <div style="font-family:Oswald;color:${(d.steps||0)>=neatGoal?"var(--ok)":"var(--gold)"}">${(d.steps||0).toLocaleString("fr-FR")} / ${neatGoal.toLocaleString("fr-FR")}</div></div>
      <div style="height:7px;background:var(--panel2);border-radius:4px;overflow:hidden;margin-bottom:9px">
        <div style="height:100%;width:${Math.min((d.steps||0)/neatGoal*100,100)}%;background:${(d.steps||0)>=neatGoal?"var(--ok)":"var(--gold)"};border-radius:4px;transition:width .5s"></div></div>
      <div class="row">
        <button class="btn s" style="padding:10px;font-size:11px" onclick="addSteps(1000)">+1 000</button>
        <button class="btn s" style="padding:10px;font-size:11px" onclick="addSteps(5000)">+5 000</button>
        <button class="btn s" style="padding:10px;font-size:11px" onclick="addSteps(-1000)">−1 000</button>
      </div>
    </div>
    <button class="btn p anim-item" style="animation-delay:.26s" onclick="go('seance')">🔥 Lancer ma séance</button>
    <div style="text-align:center;font-family:Oswald;font-size:11px;letter-spacing:.14em;color:var(--gold);text-transform:uppercase;margin-top:18px">« Discipline today, results tomorrow »</div>`;
}
window.ciPick = (k, o) => {
  S.ciTmp[k] = o;
  if (S.ciStep < CI_Q.length - 1) { S.ciStep++; }
  else { D().checkin = { ...S.ciTmp }; saveDaily(); S.ciStep = 0; S.ciTmp = {}; if (navigator.vibrate) navigator.vibrate(40); }
  render();
};
window.resetCI = () => { delete D().checkin; saveDaily(); S.ciStep = 0; S.ciTmp = {}; render(); };
window.setWater = (n) => { const d = D(); d.water = d.water === n ? n - 1 : n; saveDaily(); render(); };
window.addSteps = (n) => { const d = D(); d.steps = Math.max(0, (d.steps || 0) + n); saveDaily(); render(); };

/* ── BILAN / PROFIL ── */
function viewBilan() {
  const QS = questions(S.bilanAns);
  const q = QS[S.bilanIdx];
  const dots = QS.map((_, i) => `<div class="pdot ${i <= S.bilanIdx ? "on" : ""}"></div>`).join("");
  let body;
  if (q.type === "text") {
    body = `<input class="input anim-item" placeholder="${q.ph}" value="${S.txt || ""}" oninput="S.txt=this.value;checkNext()">`;
  } else {
    body = q.o.map((o, i) =>
      `<div class="choice anim-item ${S.bilanAns[q.k] === o ? "sel" : ""}" style="animation-delay:${i * 55}ms" onclick="pick('${q.k}',${i})">${o}<span class="chk">✓</span></div>`).join("");
  }
  return `<div class="h1">Ton <em>bilan</em></div>
    <div class="sub">Question ${S.bilanIdx + 1} / ${QS.length}</div>
    <div class="progress-dots">${dots}</div>
    <div style="font-family:Oswald;font-weight:600;font-size:19px;text-transform:uppercase;margin:6px 0 14px" class="anim-item">${q.q}</div>
    ${body}
    <div class="row" style="margin-top:20px">
      ${S.bilanIdx > 0 ? `<button class="btn s" onclick="bPrev()">Retour</button>` : ""}
      <button class="btn p" id="nextBtn" ${valOK(q) ? "" : "disabled"} onclick="bNext()">${S.bilanIdx >= QS.length - 1 ? "✓ Terminer" : "Suivant"}</button>
    </div>`;
}
function valOK(q) { return q.type === "text" ? (S.txt || "").trim() : S.bilanAns[q.k]; }
window.checkNext = () => { const QS = questions(S.bilanAns); $("#nextBtn").disabled = !valOK(QS[S.bilanIdx]); };
window.pick = (k, i) => { const q = questions(S.bilanAns).find(x => x.k === k); S.bilanAns[k] = q.o[i]; render(); };
window.bPrev = () => { S.bilanIdx--; S.txt = ""; render(); };
window.bNext = () => {
  const QS = questions(S.bilanAns);
  const q = QS[S.bilanIdx];
  if (q.type === "text") S.bilanAns[q.k] = S.txt.trim();
  const QS2 = questions(S.bilanAns);
  if (S.bilanIdx >= QS2.length - 1) {
    S.profile = { ...S.bilanAns, start: Date.now() };
    store.set("profile", S.profile);
    store.set("lastSeenWeek", 0);
    S.tab = "home"; S.bilanIdx = 0; S.txt = "";
  } else { S.bilanIdx++; S.txt = ""; }
  render();
};
function viewProfile(P) {
  const rows = questions(S.profile).map(q =>
    `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:13.5px">
      <span style="color:var(--muted)">${q.q.replace(/\s*\?$/, "")}</span>
      <span style="font-weight:600;text-align:right">${S.profile[q.k] || "—"}</span></div>`).join("");
  return `<div class="h1">Ton <em>profil</em></div>
    <div class="sub">Semaine ${weekNum() + 1} de ton parcours · mémorisé sur ton téléphone</div>
    <div class="card gold anim-item">
      <div style="display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:6px">
        <div style="font-size:26px">${P.icon}</div>
        <div><div style="font-family:Oswald;font-weight:700;font-size:15px;color:var(--gold)">PROTOCOLE ${P.proto}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${P.officiel ? "✅ Méthode officielle" : "🔶 À valider par le coach"}</div></div>
      </div>${rows}</div>
    <button class="btn s anim-item" onclick="if(confirm('Refaire le bilan ? Ton historique est conservé, mais le cycle repart à la semaine 1.')){S.profile=null;store.del('profile');S.bilanAns={};S.bilanIdx=0;render()}">↺ Refaire le bilan</button>
    <div style="text-align:center;font-size:10px;color:#4c4c52;margin-top:16px;line-height:1.6">
      ⚠️ Douleur = stop + professionnel de santé.<br>Pré-programmes à valider par le coach · pas un avis médical.</div>`;
}

/* ── ROADMAP ── */
function roadmapHTML(p) {
  const cyc = cycleFor(p);
  if (!cyc) {
    const periods = ["Coupure / vacances", "Pré-saison", "En saison"];
    const cur = p.periode;
    return `<div class="eyebrow">🗺️ Ta saison</div><div class="roadmap">
      ${periods.map(x => `<div class="phasechip ${x === cur ? "cur" : ""}">${x}</div>`).join('<div class="arrow">›</div>')}
    </div>
    <div style="font-size:11px;color:var(--muted);margin:-4px 0 12px">Le passage d'une période à l'autre se décide avec le coach — pas automatiquement.</div>`;
  }
  const w = weekNum() % cyc.length;
  return `<div class="eyebrow">🗺️ Ton cycle — où tu en es</div><div class="roadmap">
    ${cyc.map((c, i) => `<div class="phasechip ${i < w ? "done" : ""} ${i === w ? "cur" : ""}">
      <div style="font-size:8px;opacity:.7">S${i + 1}</div>${c.n}${i < w ? " ✓" : ""}</div>`).join("")}
  </div>
  <div style="font-size:11px;color:var(--muted);margin:-4px 0 12px">La phase suivante démarre lundi prochain. Si une semaine s'est mal passée, dis-le au coach — on ajuste, on n'enchaîne pas bêtement.</div>`;
}

/* ── PROGRAMME ── */
function viewProg(P) {
  if (!P) return emptyState("🏋️", "Fais ton bilan", "Ton programme en découle.", "profil");
  if (P.repos) return `
    <div class="card anim-item" style="border-color:rgba(229,72,77,.4);text-align:center;padding:26px 16px;margin-top:18px">
      <div style="font-size:44px;animation:pop .5s">🛑</div>
      <div style="font-family:Oswald;font-weight:700;font-size:23px;text-transform:uppercase;margin-top:10px">${P.phase}</div>
      <div style="font-family:Oswald;font-size:15px;color:var(--gold);margin-top:8px">${P.stats}</div></div>
    <div class="card gold anim-item"><div style="font-size:14px;line-height:1.6">${P.cle}</div>
      <div style="font-size:12px;color:var(--muted);font-style:italic;border-left:2px solid var(--gold);padding-left:11px;margin-top:11px;line-height:1.6">${P.citation}</div></div>
    ${roadmapHTML(S.profile)}
    <div class="card anim-item"><div class="eyebrow" style="margin-top:0">Ce que tu peux faire</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.9">🚶 Marche · randonnée<br>🚴 Vélo (45-90 min)<br>🏊 Natation<br>🎾 Raquettes<br>😴 <b style="color:var(--ink)">Et surtout : dormir.</b></div></div>`;

  const uf = P.days.reduce((a, d) => a + d.ex.reduce((b, e) => b + (SRA[e.c] || 0) * e.s, 0), 0);
  const pct = Math.min(uf / 50 * 100, 100);
  const col = uf > P.zone[1] + 10 ? "var(--ko)" : uf >= P.zone[0] ? "var(--ok)" : "var(--gold)";
  const N = nutri(S.profile);

  return `
    <div class="card gold glow anim-item" style="text-align:center;margin-top:18px">
      <div style="font-size:28px">${P.icon}</div>
      <div style="font-family:Oswald;font-weight:700;font-size:17px;color:var(--gold);text-transform:uppercase;margin-top:5px">PROTOCOLE ${P.proto}</div>
      <div style="font-family:Oswald;font-weight:700;font-size:21px;text-transform:uppercase;margin-top:9px">${P.phase || ""}</div>
      <div style="font-family:Oswald;font-size:13.5px;color:var(--gold);margin-top:5px">${P.stats || ""}</div>
      ${P.deload ? `<div class="badge" style="background:rgba(78,208,122,.12);color:var(--ok);border:1px solid var(--ok);margin-top:9px">SEMAINE LÉGÈRE — C'EST VOLONTAIRE</div>` : ""}
      ${P.officiel ? "" : `<div style="font-size:10px;color:var(--muted);margin-top:7px">🔶 À valider par le coach</div>`}
    </div>
    ${roadmapHTML(S.profile)}
    ${P.phaseTip ? `<div class="card anim-item" style="border-left:3px solid var(--gold)"><div style="font-size:13px;line-height:1.6">📅 <b>Cette semaine :</b> ${P.phaseTip}</div></div>` : ""}
    <div class="card anim-item" style="border-left:3px solid var(--gold)">
      <div style="font-size:13.5px;line-height:1.6">${P.cle}</div></div>
    ${P.neat ? `<div class="card anim-item" style="border-left:3px solid var(--ok)"><div style="font-size:13.5px">${P.neat}</div></div>` : ""}
    ${P.days.map((d, i) => `
      <div class="card ${d.crit ? "" : "gold"} anim-item" style="animation-delay:${.1 + i * .06}s${d.crit ? ";border-color:rgba(229,72,77,.45)" : ""}">
        <div style="font-family:Oswald;font-weight:700;font-size:18px;${d.crit ? "color:var(--ko)" : ""}">${d.d}</div>
        <div style="font-family:Oswald;font-size:10.5px;color:var(--gold);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${d.f}</div>
        ${d.ex.map(e => `<div class="exline">
          <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${e.n}
            ${SRA[e.c] ? `<span class="badge" style="color:${e.c === "S" ? "var(--ko)" : e.c === "A" ? "var(--gold)" : "var(--ok)"};border:1px solid currentColor;margin-left:5px;font-size:8px;padding:2px 5px">${e.c}</span>` : ""}</div>
            <div style="font-size:10.5px;color:var(--muted);margin-top:2px">${e.note}${e.drop ? ' · <span style="color:var(--gold)">DROP SET</span>' : ""}</div></div>
          <div style="font-family:Oswald;font-size:12.5px;color:var(--gold);white-space:nowrap">${e.s}×${e.r}</div>
          ${e.rir !== "-" ? `<div style="font-size:10px;color:var(--muted);min-width:40px;text-align:right">RIR ${e.rir}</div>` : ""}
        </div>`).join("")}
      </div>`).join("")}
    ${uf > 0 ? `<div class="card gold anim-item">
      <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:9px">
        <span style="color:var(--muted)">Volume hebdo</span><b style="color:var(--gold)">${uf.toFixed(1)} UF</b></div>
      <div style="height:7px;background:var(--panel2);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:4px;transition:width .8s"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:6px">
        <span>0</span><span>zone ${P.zone[0]}-${P.zone[1]}</span><span>50</span></div></div>` : ""}
    <div class="card anim-item"><div class="eyebrow" style="margin-top:0">🍽️ ${N.t}</div>
      ${N.pts.map(x => `<div style="font-size:12.5px;line-height:1.6;color:var(--muted);padding:4px 0">${x}</div>`).join("")}
      <div style="font-size:10.5px;color:#4c4c52;margin-top:8px">Repères généraux — pour un plan personnalisé, vois avec Moustapha.</div></div>
    <button class="btn p anim-item" onclick="go('seance')">🔥 Lancer la séance</button>
    <div style="text-align:center;font-size:10px;color:#4c4c52;margin-top:12px">Pré-programme · à valider par le coach · pas un avis médical</div>`;
}

/* ── SÉANCE (RPE + notes) ── */
function viewSeance(P) {
  if (!P) return emptyState("🔥", "Fais ton bilan", "Puis lance ta première séance.", "profil");
  if (P.repos) return emptyState("🛑", "Repos imposé", "Pas de séance à tracker. C'est volontaire — le repos fait partie du programme.");
  if (S.dayIdx >= P.days.length) S.dayIdx = 0;
  const day = P.days[S.dayIdx];
  const ci = D().checkin;
  const v = ci ? verdict(ci) : null;
  const alleger = v?.v === "ALLÉGER";

  if (!S.session || S.session.d !== day.d) {
    const last = [...S.history].reverse().find(h => h.day === day.d);
    S.session = { d: day.d, st: day.ex.map(e => {
      const prev = last?.ex.find(x => x.n === e.n);
      const lastLoad = prev?.load && prev.load !== "—" ? prev.load : "";
      const lastFull = prev && prev.sets >= e.s;
      const lastRpe = prev?.rpe || null;
      const lv = parseFloat(String(lastLoad).replace(",", "."));
      let sug = null, sugTxt = "";
      if (lastFull && !isNaN(lv) && !P.deload) {
        if (lastRpe && lastRpe >= 9.5) { sug = lv; sugTxt = `RPE ${lastRpe} la dernière fois → même charge, consolide`; }
        else { sug = lv + (e.c === "S" ? 5 : 2.5); sugTxt = `toutes séries faites${lastRpe ? " · RPE " + lastRpe : ""} → vise <b>${String(sug).replace(".", ",")} kg</b>`; }
      }
      return { n: e.n, sets: alleger ? Math.max(2, e.s - 1) : e.s, done: 0, load: lastLoad, sug, sugTxt, lastLoad, rpe: null, note: "" };
    }) };
  }

  const W = warmup(S.profile);
  const total = S.session.st.reduce((a, s) => a + s.sets, 0);
  const nb = S.session.st.reduce((a, s) => a + s.done, 0);
  const fini = nb >= total;

  return `
    <div style="display:flex;gap:6px;margin-top:16px;overflow-x:auto;padding-bottom:2px">
      ${P.days.map((d, i) => `<button class="btn ${i === S.dayIdx ? "p" : "s"}" style="padding:10px 6px;font-size:10.5px;min-width:78px;flex:1"
        onclick="S.dayIdx=${i};S.session=null;render()">${d.d}</button>`).join("")}</div>
    ${v && v.v !== "MAINTENIR" ? `<div class="card anim-item" style="margin-top:12px;border:1.5px solid ${v.col}">
      <div style="font-family:Oswald;font-weight:700;color:${v.col};text-transform:uppercase;font-size:14px">${v.v === "REPORTER" ? "🔴 Check-in : REPORTER" : "🟡 Check-in : séance allégée"}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:5px;line-height:1.55">${v.v === "REPORTER" ? "Ton corps a parlé ce matin. Reporter n'est pas abandonner." : "−1 série par exercice appliquée automatiquement. Garde de la réserve."}</div></div>` : ""}
    <div style="font-family:Oswald;font-weight:700;font-size:19px;text-transform:uppercase;margin-top:14px;${day.crit ? "color:var(--ko)" : ""}" class="anim-item">${day.d} — ${day.f}</div>
    <div class="card anim-item" style="margin-top:11px;cursor:pointer" onclick="S.warmOpen=!S.warmOpen;render()">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:600;font-size:13.5px">🔶 ${W.t}</div>
        <div style="color:var(--gold);font-family:Oswald">${S.warmOpen ? "−" : "+"}</div></div>
      ${S.warmOpen ? `<div style="margin-top:9px">${W.ex.map(x => `<div style="font-size:12.5px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--line)">› ${x}</div>`).join("")}</div>` : ""}
    </div>
    <div style="height:6px;background:var(--panel2);border-radius:4px;margin-top:6px;overflow:hidden">
      <div style="height:100%;width:${nb / total * 100}%;background:var(--gold);border-radius:4px;transition:width .4s"></div></div>
    <div style="font-size:10.5px;color:var(--muted);margin-top:6px">${nb}/${total} séries</div>
    ${day.ex.map((e, i) => {
      const st = S.session.st[i];
      const exDone = st.done >= st.sets;
      return `<div class="card anim-item" style="animation-delay:${i * 60}ms${exDone ? ";border-color:rgba(78,208,122,.4)" : ""}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="flex:1"><div style="font-weight:600;font-size:14.5px">${exDone ? "✅ " : ""}${e.n}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${st.sets} × ${e.r}${e.rir !== "-" ? " · RIR " + e.rir : ""}${e.drop && !P.deload ? ' · <span style="color:var(--gold)">DROP SET</span>' : ""}</div></div>
          ${SRA[e.c] ? `<input class="kg-input" placeholder="kg" inputmode="decimal" value="${st.load}" oninput="S.session.st[${i}].load=this.value">` : ""}
        </div>
        ${st.sug ? `<div style="font-size:11.5px;color:var(--ok);background:rgba(78,208,122,.07);border-radius:8px;padding:7px 10px;margin-bottom:8px">💡 Dernière fois : ${st.lastLoad} kg, ${st.sugTxt}</div>`
          : st.lastLoad ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Dernière fois : ${st.lastLoad} kg</div>` : ""}
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">💡 ${e.note}</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          ${Array.from({ length: st.sets }, (_, k) =>
            `<button class="setbtn ${k < st.done ? "done" : ""}" onclick="tick(${i},${k})">${k + 1}</button>`).join("")}
        </div>
        ${exDone && e.rir !== "-" ? `
        <div style="margin-top:11px;padding-top:11px;border-top:1px solid var(--line)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:7px">C'était dur comment ? (RPE)</div>
          <div style="display:flex;gap:6px">
            ${[7, 8, 9, 10].map(r => `<button class="rpechip ${st.rpe === r ? "sel" : ""}" onclick="setRpe(${i},${r})">${r}</button>`).join("")}
          </div>
          <input class="input" placeholder="Note (optionnel) : sensation, douleur, matériel…" value="${st.note || ""}"
            style="padding:10px;font-size:12.5px;margin-top:8px" oninput="S.session.st[${i}].note=this.value">
        </div>` : ""}
      </div>`;
    }).join("")}
    ${fini ? `<div class="card gold anim-item" style="text-align:center">
      <div style="font-family:Oswald;font-weight:700;font-size:20px;text-transform:uppercase">Séance terminée 🔥</div>
      <div style="font-size:12.5px;color:var(--muted);margin:9px 0 14px;line-height:1.55">Charges, RPE et notes seront rechargés la prochaine fois.</div>
      <button class="btn p" onclick="saveSession()">💾 Enregistrer</button></div>` : ""}`;
}
window.setRpe = (i, r) => { const st = S.session.st[i]; st.rpe = st.rpe === r ? null : r; render(); };

window.tick = (i, k) => {
  const st = S.session.st[i];
  st.done = k < st.done ? k : k + 1;
  render();
  if (st.done > 0 && st.done < st.sets) startRest(60);
};

window.saveSession = () => {
  const P = buildProgram(S.profile);
  const day = P.days[S.dayIdx];
  S.history.push({ date: new Date().toLocaleDateString("fr-FR"), iso: new Date().toISOString(), day: day.d, focus: day.f,
    ex: S.session.st.map(s => ({ n: s.n, load: s.load || "—", sets: s.done, rpe: s.rpe, note: s.note || "" })) });
  store.set("history", S.history);
  S.session = null;
  celebrate();
  setTimeout(() => { S.tab = "suivi"; render(); }, 1200);
};

function celebrate() {
  const em = ["🔥", "💪", "⭐", "🏆", "✨"];
  for (let i = 0; i < 18; i++) {
    const e = document.createElement("div");
    e.className = "confetti"; e.textContent = em[i % em.length];
    e.style.left = 8 + Math.random() * 84 + "%";
    e.style.top = 55 + Math.random() * 30 + "%";
    e.style.animationDelay = Math.random() * .4 + "s";
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 1800);
  }
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
}

/* Timer repos */
function startRest(sec) {
  clearInterval(S.restTimer);
  S.rest = sec; S.restTotal = sec;
  drawRest();
  S.restTimer = setInterval(() => {
    S.rest--;
    if (S.rest <= 0) { stopRest(); if (navigator.vibrate) navigator.vibrate(180); }
    else drawRest();
  }, 1000);
}
function drawRest() {
  let w = $("#restWrap");
  if (!w) {
    w = document.createElement("div"); w.id = "restWrap"; w.className = "timer-wrap";
    w.innerHTML = `<div class="timer-ring">
      <svg width="190" height="190"><circle class="track" cx="95" cy="95" r="54"/>
      <circle class="fill" id="ringFill" cx="95" cy="95" r="54"/></svg>
      <div class="timer-num"><div class="t" id="restNum"></div><div class="l">Repos — respire</div></div></div>
      <button class="btn p" style="max-width:200px;margin-top:26px" onclick="stopRest()">Passer</button>`;
    document.body.appendChild(w);
  }
  $("#restNum").textContent = S.rest + "s";
  $("#ringFill").style.strokeDashoffset = 339 * (1 - S.rest / S.restTotal);
}
window.stopRest = () => { clearInterval(S.restTimer); S.rest = null; $("#restWrap")?.remove(); };

/* ── COACH ── */
const CHIPS = ["Échauffement ?", "Courbatures ?", "C'est quoi le RPE ?", "Pas motivé", "C'est quoi le deload ?"];
function viewCoach() {
  return `<div class="h1" style="padding-top:14px">Ton <em>coach</em></div>
    <div class="sub">Questions courantes ici. Pour la douleur, la nutrition ou le moral → Moustapha directement.</div>
    <div id="chatBox" class="chatbox">
      ${S.chat.length === 0 ? `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:26px 10px;line-height:1.6">Pose-moi une question sur ta séance,<br>ou choisis un sujet ⤵</div>` : ""}
      ${S.chat.map(m => `<div class="bubble ${m.role === "user" ? "me" : ""}">${m.content.replace(/\n/g, "<br>")}</div>`).join("")}
      ${S.chatBusy ? `<div class="bubble" style="animation:pulse 1.2s infinite">…</div>` : ""}
    </div>
    <div style="display:flex;gap:6px;overflow-x:auto;padding:8px 0">
      ${CHIPS.map(c => `<button class="chip" onclick="askCoach(\`${c}\`)">${c}</button>`).join("")}
    </div>
    <div class="row" style="margin-top:4px">
      <input class="input" id="chatIn" placeholder="Écris au coach…" style="flex:1;padding:13px"
        onkeydown="if(event.key==='Enter'&&this.value.trim()){askCoach(this.value.trim());this.value=''}">
      <button class="btn p" style="width:64px;flex:none" onclick="const i=$('#chatIn');if(i.value.trim()){askCoach(i.value.trim());i.value=''}">➤</button>
    </div>`;
}
window.askCoach = askCoach;

/* ── PROGRESSION ── */
function viewSuivi() {
  const bienEtre = S.profile?.objectif === "Me sentir mieux";
  const gains = loadGains();
  const B = badges();
  const m = S.measures;
  const rpes = S.history.flatMap(h => h.ex.map(e => e.rpe).filter(Boolean));
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null;

  return `<div class="h1">Ta <em>progression</em></div>
    <div class="sub">${S.history.length} séance${S.history.length > 1 ? "s" : ""} · semaine ${weekNum() + 1}${avgRpe ? " · RPE moyen " + avgRpe : ""}</div>

    <div class="eyebrow" style="margin-top:8px">🏅 Badges</div>
    <div class="badgegrid anim-item">
      ${B.map(b => `<div class="badgecard ${b.got ? "got" : ""}"><div style="font-size:22px">${b.e}</div><div style="font-size:9px;margin-top:4px;line-height:1.3">${b.t}</div></div>`).join("")}
    </div>

    ${Object.keys(gains).length ? `<div class="eyebrow">Progression des charges</div>` : ""}
    ${Object.entries(gains).map(([n, g], ci) => {
      const pts = g.pts, d = g.d;
      const max = Math.max(...pts) * 1.15;
      return `<div class="card anim-item" style="animation-delay:${ci * 70}ms">
        <div style="display:flex;align-items:center;margin-bottom:10px">
          <div style="flex:1;font-weight:600;font-size:14px">${n}</div>
          <div style="font-family:Oswald;font-size:15px;color:${d > 0 ? "var(--ok)" : d < 0 ? "var(--ko)" : "var(--muted)"}">${d > 0 ? "+" : ""}${d.toFixed(1)} kg</div></div>
        <div style="display:flex;align-items:flex-end;gap:5px;height:62px">
          ${pts.map((v, k) => `<div style="flex:1;text-align:center">
            <div class="chartbar" style="height:${v / max * 52}px;min-height:4px;animation-delay:${k * 80}ms"></div>
            <div style="font-size:8.5px;color:var(--muted);margin-top:3px">${v}</div></div>`).join("")}
        </div></div>`;
    }).join("")}

    ${bienEtre ? `<div class="card anim-item" style="border-left:3px solid var(--ok)">
      <div style="font-size:13px;line-height:1.6">🌿 Ici, on ne suit <b>pas le poids</b> — c'est le protocole. Ce qu'on regarde : ton énergie, ton sommeil, et le fait que tu reviennes. Et tu reviens. 👊</div></div>`
    : `<div class="eyebrow">📏 Mensurations</div>
    <div class="card anim-item">
      ${S.profile?.objectif === "Perdre du gras" ? `<div style="font-size:11px;color:var(--muted);margin-bottom:9px">⚖️ 1× par semaine max, à jeun, même jour. La balance ment — la tendance sur un mois, elle, dit vrai.</div>` : ""}
      <div class="row">
        <input class="input" id="mPoids" placeholder="Poids (kg)" inputmode="decimal" style="padding:12px;font-size:14px">
        <input class="input" id="mHanches" placeholder="Hanches (cm)" inputmode="decimal" style="padding:12px;font-size:14px">
      </div>
      <button class="btn s" style="margin-top:9px;padding:12px" onclick="addMeasure()">＋ Enregistrer</button>
      ${m.length ? `<div style="margin-top:11px">${[...m].reverse().slice(0, 6).map(x =>
        `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px solid var(--line)">
          <span style="color:var(--muted)">${x.date}</span><span>${x.poids ? x.poids + " kg" : ""} ${x.hanches ? "· " + x.hanches + " cm" : ""}</span></div>`).join("")}</div>` : ""}
    </div>`}

    <div class="eyebrow">Historique</div>
    ${S.history.length ? [...S.history].reverse().map((h, i) => `<div class="card anim-item" style="animation-delay:${i * 45}ms">
      <div style="display:flex;align-items:center">
        <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${h.day}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${h.focus}${(() => { const withNote = h.ex.filter(e => e.note); return withNote.length ? " · 📝 " + withNote.map(e => e.note).join(" · ") : ""; })()}</div></div>
        <div style="font-family:Oswald;font-size:11px;color:var(--gold)">${h.date}</div></div></div>`).join("")
    : `<div style="font-size:12.5px;color:var(--muted)">Termine une séance : elle apparaîtra ici.</div>`}`;
}
window.addMeasure = () => {
  const p = $("#mPoids").value.trim(), h = $("#mHanches").value.trim();
  if (!p && !h) return;
  S.measures.push({ date: new Date().toLocaleDateString("fr-FR"), poids: p, hanches: h });
  store.set("measures", S.measures);
  if (navigator.vibrate) navigator.vibrate(40);
  render();
};

function emptyState(ico, t, s, goTab) {
  return `<div style="text-align:center;padding-top:70px" class="anim-item">
    <div style="font-size:42px;animation:pop .5s">${ico}</div>
    <div style="font-family:Oswald;font-weight:700;font-size:19px;text-transform:uppercase;margin-top:14px">${t}</div>
    <div style="font-size:13px;color:var(--muted);margin-top:8px;line-height:1.6;max-width:280px;margin-left:auto;margin-right:auto">${s}</div>
    ${goTab ? `<button class="btn p" style="max-width:220px;margin:20px auto 0" onclick="go('${goTab}')">C'est parti →</button>` : ""}
  </div>`;
}

render();
