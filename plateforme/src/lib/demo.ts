import "server-only";
/* ═══ Mode démo LOCAL ═══
   Données fictives pour prévisualiser les écrans sans base de données.
   Actif uniquement si PTMOUSS_DEMO=1 (jamais défini sur Vercel).
   PTMOUSS_DEMO_ROLE=coach pour voir l'espace coach. */
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";
import { estPro, lireMetier, type MetierPro } from "@/lib/profils";
import type { Evenement, Membre, Presence, RoleEquipe } from "@/lib/equipe";

export const DEMO = process.env.PTMOUSS_DEMO === "1";
const ROLE = process.env.PTMOUSS_DEMO_ROLE === "coach" ? "coach" : "client";
/* PTMOUSS_DEMO_METIER=joueur|coach|prepa|entraineur|kine|osteo pour voir l'accueil d'un métier */
const METIER = lireMetier(process.env.PTMOUSS_DEMO_METIER);

const J = 864e5;
const EQUIPE = "00000000-0000-4000-8000-0000000000e1";
const PREPA = "00000000-0000-4000-8000-0000000000p1";
const now = Date.now();
const iso = (joursAvant: number) => new Date(now - joursAvant * J).toISOString();

const CLIENTE = "00000000-0000-4000-8000-000000000001";
const JOUEUR = "00000000-0000-4000-8000-000000000002";
const NOUVELLE = "00000000-0000-4000-8000-000000000003";
const COACH = "00000000-0000-4000-8000-0000000000c0";

