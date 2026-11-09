/* ═══ Motivation : régularité, records, badges, défis ═══
   Calculs purs (sans base de données), réutilisés côté client et côté coach.
   Principe : on récompense la régularité et le progrès, jamais l'excès —
   le repos compte dans l'objectif, une douleur signalée met la série en pause. */

/** Date AAAA-MM-JJ à Paris */
export const jourParis = (d: Date | string) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d));

/** Lundi (AAAA-MM-JJ, heure de Paris) de la semaine d'une date */
export function lundiDe(d: Date | string): string {
  const j = jourParis(d);
  const t = new Date(j + "T12:00:00Z");
  const decal = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - decal);
  return t.toISOString().slice(0, 10);
}
const semainePrecedente = (lundi: string) => {
  const t = new Date(lundi + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() - 7);
  return t.toISOString().slice(0, 10);
};

export type Serie = {
  /** Semaines d'affilée où l'objectif est atteint (la semaine en cours compte si elle est déjà validée) */
  semaines: number;
  /** Meilleure série jamais faite */
  meilleure: number;
  /** Séances cette semaine, et combien il en manque pour la valider */
  cetteSemaine: number;
  objectif: number;
  manque: number;
};

/**
 * @param dates   dates des séances faites (programme, séance libre, programmes spéciaux)
 * @param pauses  dates des check-ins avec douleur : la semaine ne casse pas la série
 */
export function serieSemaines(dates: string[], objectif: number, pauses: string[] = [], now: Date = new Date()): Serie {
  const obj = Math.max(1, objectif || 3);
  const parSemaine = new Map<string, number>();
  dates.forEach((d) => parSemaine.set(lundiDe(d), (parSemaine.get(lundiDe(d)) ?? 0) + 1));
  const semainesPause = new Set(pauses.map(lundiDe));
  const courante = lundiDe(now);
  const nCourante = parSemaine.get(courante) ?? 0;
  const premiere = [...parSemaine.keys()].sort()[0];

  /* Série en cours : la semaine en cours ne la casse pas tant qu'elle n'est pas finie */
  let semaines = nCourante >= obj ? 1 : 0;
  if (premiere) {
    for (let s = semainePrecedente(courante); s >= premiere; s = semainePrecedente(s)) {
      const n = parSemaine.get(s) ?? 0;
      if (n >= obj) semaines++;
      else if (semainesPause.has(s)) continue;
      else break;
    }
  }

  /* Meilleure série, de la première semaine à aujourd'hui */
  let meilleure = 0, run = 0;
  if (premiere) {
    const toutes: string[] = [];
    for (let s = courante; s >= premiere; s = semainePrecedente(s)) toutes.unshift(s);
    toutes.forEach((s) => {
      const n = parSemaine.get(s) ?? 0;
      if (n >= obj) { run++; meilleure = Math.max(meilleure, run); }
      else if (semainesPause.has(s) || s === courante) { /* neutre */ }
      else run = 0;
    });
  }
  return { semaines, meilleure: Math.max(meilleure, semaines), cetteSemaine: nCourante, objectif: obj, manque: Math.max(0, obj - nCourante) };
}

/* ─── Records personnels ─── */
type SeanceAvecCharges = { realisee_le: string; seance_exercices: { nom: string; charge_kg: number | null }[] };
export type RecordExo = { nom: string; kg: number; date: string; premier: number; nbRecords: number; historique: { date: string; kg: number }[] };

