import "server-only";
/* ═══ Mode démo LOCAL ═══
   Données fictives pour prévisualiser les écrans sans base de données.
   Actif uniquement si PTMOUSS_DEMO=1 (jamais défini sur Vercel).
   PTMOUSS_DEMO_ROLE=coach pour voir l'espace coach. */
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";

export const DEMO = process.env.PTMOUSS_DEMO === "1";
const ROLE = process.env.PTMOUSS_DEMO_ROLE === "coach" ? "coach" : "client";

const J = 864e5;
const now = Date.now();
const iso = (joursAvant: number) => new Date(now - joursAvant * J).toISOString();

const CLIENTE = "00000000-0000-4000-8000-000000000001";
const JOUEUR = "00000000-0000-4000-8000-000000000002";
const NOUVELLE = "00000000-0000-4000-8000-000000000003";
const COACH = "00000000-0000-4000-8000-0000000000c0";

const BILANS: Record<string, { reponses: Bilan; debut: string }> = {
  [CLIENTE]: {
    reponses: { prenom: "Inès", objectif: "Développer mes fessiers 🍑", niveau: "J'ai déjà pratiqué", freq: "3", materiel: "En salle", sante: "Aucun", sommeil: "7-8 h" },
    debut: iso(23),
  },
  [JOUEUR]: {
    reponses: { prenom: "Yanis", objectif: "Prendre du muscle", niveau: "Je m'entraîne régulièrement", freq: "3", materiel: "En salle", sante: "Dos sensible", sommeil: "6-7 h" },
    debut: iso(12),
  },
  [NOUVELLE]: {
    reponses: { prenom: "Léa", objectif: "Me sentir mieux", niveau: "Je débute", freq: "2", materiel: "Les deux", sante: "Genoux", sommeil: "Moins de 6 h" },
    debut: iso(2),
  },
};

type Ex = { nom: string; categorie: Categorie; charge_kg: number | null; series: number; amrap: number | null; cible: number | null; note: string | null; position: number };
const ex = (position: number, nom: string, categorie: Categorie, charge_kg: number | null, series: number, amrap: number | null, cible: number | null, note: string | null = null): Ex =>
  ({ position, nom, categorie, charge_kg, series, amrap, cible, note });

function seance(id: string, joursAvant: number, jour_code: string, focus: string, phase: string, exs: Ex[]) {
  return { id, realisee_le: iso(joursAvant), jour_code, focus, phase, allegee: false, seance_exercices: exs };
}

