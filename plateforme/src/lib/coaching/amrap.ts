/* ═══════════════════════════════════════════════
   JIGI — Moteur de progression automatique (AMRAP)
   Port fidèle de amrap.js (PWA).
   Le client ne saisit qu'UNE valeur : les reps de la DERNIÈRE série.
   ═══════════════════════════════════════════════ */
import type { Categorie } from "./types";

export type Verdict = "MONTER" | "MAINTENIR" | "BAISSER";
export type Raison = "cibleRatee" | "prochePlafond" | "legerementSous" | "sousZone" | "tropLeger" | "deload";

export type ResultatAmrap = {
  rpe: number;
  next: number;
  delta: number;
  verdict: Verdict;
  raison: Raison;
  ecart: number;
};

/** Reps cibles à partir d'une chaîne "8-10", "12", "10/j", "45 s"… */
export function targetReps(r: string | null | undefined): number | null {
  if (!r) return null;
  const s = String(r);
  if (/s$|min|circuit|×/i.test(s) && !/\d+\s*-\s*\d+/.test(s)) {
    const only = s.match(/^(\d+)\s*(reps?)?$/);
    if (!only) return null;
  }
  const range = s.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return Math.round((+range[1] + +range[2]) / 2);
  const one = s.match(/(\d+)/);
  return one ? +one[1] : null;
}

/** Pas de charge minimal selon le type d'exercice */
export function loadStep(cat: Categorie): number {
  return cat === "S" ? 2.5 : cat === "A" ? 2.5 : 1.25;
}

/**
 * Cœur du système.
 * reps = reps réalisées sur la dernière série · cible = reps prescrites · poids = charge utilisée
 */
export function amrapNext(
  reps: number | null,
  cible: number | null,
  poids: number | null,
  cat: Categorie,
  deload = false,
): ResultatAmrap | null {
  if (!reps || !cible || !poids || isNaN(poids)) return null;
  const ecart = reps - cible;

  let rpe = 10 - ecart * 0.5;
  if (ecart < 0) rpe = 10;
  rpe = Math.max(5, Math.min(10, rpe));

  /* Correction via le rapport des maximums estimés (Epley), 90 % du chemin */
  const ratio = (1 + Math.min(reps, 15) / 30) / (1 + cible / 30);
  const PRUDENCE = 0.9;
  let pctCible = (ratio - 1) * PRUDENCE;

  const step = loadStep(cat);
  let verdict: Verdict;
  let raison: Raison;
  if (ecart < 0) {
    verdict = "BAISSER"; raison = "cibleRatee";
  } else if (ecart <= 1) {
    pctCible = 0; verdict = "MAINTENIR"; raison = "prochePlafond";
  } else if (ecart <= 2) {
    verdict = "MONTER"; raison = "legerementSous";
  } else if (ecart <= 4) {
    verdict = "MONTER"; raison = "sousZone";
  } else {
    verdict = "MONTER"; raison = "tropLeger";
  }

  /* Sécurité : jamais plus de +10 %, jamais moins de −5 % en une séance */
  pctCible = Math.max(-0.05, Math.min(0.1, pctCible));

  let delta = Math.round((poids * pctCible) / step) * step;
  const plafond = Math.round((poids * 0.1) / step) * step;
  if (delta > plafond) delta = plafond;
  if (pctCible > 0 && delta === 0) delta = step;
  if (ecart < 0 && delta === 0) delta = -step;
  if (pctCible === 0) { delta = 0; verdict = "MAINTENIR"; raison = "prochePlafond"; }

  let next = poids + delta;
  if (next < step) next = step;
  next = Math.round(next / step) * step;

  if (deload && delta > 0) {
    next = poids; delta = 0; verdict = "MAINTENIR"; raison = "deload";
  }

  return { rpe: Math.round(rpe * 2) / 2, next, delta, verdict, raison, ecart };
}

/** Estimation du 1RM — Epley plafonnée à 12 reps */
export function estime1RM(poids: number, reps: number): number | null {
  if (!poids || !reps || isNaN(poids)) return null;
  return poids * (1 + Math.min(reps, 12) / 30);
}

/** Pourcentage cible d'une phase ("70 %", "80-85 %") */
export function phasePct(pctStr: string | null | undefined): number | null {
  if (!pctStr) return null;
  const range = String(pctStr).match(/(\d+)\s*-\s*(\d+)/);
  if (range) return (+range[1] + +range[2]) / 200;
  const one = String(pctStr).match(/(\d+)\s*%/);
  return one ? +one[1] / 100 : null;
}

/** Recalcule la charge au changement de phase, depuis le 1RM estimé de la dernière performance */
export function chargePourPhase(dernPoids: number, dernReps: number, pctStr: string, cat: Categorie) {
  const pct = phasePct(pctStr);
  const e1rm = estime1RM(dernPoids, dernReps);
  if (!pct || !e1rm) return null;

  const step = loadStep(cat);
  let next = Math.round((e1rm * pct) / step) * step;
  const maxi = Math.round((dernPoids * 1.25) / step) * step;
  const mini = Math.round((dernPoids * 0.45) / step) * step;
  if (next > maxi) next = maxi;
  if (next < mini) next = mini;
  if (next < step) next = step;

  return {
    next,
    e1rm: Math.round(e1rm * 10) / 10,
    pct: Math.round(pct * 100),
    hausse: Math.round((next - dernPoids) * 10) / 10,
  };
}

export const fmtKg = (n: number) => String(n).replace(".", ",");

export const RAISON_TXT: Record<Raison, string> = {
  cibleRatee: "Cible non atteinte : la charge est trop lourde pour l'instant. On recule pour mieux repartir.",
  prochePlafond: "Tu es dans la bonne zone. On consolide avant de monter.",
  legerementSous: "Un peu sous la zone optimale. Petite progression.",
  sousZone: "Sous la zone d'hypertrophie optimale. On charge.",
  tropLeger: "Charge nettement trop légère pour l'objectif.",
  deload: "Semaine de récupération : on ne monte pas, même si c'était facile. C'est le programme.",
};

export function amrapTexte(r: ResultatAmrap, poids: number): string {
  const rpe = `RPE ~${fmtKg(r.rpe)}`;
  if (r.raison === "deload") return `${rpe} · semaine légère — on ne monte pas`;
  if (r.verdict === "MAINTENIR") return `${rpe} · garde ${fmtKg(poids)} kg`;
  if (r.verdict === "BAISSER") return `${rpe} · redescends à ${fmtKg(r.next)} kg`;
  return `${rpe} · monte à ${fmtKg(r.next)} kg`;
}

/** Lecture d'une saisie de charge ("62,5", "62.5 kg") */
export function parseKg(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}
