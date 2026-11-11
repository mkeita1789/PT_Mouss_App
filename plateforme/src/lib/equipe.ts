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

/** Calendrier coupé en deux : à venir (le plus proche d'abord), passés (le plus récent d'abord) */
export function separer(evenements: Evenement[], now: Date = new Date()) {
  return {
    aVenir: evenements.filter((e) => estAVenir(e, now)),
    passes: evenements.filter((e) => !estAVenir(e, now)).reverse(),
  };
}