/** Meilleure charge par exercice (et combien de fois elle a été battue) */
export function records(historique: SeanceAvecCharges[]): RecordExo[] {
  const map = new Map<string, RecordExo>();
  [...historique]
    .sort((a, b) => a.realisee_le.localeCompare(b.realisee_le))
    .forEach((s) =>
      s.seance_exercices.forEach((e) => {
        if (e.charge_kg === null || e.charge_kg <= 0) return;
        const r = map.get(e.nom);
        if (!r) map.set(e.nom, { nom: e.nom, kg: e.charge_kg, date: s.realisee_le, premier: e.charge_kg, nbRecords: 0, historique: [{ date: s.realisee_le, kg: e.charge_kg }] });
        else if (e.charge_kg > r.kg) {
          r.kg = e.charge_kg; r.date = s.realisee_le; r.nbRecords++;
          r.historique.push({ date: s.realisee_le, kg: e.charge_kg });
        }
      }),
    );
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export type NouveauRecord = { nom: string; kg: number; avant: number };

/** Records battus par une nouvelle séance (il faut une charge précédente pour parler de record) */
export function nouveauxRecords(historique: SeanceAvecCharges[], exos: { nom: string; kg: number | null }[]): NouveauRecord[] {
  const meilleurs = new Map(records(historique).map((r) => [r.nom, r.kg]));
  const vus = new Set<string>();
  return exos
    .filter((e): e is { nom: string; kg: number } => e.kg !== null && e.kg > 0)
    .filter((e) => {
      const avant = meilleurs.get(e.nom);
      if (avant === undefined || e.kg <= avant || vus.has(e.nom)) return false;
      vus.add(e.nom);
      return true;
    })
    .map((e) => ({ nom: e.nom, kg: e.kg, avant: meilleurs.get(e.nom)! }));
}

/* ─── Badges ─── */
export type IdBadge = "premiere" | "dix" | "vingtcinq" | "cinquante" | "cent" | "record" | "dixRecords" | "serie4" | "serie12" | "cycle" | "defi";
export type Badge = { id: IdBadge; emoji: string; obtenu: boolean; progres: number; cible: number };

export function badges(e: { seances: number; records: number; meilleureSerie: number; cycles: number; defisReussis: number }): Badge[] {
  const b = (id: IdBadge, emoji: string, val: number, cible: number): Badge => ({ id, emoji, obtenu: val >= cible, progres: Math.min(val, cible), cible });
  return [
    b("premiere", "🌱", e.seances, 1),
    b("dix", "💪", e.seances, 10),
    b("vingtcinq", "🔥", e.seances, 25),
    b("cinquante", "⚡", e.seances, 50),
    b("cent", "👑", e.seances, 100),
    b("record", "🏆", e.records, 1),
    b("dixRecords", "🚀", e.records, 10),
    b("serie4", "📅", e.meilleureSerie, 4),
    b("serie12", "🗓️", e.meilleureSerie, 12),
    b("cycle", "🔄", e.cycles, 1),
    b("defi", "🎯", e.defisReussis, 1),
  ];
}

/* ─── Défis du coach ─── */
export type Defi = { id: string; client_id: string | null; titre: string; type: "seances" | "charge"; exercice: string | null; cible: number; debut: string; fin: string };
export type AvancementDefi = { valeur: number; cible: number; pct: number; reussi: boolean; termine: boolean; joursRestants: number };

/** Avancement d'un défi pour une cliente, à partir de ses séances */
export function avancementDefi(d: Defi, historique: SeanceAvecCharges[], autres: string[] = [], now: Date = new Date()): AvancementDefi {
  const dansFenetre = (iso: string) => { const j = jourParis(iso); return j >= d.debut && j <= d.fin; };
  let valeur = 0;
  if (d.type === "seances") {
    valeur = historique.filter((s) => dansFenetre(s.realisee_le)).length + autres.filter(dansFenetre).length;
  } else {
    historique.filter((s) => dansFenetre(s.realisee_le)).forEach((s) =>
      s.seance_exercices.forEach((e) => { if (e.nom === d.exercice && e.charge_kg !== null) valeur = Math.max(valeur, e.charge_kg); }),
    );
  }
  const aujourdhui = jourParis(now);
  const joursRestants = Math.max(0, Math.round((Date.parse(d.fin + "T12:00:00Z") - Date.parse(aujourdhui + "T12:00:00Z")) / 864e5));
  return { valeur, cible: d.cible, pct: Math.min(100, Math.round((valeur / d.cible) * 100)), reussi: valeur >= d.cible, termine: aujourdhui > d.fin, joursRestants };
}