const HISTO: Record<string, ReturnType<typeof seance>[]> = {
  [CLIENTE]: [
    seance("s9", 1, "DAY 3", "Glutes Volume+", "HYPERTROPHY+", [ex(0, "Hip Thrust", "A", 72.5, 4, 11, 10), ex(1, "Leg Press (pieds hauts)", "S", 110, 4, 11, 10), ex(2, "Cable Kickback", "P", 12.5, 3, null, null), ex(3, "Hip Abduction", "P", 45, 3, null, null, "Brûlure énorme sur la dernière")]),
    seance("s8", 3, "DAY 2", "Upper Body", "HYPERTROPHY+", [ex(0, "Lat Pulldown", "-", null, 3, null, null), ex(1, "Seated Row", "-", null, 3, null, null), ex(2, "Lateral Raise", "-", null, 3, null, null), ex(3, "Triceps Pushdown", "-", null, 3, null, null)]),
    seance("s7", 5, "DAY 1", "Glutes Heavy", "HYPERTROPHY+", [ex(0, "Hip Thrust", "A", 70, 4, 13, 10), ex(1, "RDL", "S", 50, 4, 10, 10), ex(2, "Bulgarian Split Squat", "S", 12, 3, null, null), ex(3, "Hip Abduction", "P", 45, 3, null, null)]),
    seance("s6", 9, "DAY 3", "Glutes Volume+", "HYPERTROPHY", [ex(0, "Hip Thrust", "A", 65, 4, 13, 11), ex(1, "Leg Press (pieds hauts)", "S", 100, 4, 12, 11), ex(2, "Cable Kickback", "P", 11.25, 3, null, null), ex(3, "Hip Abduction", "P", 42.5, 3, null, null)]),
    seance("s5", 11, "DAY 1", "Glutes Heavy", "HYPERTROPHY", [ex(0, "Hip Thrust", "A", 62.5, 4, 14, 11), ex(1, "RDL", "S", 47.5, 4, 12, 11), ex(2, "Bulgarian Split Squat", "S", 10, 3, null, null), ex(3, "Hip Abduction", "P", 40, 3, null, null)]),
    seance("s4", 16, "DAY 3", "Glutes Volume+", "HYPERTROPHY", [ex(0, "Hip Thrust", "A", 60, 4, 12, 11), ex(1, "Leg Press (pieds hauts)", "S", 95, 4, 12, 11), ex(2, "Cable Kickback", "P", 10, 3, null, null), ex(3, "Hip Abduction", "P", 40, 3, null, null)]),
    seance("s3", 18, "DAY 1", "Glutes Heavy", "RM TEST", [ex(0, "Hip Thrust", "A", 57.5, 4, null, null), ex(1, "RDL", "S", 45, 4, null, null), ex(2, "Bulgarian Split Squat", "S", 8, 3, null, null), ex(3, "Hip Abduction", "P", 35, 3, null, null)]),
    seance("s2", 21, "DAY 1", "Glutes Heavy", "RM TEST", [ex(0, "Hip Thrust", "A", 55, 4, null, null), ex(1, "RDL", "S", 42.5, 4, null, null), ex(2, "Bulgarian Split Squat", "S", 8, 3, null, null), ex(3, "Hip Abduction", "P", 32.5, 3, null, null)]),
  ],
  [JOUEUR]: [
    seance("y3", 2, "LEGS", "Jambes", "HYPERTROPHY", [ex(0, "Back Squat", "S", 85, 4, 8, 11), ex(1, "Leg Curl", "P", 40, 4, 11, 11), ex(2, "Leg Press", "S", 160, 3, null, null), ex(3, "Leg Extension", "P", 50, 3, null, null)]),
    seance("y2", 4, "PULL", "Dos · Biceps", "HYPERTROPHY", [ex(0, "Traction / Lat Pulldown", "-", null, 4, null, null), ex(1, "Rowing barre", "-", null, 4, null, null)]),
    seance("y1", 9, "LEGS", "Jambes", "RM TEST", [ex(0, "Back Squat", "S", 90, 4, null, null), ex(1, "Leg Curl", "P", 37.5, 4, null, null), ex(2, "Leg Press", "S", 150, 3, null, null), ex(3, "Leg Extension", "P", 45, 3, null, null)]),
  ],
  [NOUVELLE]: [],
};

const CHECKINS: { user_id: string; jour: string; sommeil: string; energie: string; corps: string }[] = [
  { user_id: CLIENTE, jour: iso(0).slice(0, 10), sommeil: "😴 Bon (7 h+)", energie: "⚡ Haute", corps: "✅ Frais" },
  { user_id: CLIENTE, jour: iso(1).slice(0, 10), sommeil: "🙂 Correct", energie: "🙂 Normale", corps: "😬 Courbatures fortes" },
  { user_id: JOUEUR, jour: iso(1).slice(0, 10), sommeil: "😵 Mauvais (<6 h)", energie: "🪫 Faible", corps: "🔴 Une douleur" },
];

const PROFILS: Record<string, { prenom: string; created_at: string }> = {
  [CLIENTE]: { prenom: "Inès", created_at: iso(24) },
  [JOUEUR]: { prenom: "Yanis", created_at: iso(13) },
  [NOUVELLE]: { prenom: "Léa", created_at: iso(2) },
};