const BILANS: Record<string, { reponses: Bilan; debut: string }> = {
  [CLIENTE]: {
    /* PTMOUSS_DEMO_OBJ / PTMOUSS_DEMO_LIEU : voir le programme d'un autre objectif */
    reponses: {
      prenom: "Inès", objectif: (process.env.PTMOUSS_DEMO_OBJ as Bilan["objectif"]) || "Développer mes fessiers 🍑", niveau: "J'ai déjà pratiqué",
      freq: process.env.PTMOUSS_DEMO_OBJ ? "4" : "3", materiel: process.env.PTMOUSS_DEMO_LIEU || "En salle", sante: "Aucun", sommeil: "7-8 h", allure: "13 km/h (4'40)",
    },
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
      ? { id: COACH, email: "coach@demo.local", prenom: "Moustapha", role: "coach" as const, metier: "coach" as const, avatar: AVATARS[COACH], avatarPath: null, photosAccord: null }
      : { id: CLIENTE, email: "ines@demo.local", prenom: "Inès", role: "client" as const, metier: METIER, avatar: AVATARS[CLIENTE], avatarPath: null, photosAccord: process.env.PTMOUSS_DEMO_ACCORD === "0" ? null : iso(20) },
  /* Un professionnel de démo n'a pas de bilan : il arrive sur son espace */
  bilan: (id: string) => (ROLE === "client" && estPro(METIER) && id === CLIENTE ? null : BILANS[id] ?? null),
  sportifs: () => [
    { id: JOUEUR, prenom: "Yanis", metier: "joueur" as const, metierPro: (estPro(METIER) ? METIER : "coach") as MetierPro, depuis: iso(12), admin: false },
    { id: NOUVELLE, prenom: "Léa", metier: "sportif" as const, metierPro: (estPro(METIER) ? METIER : "coach") as MetierPro, depuis: iso(2), admin: false },
  ],
  pros: () => [
    { id: COACH, prenom: "Moustapha", metier: "coach" as const, metierPro: "coach" as const, depuis: iso(23), admin: true },
    { id: "00000000-0000-4000-8000-0000000000k1", prenom: "Camille", metier: "kine" as const, metierPro: "kine" as const, depuis: iso(5), admin: false },
  ],
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
  reath: (id: string) => (id === CLIENTE || id === JOUEUR ? { programme: id === CLIENTE ? (process.env.PTMOUSS_DEMO_PROG ?? "lca") : "presaison", semaine: id === CLIENTE ? 2 : 3, debut: iso(10).slice(0, 10), vma: id === CLIENTE ? 13.5 : null } : null),
  reathSeances: (id: string) =>
    id === CLIENTE
      ? [
          { semaine: 2, jour: 1, douleur: 4, gonflement: true, rpe: null, note: "Genou un peu gonflé ce matin", fait_le: iso(1) },
          { semaine: 2, jour: 0, douleur: 1, gonflement: false, rpe: null, note: null, fait_le: iso(2) },
          ...[0, 1, 2, 3, 4].map((j) => ({ semaine: 1, jour: j, douleur: j === 3 ? 2 : 1, gonflement: false, rpe: null, note: null, fait_le: iso(9 - j) })),
        ]
      : id === JOUEUR
        ? [1, 2, 3].flatMap((s) => [0, 1, 2, 4].map((j) => ({ semaine: s, jour: j, douleur: null, gonflement: false, rpe: 4 + s, note: null, fait_le: iso(20 - s * 5 - j) })))
        : [],
  chargesImposees: () => {
    const t = new Date(); const d = (t.getUTCDay() + 6) % 7;
    const lundi = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - d)).toISOString().slice(0, 10);
    const suiv = new Date(Date.parse(lundi) + 7 * 864e5).toISOString().slice(0, 10);
    return [
      { id: "c1", exercice: "Hip Thrust", jour_code: "DAY 1", lundi, charge: 67.5 },
      { id: "c2", exercice: "Hip Abduction", jour_code: null, lundi, charge: 45 },
      { id: "c3", exercice: "Hip Thrust", jour_code: "DAY 1", lundi: suiv, charge: 72.5 },
      { id: "c4", exercice: "Hip Abduction", jour_code: null, lundi: suiv, charge: 47.5 },
      /* Charges d'un préparateur physique : le coach les voit sans pouvoir les changer */
      { id: "c5", exercice: "Back Squat", jour_code: null, lundi, charge: 80, auteur_id: PREPA },
      { id: "c6", exercice: "Back Squat", jour_code: null, lundi: suiv, charge: 85, auteur_id: PREPA },
      { id: "c7", exercice: "Bulgarian Split Squat", jour_code: null, lundi, charge: 14, auteur_id: PREPA },
    ];
  },
  /* Équipe de démo : staff si le métier est pro, joueur sinon */
  equipes: () => [{ id: EQUIPE, nom: "FC Vincennes — Seniors B", saison: "2026-27", code: "K7MPQ3", cree_par: COACH, role: (ROLE === "coach" || ["entraineur", "prepa", "coach"].includes(METIER) ? "entraineur" : "joueur") as RoleEquipe, membres: MEMBRES().length }],
  equipe: (id: string) => {
    if (id !== EQUIPE) return null;
    const membres = MEMBRES();
    const staff = ROLE === "coach" || ["entraineur", "prepa", "coach"].includes(METIER);
    const moiId = staff ? "m0" : "m1";
    const evts = EVENEMENTS();
    return {
      equipe: { id: EQUIPE, nom: "FC Vincennes — Seniors B", saison: "2026-27", code: "K7MPQ3", cree_par: COACH, couleur1: "#1e3a8a", couleur2: "#facc15", logo_path: null, valeurs: "Respect, travail, solidarité. On joue pour le maillot, on gagne ensemble." },
      photos: {} as Record<string, string>, logo: null,
      moi: membres.find((m) => m.id === moiId) ?? null,
      membres, evenements: evts, presences: PRESENCES(evts, membres),
    };
  },
  composition: (evenementId: string | null) => ({
    formation: "4-4-2" as const,
    titulaires: { "0": "m2", "1": "m8", "2": "m3", "3": "m4", "4": "m9", "5": "m6", "6": "m5", "7": "m1", "8": "m10", "9": "m7" } as Record<string, string>,
    remplacants: [] as string[],
    publiee: evenementId !== null,
  }),
  messagesEquipe: () => [
    { id: "msg1", auteur_id: COACH, auteur_nom: "Moustapha", auteur_role: "entraineur" as const, cible: "tous" as const, destinataires: [] as string[], texte: "Rendez-vous samedi 14 h au stade, tenue noire. On joue pour le maillot.", cree_le: iso(1) },
    { id: "msg2", auteur_id: "00000000-0000-4000-8000-0000000000d1", auteur_nom: "M. Diallo", auteur_role: "president" as const, cible: "joueurs" as const, destinataires: [] as string[], texte: "Bravo pour la victoire contre Montreuil. Le club est fier de vous.", cree_le: iso(8) },
  ],
  defis: () => {
    const j = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
    return [
      { id: "d1", client_id: null, titre: "12 séances avant Noël", type: "seances" as const, exercice: null, cible: 12, debut: j(-20), fin: j(15) },
      { id: "d2", client_id: CLIENTE, titre: "Hip Thrust à 80 kg", type: "charge" as const, exercice: "Hip Thrust", cible: 80, debut: j(-30), fin: j(30) },
    ];
  },
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

