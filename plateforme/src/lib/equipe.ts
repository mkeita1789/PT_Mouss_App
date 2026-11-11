/* ═══ Équipe : calendrier, convocations, présences ═══
   Calculs purs, partagés par les pages et les tests. Aucune donnée de forme ici. */

export type RoleEquipe = "entraineur" | "adjoint" | "prepa" | "media" | "president" | "dirigeant" | "joueur";
export type TypeEvenement = "entrainement" | "match" | "rdv";
export type Reponse = "oui" | "non" | "incertain";

export const ROLES_STAFF: RoleEquipe[] = ["entraineur", "adjoint", "prepa"];
export const estStaff = (r: RoleEquipe | null | undefined) => !!r && ROLES_STAFF.includes(r);
/** Le staff et le responsable média gèrent les photos */
export const gerePhotos = (r: RoleEquipe | null | undefined) => estStaff(r) || r === "media";
/** Ceux qui écrivent aux membres : staff, président, dirigeants */
export const peutEcrire = (r: RoleEquipe | null | undefined) => estStaff(r) || r === "president" || r === "dirigeant";
/** Identité du club : le staff et le président */
export const gereClub = (r: RoleEquipe | null | undefined) => estStaff(r) || r === "president";
/** Rôles qu'on invite avec un code personnel (le code d'équipe, lui, fait entrer un joueur) */
export const ROLES_INVITES = ["adjoint", "prepa", "president", "dirigeant", "media", "entraineur"] as const;
export type RoleInvite = (typeof ROLES_INVITES)[number];
export type CibleMessage = "tous" | "joueurs" | "staff" | "selection";
export type MessageEquipe = { id: string; auteur_id: string; auteur_nom: string; auteur_role: RoleEquipe; cible: CibleMessage; destinataires: string[]; texte: string; cree_le: string };
export type InvitationEquipe = { code: string; role: RoleInvite; expire_le: string; utilisee_par: string | null };

export type Equipe = {
  id: string; nom: string; saison: string | null; code: string; cree_par: string;
  couleur1?: string | null; couleur2?: string | null; logo_path?: string | null; valeurs?: string | null;
};
export type Membre = { id: string; user_id: string | null; nom: string; role: RoleEquipe; poste: string | null; numero: number | null; photo_path?: string | null };
export type Evenement = {
  id: string; type: TypeEvenement; titre: string | null; debut: string; lieu: string | null;
  adversaire: string | null; domicile: boolean | null; score_pour: number | null; score_contre: number | null; resume: string | null;
};
export type Presence = { evenement_id: string; membre_id: string; reponse: Reponse | null; present: boolean | null; minutes: number | null };

/** « 2026-11-14T15:00 » saisi en heure de Paris → instant UTC (ISO). Gère l'heure d'été. */
export function parisVersISO(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const voulu = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const decalage = (t: number) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t));
    const g = (k: string) => Number(p.find((x) => x.type === k)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - t;
  };
  let t = voulu - decalage(voulu);
  t = voulu - decalage(t);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Dates d'une série hebdomadaire (même heure de Paris), du premier jour jusqu'à la date de fin incluse */
export function serieHebdo(premier: string, jusqua: string | null, max = 52): string[] {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(premier);
  if (!m) return [];
  const out: string[] = [];
  const fin = jusqua && /^\d{4}-\d{2}-\d{2}$/.test(jusqua) ? jusqua : m[1];
  for (let k = 0; k < max; k++) {
    const jour = new Date(Date.parse(m[1] + "T12:00:00Z") + k * 7 * 864e5).toISOString().slice(0, 10);
    if (jour > fin) break;
    const iso = parisVersISO(`${jour}T${m[2]}`);
    if (iso) out.push(iso);
  }
  return out;
}

/** L'appel a-t-il été fait ? (au moins une présence notée par le staff) */
export const appelFait = (presences: Presence[], evenementId: string) => presences.some((p) => p.evenement_id === evenementId && p.present !== null);

export type Compteurs = { entrainements: number; entrainementsTotal: number; matchs: number; minutes: number; taux: number | null };

/** Présences d'un membre sur les événements passés dont l'appel a été fait */
export function compteurs(membreId: string, evenements: Evenement[], presences: Presence[], now: Date = new Date()): Compteurs {
  const passes = evenements.filter((e) => Date.parse(e.debut) <= now.getTime() && appelFait(presences, e.id));
  const de = (e: Evenement) => presences.find((p) => p.evenement_id === e.id && p.membre_id === membreId);
  const ent = passes.filter((e) => e.type === "entrainement");
  const entrainements = ent.filter((e) => de(e)?.present).length;
  const matchsJoues = passes.filter((e) => e.type === "match" && (de(e)?.present || (de(e)?.minutes ?? 0) > 0));
  return {
    entrainements,
    entrainementsTotal: ent.length,
    matchs: matchsJoues.length,
    minutes: matchsJoues.reduce((a, e) => a + (de(e)?.minutes ?? 0), 0),
    taux: ent.length ? Math.round((entrainements / ent.length) * 100) : null,
  };
}

