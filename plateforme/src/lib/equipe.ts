/* ═══ Équipe : calendrier, convocations, présences ═══
   Calculs purs, partagés par les pages et les tests. Aucune donnée de forme ici. */

export type RoleEquipe = "entraineur" | "adjoint" | "prepa" | "joueur";
export type TypeEvenement = "entrainement" | "match" | "rdv";
export type Reponse = "oui" | "non" | "incertain";

export const ROLES_STAFF: RoleEquipe[] = ["entraineur", "adjoint", "prepa"];
export const estStaff = (r: RoleEquipe | null | undefined) => !!r && ROLES_STAFF.includes(r);

export type Equipe = { id: string; nom: string; saison: string | null; code: string; cree_par: string };
export type Membre = { id: string; user_id: string | null; nom: string; role: RoleEquipe; poste: string | null; numero: number | null };
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