/* ─── Équipe de démo ─── */
function MEMBRES(): Membre[] {
  const j = (id: string, nom: string, numero: number | null, poste: string | null, user_id: string | null = null): Membre => ({ id, user_id, nom, role: "joueur", poste, numero });
  return [
    { id: "m0", user_id: ROLE === "coach" ? COACH : CLIENTE, nom: "Moustapha", role: "entraineur", poste: null, numero: null },
    { id: "ma", user_id: null, nom: "Karim", role: "adjoint", poste: null, numero: null },
    j("m1", "Yanis", 10, "Milieu", ROLE === "coach" ? JOUEUR : CLIENTE),
    j("m2", "Bilal", 1, "Gardien"), j("m3", "Hugo", 4, "Défenseur"), j("m4", "Sékou", 5, "Défenseur"),
    j("m5", "Mehdi", 8, "Milieu"), j("m6", "Lucas", 7, "Ailier"), j("m7", "Omar", 9, "Attaquant"),
    j("m8", "Théo", 3, "Latéral"), j("m9", "Adama", 6, "Milieu"), j("m10", "Nathan", 11, "Ailier"),
  ];
}
const EV = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function EVENEMENTS(): Evenement[] {
  const ev = (id: string, type: Evenement["type"], jours: number, heure: number, extra: Partial<Evenement> = {}): Evenement => {
    const d = new Date(Date.now() + jours * J); d.setUTCHours(heure - 1, 0, 0, 0);
    return { id, type, titre: null, debut: d.toISOString(), lieu: type === "match" ? null : "Stade Léo-Lagrange", adversaire: null, domicile: null, score_pour: null, score_contre: null, resume: null, ...extra };
  };
  return [
    ev(EV(1), "entrainement", -13, 19, { resume: "Possession 6c6, finitions côté droit." }),
    ev(EV(2), "entrainement", -11, 19, { resume: "Pressing haut, transitions." }),
    ev(EV(3), "match", -9, 15, { adversaire: "AS Montreuil", domicile: true, lieu: "Stade Léo-Lagrange", score_pour: 2, score_contre: 1, resume: "Bonne réaction après l'ouverture du score adverse." }),
    ev(EV(4), "entrainement", -6, 19, { resume: "Récupération active, coups de pied arrêtés." }),
    ev(EV(5), "entrainement", -4, 19),
    ev(EV(6), "match", -2, 15, { adversaire: "US Fontenay", domicile: false, lieu: "Stade de la Redoute", score_pour: 0, score_contre: 0 }),
    ev(EV(11), "entrainement", -1, 19, { resume: "Séance courte, conservation et jeu réduit." }),
    ev(EV(7), "entrainement", 1, 19),
    ev(EV(8), "rdv", 2, 18, { titre: "Réunion d'avant-match", lieu: "Club-house" }),
    ev(EV(9), "entrainement", 3, 19),
    ev(EV(10), "match", 5, 15, { adversaire: "RC Saint-Mandé", domicile: true, lieu: "Stade Léo-Lagrange" }),
  ];
}
function PRESENCES(evts: Evenement[], membres: Membre[]): Presence[] {
  const joueurs = membres.filter((m) => m.role === "joueur");
  const out: Presence[] = [];
  evts.forEach((e, i) => {
    const passe = Date.parse(e.debut) < Date.now();
    joueurs.forEach((m, k) => {
      /* Hugo manque les derniers entraînements : de quoi montrer « à relancer » au staff */
      const absent = (i + k) % 5 === 0 || (m.id === "m3" && e.type === "entrainement");
      if (passe && e.id !== EV(5)) out.push({ evenement_id: e.id, membre_id: m.id, reponse: absent ? "non" : "oui", present: !absent, minutes: e.type === "match" && !absent ? (k % 3 === 0 ? 30 : 90) : null });
      else if (!passe && k % 4 !== 3) out.push({ evenement_id: e.id, membre_id: m.id, reponse: k % 6 === 1 ? "incertain" : absent ? "non" : "oui", present: null, minutes: null });
    });
  });
  return out;
}
