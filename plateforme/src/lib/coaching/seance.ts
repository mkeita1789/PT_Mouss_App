/* Préparation d'une séance : charges suggérées à partir de l'historique.
   Reprend la logique de viewSeance() de la PWA :
   - changement de phase → charge recalculée depuis le 1RM estimé ;
   - même phase → progression fine par l'AMRAP ;
   - check-in « alléger » → −1 série par exercice. */
import { amrapNext, amrapTexte, chargePourPhase, fmtKgL, targetReps } from "./amrap";
import type { Categorie, Jour, PhaseCourante } from "./types";

export type HistoEx = { nom: string; charge_kg: number | null; amrap: number | null };
export type HistoSeance = { jour_code: string; phase: string | null; seance_exercices: HistoEx[] };

export type LigneSeance = {
  n: string;
  c: Categorie;
  r: string;
  rir: string;
  note: string;
  drop: boolean;
  sets: number;
  charge: string;
  derniereCharge: number | null;
  suggestion: number | null;
  suggestionTxt: string;
  changementPhase: boolean;
  cible: number | null;
  suivi: boolean; // exercice chargé (S/A/P) → saisie de charge + AMRAP
};

/** Code des séances libres (hors programme) : ignorées pour le jour suivant et les charges */
export const JOUR_LIBRE = "LIBRE";

/** Jour du programme suggéré : celui qui suit la dernière séance du programme */
export function indexJourSuivant(days: Jour[], historique: { jour_code: string }[]): number {
  if (!days.length) return 0;
  const derniere = historique.find((h) => h.jour_code !== JOUR_LIBRE);
  const i = days.findIndex((d) => d.d === derniere?.jour_code);
  return i >= 0 ? (i + 1) % days.length : 0;
}

/**
 * @param historique séances du client, la plus récente en premier
 */
export function prepareSeance(
  day: Jour,
  historique: HistoSeance[],
  phase: PhaseCourante | null,
  deload: boolean,
  alleger: boolean,
  lang: "fr" | "en" = "fr",
  nomPhase: (n: string) => string = (n) => n,
): LigneSeance[] {
  const fmtKg = (n: number) => fmtKgL(n, lang);
  const derniere = historique.find((h) => h.jour_code === day.d);

  return day.ex.map((e) => {
    const prev = derniere?.seance_exercices.find((x) => x.nom === e.n);
    const lv = prev?.charge_kg ?? null;
    const cible = targetReps(e.r);
    let suggestion: number | null = null;
    let suggestionTxt = "";
    let changementPhase = false;

    const phaseChangee = !!(derniere?.phase && phase?.n && derniere.phase !== phase.n);

    if (phaseChangee && prev?.amrap && lv !== null && phase) {
      const c = chargePourPhase(lv, prev.amrap, phase.pct, e.c);
      if (c) {
        suggestion = c.next;
        changementPhase = true;
        suggestionTxt = lang === "en"
          ? `New ${nomPhase(phase.n)} phase (${c.pct}% of your max) → ${fmtKg(c.next)} kg`
          : `Nouvelle phase ${phase.n} (${c.pct} % de ton max) → ${fmtKg(c.next)} kg`;
      }
    }
    if (suggestion === null && prev?.amrap && cible && lv !== null) {
      const r = amrapNext(prev.amrap, cible, lv, e.c, deload);
      if (r) {
        suggestion = r.next;
        suggestionTxt = amrapTexte(r, lv, lang);
      }
    }

    const charge = suggestion !== null && suggestion !== lv ? fmtKg(suggestion) : lv !== null ? fmtKg(lv) : "";

    return {
      n: e.n,
      c: e.c,
      r: e.r,
      rir: e.rir,
      note: e.note,
      drop: !!e.drop && !deload,
      sets: alleger ? Math.max(2, e.s - 1) : e.s,
      charge,
      derniereCharge: lv,
      suggestion,
      suggestionTxt,
      changementPhase,
      cible,
      suivi: e.c !== "-",
    };
  });
}