/** Réponses à une convocation */
export function bilanReponses(evenementId: string, joueurs: Membre[], presences: Presence[]) {
  const r = (m: Membre) => presences.find((p) => p.evenement_id === evenementId && p.membre_id === m.id)?.reponse ?? null;
  return {
    oui: joueurs.filter((m) => r(m) === "oui"),
    non: joueurs.filter((m) => r(m) === "non"),
    incertain: joueurs.filter((m) => r(m) === "incertain"),
    sans: joueurs.filter((m) => r(m) === null),
  };
}

/** Bilan de la saison pour l'équipe : matchs joués, victoires, nuls, défaites, buts */
export function bilanSaison(evenements: Evenement[], now: Date = new Date()) {
  const joues = evenements.filter((e) => e.type === "match" && Date.parse(e.debut) <= now.getTime() && e.score_pour !== null && e.score_contre !== null);
  return {
    joues: joues.length,
    victoires: joues.filter((e) => e.score_pour! > e.score_contre!).length,
    nuls: joues.filter((e) => e.score_pour === e.score_contre).length,
    defaites: joues.filter((e) => e.score_pour! < e.score_contre!).length,
    pour: joues.reduce((a, e) => a + e.score_pour!, 0),
    contre: joues.reduce((a, e) => a + e.score_contre!, 0),
    entrainements: evenements.filter((e) => e.type === "entrainement" && Date.parse(e.debut) <= now.getTime()).length,
  };
}

/** Un événement reste « à venir » jusqu'à 3 h après son début (le temps du match ou de la séance) */
export const estAVenir = (e: Evenement, now: Date = new Date()) => Date.parse(e.debut) > now.getTime() - 3 * 36e5;

/** L'événement a-t-il commencé ? (la feuille de présence ne s'ouvre qu'à partir de là) */
export const estCommence = (e: Evenement, now: Date = new Date()) => Date.parse(e.debut) <= now.getTime();

/** Calendrier coupé en deux : à venir (le plus proche d'abord), passés (le plus récent d'abord) */
export function separer(evenements: Evenement[], now: Date = new Date()) {
  return {
    aVenir: evenements.filter((e) => estAVenir(e, now)),
    passes: evenements.filter((e) => !estAVenir(e, now)).reverse(),
  };
}

/* ═══ Résumé de la semaine et point avant un événement (staff) ═══
   Uniquement à partir du calendrier, des réponses et des présences. */

const JOUR = 864e5;

/** Date du calendrier à Paris (« 2026-10-25 ») pour un instant donné */
export function dateParis(t: number | Date): string {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t));
  const g = (k: string) => p.find((x) => x.type === k)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** Semaine en cours à Paris : du lundi 00:00 (inclus) au lundi suivant 00:00 (exclu), bornes en UTC.
    Calculée sur les dates du calendrier, donc juste même la semaine du changement d'heure (167 h ou 169 h). */
export function semaineParis(now: Date = new Date()) {
  const midi = Date.parse(dateParis(now) + "T12:00:00Z");
  const rang = (new Date(midi).getUTCDay() + 6) % 7; // 0 = lundi
  const jour = (k: number) => new Date(midi + k * JOUR).toISOString().slice(0, 10);
  return {
    lundi: jour(-rang), dimanche: jour(6 - rang),
    debut: parisVersISO(`${jour(-rang)}T00:00`)!, fin: parisVersISO(`${jour(7 - rang)}T00:00`)!,
  };
}

const parDate = (a: Evenement, b: Evenement) => Date.parse(a.debut) - Date.parse(b.debut);

/** Nombre d'entraînements manqués à la suite, en partant du plus récent dont l'appel est fait.
    Une présence non notée (joueur arrivé après, ligne vide) ne compte ni comme absence ni comme présence. */
export function absencesDeSuite(membreId: string, evenements: Evenement[], presences: Presence[], now: Date = new Date()): number {
  const faits = evenements
    .filter((e) => e.type === "entrainement" && Date.parse(e.debut) <= now.getTime() && appelFait(presences, e.id))
    .sort(parDate).reverse();
  let n = 0;
  for (const e of faits) {
    const p = presences.find((x) => x.evenement_id === e.id && x.membre_id === membreId);
    if (!p || p.present === null) continue;
    if (p.present) break;
    n++;
  }
  return n;
}