/* Images de démonstration générées (aucune vraie photo dans le code) */
const svg = (corps: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${corps}</svg>`)}`;
const avatarDemo = (a: string, b: string, l: string) =>
  svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><circle cx="60" cy="48" r="22" fill="#fff" fill-opacity=".85"/><ellipse cx="60" cy="112" rx="38" ry="32" fill="#fff" fill-opacity=".85"/><text x="60" y="56" font-family="Arial" font-size="20" text-anchor="middle" fill="${b}">${l}</text>`);
const AVATARS: Record<string, string> = {
  [CLIENTE]: avatarDemo("#f7a8c4", "#b8577f", "I"),
  [JOUEUR]: avatarDemo("#8fb8ff", "#3e5f9e", "Y"),
  [COACH]: avatarDemo("#f2c46a", "#a86c1c", "M"),
};
const photoDemo = (vue: string, apres: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${apres ? "#3a2a33" : "#2d2a30"}"/><ellipse cx="150" cy="70" rx="30" ry="36" fill="#cfa99a"/><path d="M95 120 Q150 100 205 120 L215 250 Q${apres ? 232 : 222} 300 ${apres ? 205 : 200} 330 L180 395 H120 L100 330 Q${apres ? 68 : 78} 300 85 250 Z" fill="#cfa99a"/><text x="150" y="385" font-family="Arial" font-size="18" text-anchor="middle" fill="#fff" fill-opacity=".6">${vue}</text></svg>`)}`;

export const demo = {
  utilisateur: () =>
    ROLE === "coach"
      ? { id: COACH, email: "coach@demo.local", prenom: "Moustapha", role: "coach" as const, avatar: AVATARS[COACH], avatarPath: null, photosAccord: null }
      : { id: CLIENTE, email: "ines@demo.local", prenom: "Inès", role: "client" as const, avatar: AVATARS[CLIENTE], avatarPath: null, photosAccord: process.env.PTMOUSS_DEMO_ACCORD === "0" ? null : iso(20) },
  bilan: (id: string) => BILANS[id] ?? null,
  historique: (id: string) => HISTO[id] ?? [],
  checkinDuJour: (id: string): Checkin | null => {
    if (process.env.PTMOUSS_DEMO_CHECKIN === "0") return null;
    const c = CHECKINS.find((x) => x.user_id === id && x.jour === iso(0).slice(0, 10));
    return c ? { sommeil: c.sommeil, energie: c.energie, corps: c.corps } : null;
  },
  checkins: (userId?: string) => CHECKINS.filter((c) => !userId || c.user_id === userId),
  clients: () =>
    Object.entries(PROFILS).map(([id, p]) => ({ id, prenom: p.prenom, inscrit_le: p.created_at, avatar: AVATARS[id] ?? null, bilan: BILANS[id] ?? null })),
  client: (id: string) => {
    const p = PROFILS[id];
    return p ? { id, prenom: p.prenom, inscrit_le: p.created_at, avatar: AVATARS[id] ?? null, bilan: BILANS[id] ?? null } : null;
  },
  seancesTous: () => HISTO,
  mots: (id: string) =>
    id === CLIENTE
      ? [
          { id: "m2", texte: "Bravo pour ton Hip Thrust Inès, +17,5 kg depuis le début ! Cette semaine on lève le pied (deload) : garde la technique propre, on repart fort lundi 💪", cree_le: iso(0.2), coach: { prenom: "Moustapha", avatar: AVATARS[COACH] } },
          { id: "m1", texte: "Bienvenue dans le programme ! Pense à faire ton check-in avant chaque séance.", cree_le: iso(20), coach: { prenom: "Moustapha", avatar: AVATARS[COACH] } },
        ]
      : [],
  reath: (id: string) => (id === CLIENTE || id === JOUEUR ? { semaine: id === CLIENTE ? 2 : 4, debut: iso(10).slice(0, 10) } : null),
  reathSeances: (id: string) =>
    id === CLIENTE
      ? [
          { semaine: 2, jour: 1, douleur: 4, gonflement: true, note: "Genou un peu gonflé ce matin", fait_le: iso(1) },
          { semaine: 2, jour: 0, douleur: 1, gonflement: false, note: null, fait_le: iso(2) },
          ...[0, 1, 2, 3, 4].map((j) => ({ semaine: 1, jour: j, douleur: j === 3 ? 2 : 1, gonflement: false, note: null, fait_le: iso(9 - j) })),
        ]
      : id === JOUEUR
        ? [1, 2, 3].flatMap((s) => [0, 2, 4].map((j) => ({ semaine: s, jour: j, douleur: 1, gonflement: false, note: null, fait_le: iso(20 - s * 5 - j) })))
        : [],
  activites: () => {
    const il = (min: number) => new Date(Date.now() - min * 60000).toISOString();
    const c = (id: string) => ({ id, prenom: PROFILS[id]?.prenom ?? "", avatar: AVATARS[id] ?? null });
    return [
      { id: "a3", type: "debut" as const, jour_code: "PUSH", detail: "PUSH · Haut du corps", cree_le: il(6), client: c(JOUEUR) },
      { id: "a2", type: "fin" as const, jour_code: "DAY 1", detail: "DAY 1 · Glutes Heavy · 4 exercices · 52 min", cree_le: il(95), client: c(CLIENTE) },
      { id: "a1", type: "debut" as const, jour_code: "DAY 1", detail: "DAY 1 · Glutes Heavy", cree_le: il(147), client: c(CLIENTE) },
    ];
  },
  photos: (id: string) =>
    id === CLIENTE && process.env.PTMOUSS_DEMO_ACCORD !== "0"
      ? (["face", "profil", "dos"] as const).flatMap((vue, i) => [
          { id: `p${i}b`, chemin: "", vue, prise_le: iso(1).slice(0, 10), url: photoDemo(vue, 1) },
          { id: `p${i}a`, chemin: "", vue, prise_le: iso(21).slice(0, 10), url: photoDemo(vue, 0) },
        ])
      : [],
};
