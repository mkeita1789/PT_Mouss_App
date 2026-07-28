/* ═══════════════════════════════════════════════
   JIGI — Moteur de progression automatique (AMRAP)
   Le client ne saisit qu'UNE valeur : les reps de la DERNIÈRE série.
   Le coach en déduit le RPE et la charge suivante.
   ═══════════════════════════════════════════════ */

/* Reps cibles à partir d'une chaîne "8-10", "12", "10/j", "45 s"… */
window.targetReps = function (r) {
  if (!r) return null;
  const s = String(r);
  if (/s$|min|circuit|×/i.test(s) && !/\d+\s*-\s*\d+/.test(s)) {
    const only = s.match(/^(\d+)\s*(reps?)?$/);
    if (!only) return null;
  }
  const range = s.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return Math.round((+range[1] + +range[2]) / 2); // milieu de fourchette
  const one = s.match(/(\d+)/);
  return one ? +one[1] : null;
};

/* Pas de charge minimal selon le type d'exercice (S=gros, A=intermédiaire, P=isolation) */
function loadStep(cat) {
  return cat === "S" ? 2.5 : cat === "A" ? 2.5 : 1.25;
}

/* ─── CŒUR DU SYSTÈME ───
   reps  = reps réalisées sur la dernière série (AMRAP)
   cible = reps cibles prescrites
   poids = charge utilisée
   cat   = catégorie SRA de l'exercice
   Retourne { rpe, next, delta, verdict, raison } */
window.amrapNext = function (reps, cible, poids, cat, deload) {
  if (!reps || !cible || !poids || isNaN(poids)) return null;
  const ecart = reps - cible;

  /* RPE estimé — table JIGI : chaque rep au-delà de la cible ≈ 0,5 point de moins */
  let rpe = 10 - ecart * 0.5;
  if (ecart < 0) rpe = 10;
  rpe = Math.max(5, Math.min(10, rpe));

  /* ── CORRECTION DE CHARGE SENSIBLE À LA PLAGE DE REPS ──
     On convertit la performance réelle en charge équivalente pour la cible,
     via le rapport des maximums estimés (Epley).
     3 reps de plus sur une cible de 6 = charge bien plus sous-évaluée
     que 3 reps de plus sur une cible de 12. La formule le capte seule. */
  const ratio = (1 + Math.min(reps, 15) / 30) / (1 + cible / 30);
  const theorique = ratio - 1;             /* correction "pleine" */
  const PRUDENCE = 0.9;                     /* on prend 90 % du chemin :
                                               assez pour progresser, pas assez pour se brûler */
  let pctCible = theorique * PRUDENCE;

  const step = loadStep(cat);
  let verdict, raison;
  if (ecart < 0) {
    verdict = "BAISSER"; raison = "cibleRatee";
  } else if (ecart <= 1) {
    /* Règle JIGI : dans la cible ou +1 rep → on consolide, on ne monte pas */
    pctCible = 0;
    verdict = "MAINTENIR"; raison = "prochePlafond";
  } else if (ecart <= 2) {
    verdict = "MONTER"; raison = "legerementSous";
  } else if (ecart <= 4) {
    verdict = "MONTER"; raison = "sousZone";
  } else {
    verdict = "MONTER"; raison = "tropLeger";
  }

  /* Sécurité : jamais plus de +10 %, jamais moins de −5 % en une séance */
  pctCible = Math.max(-0.05, Math.min(0.10, pctCible));

  let delta = Math.round((poids * pctCible) / step) * step;
  const plafond = Math.round((poids * 0.10) / step) * step;
  if (delta > plafond) delta = plafond;
  /* progression visée mais arrondi à zéro → au moins un pas de charge */
  if (pctCible > 0 && delta === 0) delta = step;
  if (ecart < 0 && delta === 0) delta = -step;
  if (pctCible === 0) { delta = 0; verdict = "MAINTENIR"; raison = "prochePlafond"; }

  let next = poids + delta;
  if (next < step) next = step;
  next = Math.round(next / step) * step;

  /* Semaine légère : aucune augmentation, la récupération prime */
  if (deload && delta > 0) {
    next = poids; delta = 0; verdict = "MAINTENIR"; raison = "deload";
  }

  return { rpe: Math.round(rpe * 2) / 2, next, delta, verdict, raison, ecart };
};

/* ═══ ESTIMATION DU MAXIMUM (1RM) ═══
   Formule d'Epley, plafonnée à 12 reps : au-delà, l'estimation devient
   trop optimiste et surestimerait la charge de la phase suivante. */
window.estime1RM = function (poids, reps) {
  if (!poids || !reps || isNaN(poids)) return null;
  const r = Math.min(reps, 12);
  return poids * (1 + r / 30);
};

/* Pourcentage cible d'une phase, lu depuis sa chaîne ("70 %", "80-85 %") */
window.phasePct = function (pctStr) {
  if (!pctStr) return null;
  const range = String(pctStr).match(/(\d+)\s*-\s*(\d+)/);
  if (range) return (+range[1] + +range[2]) / 200;   /* milieu de fourchette */
  const one = String(pctStr).match(/(\d+)\s*%/);
  return one ? +one[1] / 100 : null;                 /* "Découverte…" → null */
};

/* ─── CHANGEMENT DE PHASE ───
   Recalcule la charge quand on passe d'une phase à l'autre (ex. Hypertrophie → Force),
   à partir du 1RM estimé sur SA propre performance précédente.
   Retourne { next, e1rm, pct, hausse } ou null. */
window.chargePourPhase = function (dernPoids, dernReps, pctStr, cat) {
  const pct = window.phasePct(pctStr);
  const e1rm = window.estime1RM(dernPoids, dernReps);
  if (!pct || !e1rm) return null;

  const step = loadStep(cat);
  let next = Math.round((e1rm * pct) / step) * step;

  /* Sécurité : un changement de phase ne fait jamais bondir de plus de 25 %
     (au-delà, c'est probablement une donnée aberrante). */
  const maxi = Math.round((dernPoids * 1.25) / step) * step;
  const mini = Math.round((dernPoids * 0.45) / step) * step;
  if (next > maxi) next = maxi;
  if (next < mini) next = mini;
  if (next < step) next = step;

  return { next, e1rm: Math.round(e1rm * 10) / 10, pct: Math.round(pct * 100),
           hausse: Math.round((next - dernPoids) * 10) / 10 };
};
window.amrapText = function (r, poids) {
  if (!r) return "";
  const fmt = (n) => String(n).replace(".", ",");
  const rpeTxt = `RPE ~${fmt(r.rpe)}`;
  if (r.verdict === "MAINTENIR" && r.raison === "deload") return `${rpeTxt} · ${t("amrap.deload")}`;
  if (r.verdict === "MAINTENIR") return `${rpeTxt} · ${t("amrap.hold")} <b>${fmt(poids)} kg</b>`;
  if (r.verdict === "BAISSER") return `${rpeTxt} · ${t("amrap.down")} <b>${fmt(r.next)} kg</b>`;
  return `${rpeTxt} · ${t("amrap.up")} <b>${fmt(r.next)} kg</b>`;
};