export type ResumeSemaine = {
  lundi: string; dimanche: string;
  entrainementsFaits: number; entrainementsPrevus: number;
  /** Entraînements de la semaine déjà passés mais sans appel */
  appelsAFaire: number;
  /** Moyenne des taux de présence des entraînements de la semaine dont l'appel est fait ; null s'il n'y en a pas */
  taux: number | null;
  /** Matchs de la semaine déjà commencés (score éventuellement pas encore saisi) */
  matchs: Evenement[];
  /** Joueurs absents à au moins 2 entraînements de suite */
  aRelancer: { membre: Membre; absences: number }[];
  prochain: Evenement | null;
  sansReponse: Membre[];
};

export function resumeSemaine(evenements: Evenement[], joueurs: Membre[], presences: Presence[], now: Date = new Date()): ResumeSemaine {
  const { lundi, dimanche, debut, fin } = semaineParis(now);
  const t0 = Date.parse(debut), t1 = Date.parse(fin), maint = now.getTime();
  const semaine = evenements.filter((e) => { const t = Date.parse(e.debut); return t >= t0 && t < t1; }).sort(parDate);
  const passe = (e: Evenement) => Date.parse(e.debut) <= maint;
  const ent = semaine.filter((e) => e.type === "entrainement");
  const faits = ent.filter(passe);
  const ids = new Set(joueurs.map((m) => m.id));
  const taux = faits
    .filter((e) => appelFait(presences, e.id))
    .map((e) => {
      const notes = presences.filter((p) => p.evenement_id === e.id && ids.has(p.membre_id) && p.present !== null);
      return notes.length ? notes.filter((p) => p.present).length / notes.length : null;
    })
    .filter((x): x is number => x !== null);
  const prochain = evenements.filter((e) => Date.parse(e.debut) > maint).sort(parDate)[0] ?? null;
  return {
    lundi, dimanche,
    entrainementsFaits: faits.length,
    entrainementsPrevus: ent.length,
    appelsAFaire: faits.filter((e) => !appelFait(presences, e.id)).length,
    taux: taux.length ? Math.round((taux.reduce((a, x) => a + x, 0) / taux.length) * 100) : null,
    matchs: semaine.filter((e) => e.type === "match" && passe(e)),
    aRelancer: joueurs
      .map((membre) => ({ membre, absences: absencesDeSuite(membre.id, evenements, presences, now) }))
      .filter((x) => x.absences >= 2)
      .sort((a, b) => b.absences - a.absences || a.membre.nom.localeCompare(b.membre.nom)),
    prochain,
    sansReponse: prochain ? bilanReponses(prochain.id, joueurs, presences).sans : [],
  };
}

/** Minutes jouées en match par chaque joueur sur les `jours` derniers jours (matchs passés uniquement).
    Ne garde que les joueurs qui ont joué, du plus au moins de minutes. */
export function minutesRecentes(joueurs: Membre[], evenements: Evenement[], presences: Presence[], now: Date = new Date(), jours = 7) {
  const maint = now.getTime();
  const matchs = evenements.filter((e) => { const t = Date.parse(e.debut); return e.type === "match" && t <= maint && t >= maint - jours * JOUR; });
  const lignes = joueurs
    .map((membre) => {
      const joues = matchs.map((e) => presences.find((p) => p.evenement_id === e.id && p.membre_id === membre.id)?.minutes ?? 0).filter((m) => m > 0);
      return { membre, minutes: joues.reduce((a, m) => a + m, 0), matchs: joues.length };
    })
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || a.membre.nom.localeCompare(b.membre.nom));
  return { matchs: matchs.length, lignes };
}

/** Quand a lieu l'événement, vu d'aujourd'hui à Paris : ce soir (à partir de 17 h), aujourd'hui, ou plus tard */
export function momentEvenement(e: Evenement, now: Date = new Date()): "ceSoir" | "aujourdhui" | "plusTard" {
  const t = Date.parse(e.debut);
  if (dateParis(t) !== dateParis(now)) return "plusTard";
  const heure = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(new Date(t)));
  return heure >= 17 ? "ceSoir" : "aujourdhui";
}

/* ═══ Compositions (façon FIFA) ═══
   Chaque schéma = 11 postes placés sur le terrain (x, y en % ; l'attaque en haut). */
export const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "4-1-4-1", "4-5-1"] as const;
export type Formation = (typeof FORMATIONS)[number];
export type Poste = { p: string; x: number; y: number };

