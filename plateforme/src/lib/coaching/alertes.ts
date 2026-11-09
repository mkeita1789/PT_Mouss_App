/* Signaux pour le coach et messages pour le client, calculés depuis l'historique.
   Reprend coachMessages() de la PWA et ajoute la détection de régression de charge. */
import { amrapNext } from "./amrap";
import { DOULEUR } from "./programme";
import type { Categorie } from "./types";

export type Niveau = "ko" | "gold" | "ok";
export type Alerte = { niveau: Niveau; titre: string; detail: string };

type Ex = { nom: string; categorie: Categorie; charge_kg: number | null; amrap: number | null; cible: number | null };
type Seance = { realisee_le: string; seance_exercices: Ex[] };
type CheckinDate = { jour: string; corps: string };

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

/** Charges successives par exercice, ordre chronologique */
function series(historique: Seance[]) {
  const m: Record<string, Ex[]> = {};
  [...historique].reverse().forEach((s) =>
    s.seance_exercices.forEach((e) => {
      if (e.charge_kg !== null) (m[e.nom] ||= []).push(e);
    }),
  );
  return m;
}

export function joursDepuis(iso: string | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 864e5);
}

/**
 * Alertes coach pour un client.
 * @param historique séances, la plus récente en premier
 * @param checkins check-ins récents (7 derniers jours)
 */
export function alertesCoach(historique: Seance[], checkins: CheckinDate[], now: Date = new Date()): Alerte[] {
  const out: Alerte[] = [];

  /* 1. Douleur signalée — priorité absolue */
  const douleur = checkins.find((c) => c.corps === DOULEUR);
  if (douleur)
    out.push({ niveau: "ko", titre: "Douleur signalée", detail: `Check-in du ${new Date(douleur.jour).toLocaleDateString("fr-FR")} : à contacter avant la prochaine séance.` });

  const s = series(historique);
  for (const [nom, pts] of Object.entries(s)) {
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];

    /* 2. Cible AMRAP manquée sur la dernière séance → charge trop lourde */
    if (last.amrap && last.cible && last.amrap < last.cible) {
      const r = amrapNext(last.amrap, last.cible, last.charge_kg, last.categorie);
      out.push({
        niveau: "gold",
        titre: `${nom} : cible manquée`,
        detail: `${last.amrap} reps sur ${last.cible} visées à ${fmt(last.charge_kg!)} kg${r ? ` → suggestion ${fmt(r.next)} kg` : ""}. Charge probablement trop haute : vérifier technique, sommeil, récupération.`,
      });
      continue;
    }
    /* 3. Charge en baisse par rapport à la séance précédente */
    if (prev && last.charge_kg! < prev.charge_kg!) {
      out.push({ niveau: "gold", titre: `${nom} : charge en baisse`, detail: `${fmt(prev.charge_kg!)} kg → ${fmt(last.charge_kg!)} kg.` });
      continue;
    }
    /* 4. Stagnation sur 3 séances */
    if (pts.length >= 3) {
      const l3 = pts.slice(-3);
      if (l3[2].charge_kg! <= l3[0].charge_kg!)
        out.push({ niveau: "gold", titre: `${nom} : stagnation`, detail: `Charge stable depuis 3 séances (${fmt(l3[2].charge_kg!)} kg).` });
    }
  }

  /* 5. Absence */
  const j = joursDepuis(historique[0]?.realisee_le, now);
  if (j !== null && j >= 7) out.push({ niveau: "gold", titre: "Absence", detail: `${j} jours sans séance enregistrée.` });
  if (historique.length === 0) out.push({ niveau: "gold", titre: "Aucune séance", detail: "Pas encore de séance enregistrée." });

  return out;
}

/** Meilleure progression (kg) depuis la première séance enregistrée */
export function meilleureProgression(historique: Seance[]) {
  const s = series(historique);
  let best: { nom: string; gain: number } | null = null;
  for (const [nom, pts] of Object.entries(s)) {
    const gain = pts[pts.length - 1].charge_kg! - pts[0].charge_kg!;
    if (gain > 0 && (!best || gain > best.gain)) best = { nom, gain };
  }
  return best;
}

/** Messages du coach pour l'accueil client (max 2), comme coachMessages() */
export function messagesClient(opts: {
  prenom: string;
  corps?: string | null;
  deload?: boolean;
  historique: Seance[];
  seancesSemaine: number;
  freq: string;
  now?: Date;
}): { niveau: Niveau; t: string }[] {
  const msgs: { niveau: Niveau; t: string }[] = [];
  if (opts.corps === DOULEUR)
    msgs.push({ niveau: "ko", t: `${opts.prenom}, une douleur n'est pas un détail. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé — et préviens Moustapha, il adaptera.` });
  if (opts.deload)
    msgs.push({ niveau: "ok", t: "Cette semaine est légère — c'est le programme, pas une erreur. C'est pendant la récupération que le corps construit. Ne rajoute rien." });

  const j = joursDepuis(opts.historique[0]?.realisee_le, opts.now);
  if (j !== null && j >= 7)
    msgs.push({ niveau: "gold", t: `${j} jours sans séance. Aucune culpabilité — ça arrive à tout le monde. On repart PLUS PETIT, pas en rattrapant : une séance courte aujourd'hui vaut mieux qu'une séance parfaite jamais faite.` });

  const s = series(opts.historique);
  for (const [nom, pts] of Object.entries(s)) {
    if (pts.length >= 3) {
      const l3 = pts.slice(-3);
      if (l3[2].charge_kg! <= l3[0].charge_kg!) {
        msgs.push({ niveau: "gold", t: `${nom} : la charge ne bouge plus depuis 3 séances. Avant de forcer, vérifie le sommeil et l'assiette. Si ça continue → une semaine légère, puis on repart −10 %. C'est comme ça qu'on débloque.` });
        break;
      }
    }
  }
  const best = meilleureProgression(opts.historique);
  if (best) msgs.push({ niveau: "ok", t: `+${fmt(best.gain)} kg sur ${best.nom} depuis le début. C'est ça, la vraie progression — pas la balance. Continue. 👊` });

  const target = parseInt(opts.freq) || 3;
  if (opts.seancesSemaine >= target)
    msgs.push({ niveau: "ok", t: `${opts.seancesSemaine}/${target} séances cette semaine — objectif atteint. La régularité, c'est LE truc que la plupart des gens n'ont pas. Toi, tu l'as.` });

  return msgs.slice(0, 2);
}
