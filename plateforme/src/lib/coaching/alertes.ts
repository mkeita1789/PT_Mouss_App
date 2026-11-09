/* Signaux pour le coach et messages pour le client, calculés depuis l'historique.
   Reprend coachMessages() de la PWA et ajoute la détection de régression de charge.
   Bilingue : les noms d'exercices sont traduits par `nom()` (affichage seulement). */
import { amrapNext } from "./amrap";
import { DOULEUR } from "./programme";
import type { Categorie } from "./types";

type Lang = "fr" | "en";
export type Niveau = "ko" | "gold" | "ok";
export type Alerte = { niveau: Niveau; titre: string; detail: string };

type Ex = { nom: string; categorie: Categorie; charge_kg: number | null; amrap: number | null; cible: number | null };
type Seance = { realisee_le: string; seance_exercices: Ex[] };
type CheckinDate = { jour: string; corps: string };

const fmtL = (n: number, lang: Lang) => String(Math.round(n * 100) / 100).replace(".", lang === "fr" ? "," : ".");
const id = (s: string) => s;

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
export function alertesCoach(
  historique: Seance[],
  checkins: CheckinDate[],
  now: Date = new Date(),
  lang: Lang = "fr",
  nom: (s: string) => string = id,
): Alerte[] {
  const en = lang === "en";
  const fmt = (n: number) => fmtL(n, lang);
  const out: Alerte[] = [];

  /* 1. Douleur signalée — priorité absolue */
  const douleur = checkins.find((c) => c.corps === DOULEUR);
  if (douleur) {
    const d = new Date(douleur.jour).toLocaleDateString(en ? "en-GB" : "fr-FR");
    out.push(en
      ? { niveau: "ko", titre: "Pain reported", detail: `Check-in on ${d}: get in touch before the next session.` }
      : { niveau: "ko", titre: "Douleur signalée", detail: `Check-in du ${d} : à contacter avant la prochaine séance.` });
  }

  const s = series(historique);
  for (const [brut, pts] of Object.entries(s)) {
    const n = nom(brut);
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];

    /* 2. Cible AMRAP manquée sur la dernière séance → charge trop lourde */
    if (last.amrap && last.cible && last.amrap < last.cible) {
      const r = amrapNext(last.amrap, last.cible, last.charge_kg, last.categorie);
      out.push(en
        ? { niveau: "gold", titre: `${n}: target missed`, detail: `${last.amrap} reps of ${last.cible} at ${fmt(last.charge_kg!)} kg${r ? ` → suggest ${fmt(r.next)} kg` : ""}. Load probably too high: check technique, sleep, recovery.` }
        : { niveau: "gold", titre: `${n} : cible manquée`, detail: `${last.amrap} reps sur ${last.cible} visées à ${fmt(last.charge_kg!)} kg${r ? ` → suggestion ${fmt(r.next)} kg` : ""}. Charge probablement trop haute : vérifier technique, sommeil, récupération.` });
      continue;
    }
    /* 3. Charge en baisse par rapport à la séance précédente */
    if (prev && last.charge_kg! < prev.charge_kg!) {
      out.push({ niveau: "gold", titre: en ? `${n}: load down` : `${n} : charge en baisse`, detail: `${fmt(prev.charge_kg!)} kg → ${fmt(last.charge_kg!)} kg.` });
      continue;
    }
    /* 4. Stagnation sur 3 séances */
    if (pts.length >= 3) {
      const l3 = pts.slice(-3);
      if (l3[2].charge_kg! <= l3[0].charge_kg!)
        out.push(en
          ? { niveau: "gold", titre: `${n}: plateau`, detail: `Load flat for 3 sessions (${fmt(l3[2].charge_kg!)} kg).` }
          : { niveau: "gold", titre: `${n} : stagnation`, detail: `Charge stable depuis 3 séances (${fmt(l3[2].charge_kg!)} kg).` });
    }
  }

  /* 5. Absence */
  const j = joursDepuis(historique[0]?.realisee_le, now);
  if (j !== null && j >= 7)
    out.push(en ? { niveau: "gold", titre: "Absence", detail: `${j} days without a logged session.` } : { niveau: "gold", titre: "Absence", detail: `${j} jours sans séance enregistrée.` });
  if (historique.length === 0)
    out.push(en ? { niveau: "gold", titre: "No sessions", detail: "No session logged yet." } : { niveau: "gold", titre: "Aucune séance", detail: "Pas encore de séance enregistrée." });

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
  lang?: Lang;
  nom?: (s: string) => string;
}): { niveau: Niveau; t: string }[] {
  const en = opts.lang === "en";
  const nom = opts.nom ?? id;
  const fmt = (n: number) => fmtL(n, opts.lang ?? "fr");
  const msgs: { niveau: Niveau; t: string }[] = [];
  if (opts.corps === DOULEUR)
    msgs.push({ niveau: "ko", t: en
      ? `${opts.prenom}, pain isn't a detail. You don't train through it. If it lasts: healthcare professional — and tell Moustapha, he'll adapt.`
      : `${opts.prenom}, une douleur n'est pas un détail. On ne s'entraîne pas dessus. Si elle persiste : professionnel de santé — et préviens Moustapha, il adaptera.` });
  if (opts.deload)
    msgs.push({ niveau: "ok", t: en
      ? "This week is light — it's the plan, not a mistake. The body builds during recovery. Don't add anything."
      : "Cette semaine est légère — c'est le programme, pas une erreur. C'est pendant la récupération que le corps construit. Ne rajoute rien." });

  const j = joursDepuis(opts.historique[0]?.realisee_le, opts.now);
  if (j !== null && j >= 7)
    msgs.push({ niveau: "gold", t: en
      ? `${j} days without a session. No guilt — it happens to everyone. We restart SMALLER, not by catching up: a short session today beats a perfect one never done.`
      : `${j} jours sans séance. Aucune culpabilité — ça arrive à tout le monde. On repart PLUS PETIT, pas en rattrapant : une séance courte aujourd'hui vaut mieux qu'une séance parfaite jamais faite.` });

  const s = series(opts.historique);
  for (const [brut, pts] of Object.entries(s)) {
    if (pts.length >= 3) {
      const l3 = pts.slice(-3);
      if (l3[2].charge_kg! <= l3[0].charge_kg!) {
        msgs.push({ niveau: "gold", t: en
          ? `${nom(brut)}: the load hasn't moved in 3 sessions. Before forcing it, check your sleep and your plate. If it continues → a light week, then restart −10%. That's how you break through.`
          : `${brut} : la charge ne bouge plus depuis 3 séances. Avant de forcer, vérifie le sommeil et l'assiette. Si ça continue → une semaine légère, puis on repart −10 %. C'est comme ça qu'on débloque.` });
        break;
      }
    }
  }
  const best = meilleureProgression(opts.historique);
  if (best)
    msgs.push({ niveau: "ok", t: en
      ? `+${fmt(best.gain)} kg on ${nom(best.nom)} since the start. That's real progress — not the scale. Keep going. 👊`
      : `+${fmt(best.gain)} kg sur ${best.nom} depuis le début. C'est ça, la vraie progression — pas la balance. Continue. 👊` });

  const target = parseInt(opts.freq) || 3;
  if (opts.seancesSemaine >= target)
    msgs.push({ niveau: "ok", t: en
      ? `${opts.seancesSemaine}/${target} sessions this week — goal reached. Consistency is THE thing most people lack. You have it.`
      : `${opts.seancesSemaine}/${target} séances cette semaine — objectif atteint. La régularité, c'est LE truc que la plupart des gens n'ont pas. Toi, tu l'as.` });

  return msgs.slice(0, 2);
}