const G: Poste = { p: "G", x: 50, y: 90 };
const DEF4: Poste[] = [{ p: "DG", x: 13, y: 70 }, { p: "DC", x: 37, y: 74 }, { p: "DC", x: 63, y: 74 }, { p: "DD", x: 87, y: 70 }];
const DEF3: Poste[] = [{ p: "DC", x: 24, y: 73 }, { p: "DC", x: 50, y: 76 }, { p: "DC", x: 76, y: 73 }];
const DEF5: Poste[] = [{ p: "DG", x: 9, y: 62 }, { p: "DC", x: 29, y: 74 }, { p: "DC", x: 50, y: 77 }, { p: "DC", x: 71, y: 74 }, { p: "DD", x: 91, y: 62 }];
const BU2: Poste[] = [{ p: "BU", x: 34, y: 20 }, { p: "BU", x: 66, y: 20 }];
const ATT3: Poste[] = [{ p: "AG", x: 17, y: 24 }, { p: "BU", x: 50, y: 17 }, { p: "AD", x: 83, y: 24 }];
const BU1: Poste[] = [{ p: "BU", x: 50, y: 17 }];

export const POSTES: Record<Formation, Poste[]> = {
  "4-4-2": [G, ...DEF4, { p: "MG", x: 13, y: 46 }, { p: "MC", x: 37, y: 50 }, { p: "MC", x: 63, y: 50 }, { p: "MD", x: 87, y: 46 }, ...BU2],
  "4-3-3": [G, ...DEF4, { p: "MC", x: 26, y: 48 }, { p: "MDC", x: 50, y: 55 }, { p: "MC", x: 74, y: 48 }, ...ATT3],
  "4-2-3-1": [G, ...DEF4, { p: "MDC", x: 34, y: 57 }, { p: "MDC", x: 66, y: 57 }, { p: "MG", x: 15, y: 36 }, { p: "MOC", x: 50, y: 38 }, { p: "MD", x: 85, y: 36 }, ...BU1],
  "3-5-2": [G, ...DEF3, { p: "MG", x: 10, y: 44 }, { p: "MC", x: 30, y: 52 }, { p: "MOC", x: 50, y: 40 }, { p: "MC", x: 70, y: 52 }, { p: "MD", x: 90, y: 44 }, ...BU2],
  "3-4-3": [G, ...DEF3, { p: "MG", x: 12, y: 48 }, { p: "MC", x: 37, y: 52 }, { p: "MC", x: 63, y: 52 }, { p: "MD", x: 88, y: 48 }, ...ATT3],
  "5-3-2": [G, ...DEF5, { p: "MC", x: 27, y: 47 }, { p: "MC", x: 50, y: 51 }, { p: "MC", x: 73, y: 47 }, ...BU2],
  "4-1-4-1": [G, ...DEF4, { p: "MDC", x: 50, y: 59 }, { p: "MG", x: 13, y: 40 }, { p: "MC", x: 37, y: 43 }, { p: "MC", x: 63, y: 43 }, { p: "MD", x: 87, y: 40 }, ...BU1],
  "4-5-1": [G, ...DEF4, { p: "MG", x: 10, y: 44 }, { p: "MC", x: 30, y: 50 }, { p: "MOC", x: 50, y: 40 }, { p: "MC", x: 70, y: 50 }, { p: "MD", x: 90, y: 44 }, ...BU1],
};

export type Composition = { formation: Formation; titulaires: Record<string, string>; remplacants: string[]; publiee: boolean };
export const MAX_REMPLACANTS = 9;

/** Composition propre : un joueur n'apparaît qu'une fois, seulement des membres de l'équipe, postes existants */
export function nettoyerComposition(c: Composition, idsMembres: Set<string>): Composition {
  const formation = (FORMATIONS as readonly string[]).includes(c.formation) ? c.formation : "4-4-2";
  const vus = new Set<string>();
  const titulaires: Record<string, string> = {};
  Object.entries(c.titulaires ?? {}).forEach(([k, id]) => {
    const i = Number(k);
    if (Number.isInteger(i) && i >= 0 && i < 11 && idsMembres.has(id) && !vus.has(id)) { titulaires[String(i)] = id; vus.add(id); }
  });
  const remplacants = (c.remplacants ?? []).filter((id) => idsMembres.has(id) && !vus.has(id) && (vus.add(id), true)).slice(0, MAX_REMPLACANTS);
  return { formation, titulaires, remplacants, publiee: !!c.publiee };
}

/** Changement de schéma : on garde les joueurs, poste par poste dans l'ordre (gardien, défense, milieu, attaque) */
export function changerFormation(c: Composition, f: Formation): Composition {
  return { ...c, formation: f };
}

/** Couleur de texte lisible sur une couleur de club */
export function texteSur(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.6 ? "#111111" : "#ffffff";
}
