"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBilan, getUtilisateur, jourParis } from "@/lib/data";
import { CHECKIN_Q, OBJECTIFS, phaseFor, questionsBilan } from "@/lib/coaching/programme";
import { parseKg } from "@/lib/coaching/amrap";
import { JOUR_LIBRE } from "@/lib/coaching/seance";
import { minutesDepuisDebut, notifierCoach } from "@/lib/activite";
import { tc } from "@/lib/i18n";
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

/* Toutes les écritures passent par ces actions serveur. Les entrées sont
   revalidées ici ; les règles RLS de Supabase restent la barrière finale. */

export async function enregistrerBilan(reponses: Partial<Bilan>, recommencer: boolean): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());

  /* Chaque réponse doit appartenir aux choix proposés */
  const propre: Partial<Bilan> = {};
  for (const q of questionsBilan(reponses)) {
    const v = reponses[q.k];
    if (q.type === "text") {
      const txt = String(v ?? "").trim().slice(0, 40);
      if (!txt) return { erreur: T.bilan.prenomObligatoire };
      (propre as Record<string, string>)[q.k] = txt;
    } else {
      if (!q.o?.includes(String(v))) return { erreur: T.bilan.reponseManquante(q.q) };
      (propre as Record<string, string>)[q.k] = String(v);
    }
  }
  if (!OBJECTIFS.includes(propre.objectif!)) return { erreur: T.bilan.objectifInconnu };

  const supabase = await createClient();
  const existant = await getBilan(user.id);
  const debut = !existant || recommencer ? new Date().toISOString() : existant.debut;

  const { error } = await supabase
    .from("bilans")
    .upsert({ user_id: user.id, reponses: propre, debut, updated_at: new Date().toISOString() });
  if (error) return { erreur: T.bilan.erreur };

  await supabase.from("profiles").update({ prenom: propre.prenom }).eq("id", user.id);
  revalidatePath("/", "layout");
  return {};
}

export async function enregistrerCheckin(ci: Checkin): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  for (const q of CHECKIN_Q) if (!q.o.includes(ci[q.k])) return { erreur: T.checkin.invalide };

  const supabase = await createClient();
  const { error } = await supabase.from("checkins").upsert({
    user_id: user.id,
    jour: jourParis(),
    sommeil: ci.sommeil,
    energie: ci.energie,
    corps: ci.corps,
  });
  if (error) return { erreur: T.checkin.erreur };
  revalidatePath("/");
  return {};
}

export async function refaireCheckin(): Promise<void> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  await supabase.from("checkins").delete().eq("user_id", user.id).eq("jour", jourParis());
  revalidatePath("/");
}

export type ExerciceSaisi = {
  nom: string;
  categorie: Categorie;
  charge: string;
  series: number;
  amrap: number | null;
  cible: number | null;
  note: string;
};

export async function enregistrerSeance(payload: {
  jour_code: string;
  focus: string;
  allegee: boolean;
  exercices: ExerciceSaisi[];
}): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const bilan = await getBilan(user.id);
  if (!bilan) return { erreur: T.seance.erreurBilan };
  if (!payload.exercices?.length || payload.exercices.length > 20) return { erreur: T.seance.erreurVide };

  const phase = phaseFor(bilan.reponses, bilan.debut);
  const supabase = await createClient();

  const { data: seance, error } = await supabase
    .from("seances")
    .insert({
      user_id: user.id,
      jour_code: String(payload.jour_code).slice(0, 40),
      focus: String(payload.focus ?? "").slice(0, 80),
      phase: phase?.n ?? null,
      allegee: !!payload.allegee,
    })
    .select("id")
    .single();
  if (error || !seance) return { erreur: T.seance.erreurEnregistrement };

  const lignes = payload.exercices.map((e, i) => {
    const kg = parseKg(e.charge);
    const amrap = e.amrap === null || e.amrap === undefined ? null : Math.round(Number(e.amrap));
    return {
      seance_id: seance.id,
      user_id: user.id,
      position: i,
      nom: String(e.nom).slice(0, 80),
      categorie: (["S", "A", "P", "-"] as const).includes(e.categorie) ? e.categorie : "-",
      charge_kg: kg !== null && kg >= 0 && kg <= 1000 ? kg : null,
      series: Math.max(0, Math.min(20, Math.round(Number(e.series) || 0))),
      amrap: amrap !== null && amrap >= 0 && amrap <= 100 ? amrap : null,
      cible: e.cible ? Math.round(Number(e.cible)) : null,
      note: e.note ? String(e.note).slice(0, 500) : null,
    };
  });

  const { error: errEx } = await supabase.from("seance_exercices").insert(lignes);
  if (errEx) {
    await supabase.from("seances").delete().eq("id", seance.id);
    return { erreur: T.seance.erreurExercices };
  }

  /* Prévenir le coach : « Inès a terminé sa séance — DAY 1 · Glutes Heavy · 4 exercices · 52 min » */
  const jourCode = String(payload.jour_code).slice(0, 40);
  const duree = await minutesDepuisDebut(user.id, jourCode);
  const faits = lignes.filter((l) => l.series > 0).length;
  await notifierCoach(user, "fin", jourCode, (lang) => {
    const N = ui(lang).notifs;
    return [jourCode, tc(lang, payload.focus), N.exos(faits), duree ? N.duree(duree) : ""].filter(Boolean).join(" · ");
  });

  revalidatePath("/", "layout");
  return {};
}

/** Première série cochée : le coach est prévenu que la séance commence (une fois) */
export async function signalerDebut(jourCode: string, focus: string): Promise<void> {
  const user = await getUtilisateur();
  const code = String(jourCode ?? "").slice(0, 40);
  if (!code) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("activites")
    .select("id", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("type", "debut")
    .eq("jour_code", code)
    .gt("cree_le", new Date(Date.now() - 3 * 3600e3).toISOString());
  if (count) return;
  await notifierCoach(user, "debut", code, (lang) => [code, tc(lang, String(focus ?? "").slice(0, 80))].filter(Boolean).join(" · "));
}

/* ─── Séance libre (hors programme) ─── */

export type SerieLibre = { kg: string; reps: string };
export type ExerciceLibre = { nom: string; series: SerieLibre[] };

export async function enregistrerSeanceLibre(payload: { nom: string; exercices: ExerciceLibre[] }): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());

  /* On ne garde que les séries renseignées (charge ou répétitions) */
  const exercices = (payload.exercices ?? [])
    .slice(0, 20)
    .map((e) => ({
      nom: String(e.nom ?? "").trim().slice(0, 80),
      series: (e.series ?? []).slice(0, 20).map((s) => {
        const kg = parseKg(String(s.kg ?? ""));
        const reps = Math.round(Number(String(s.reps ?? "").replace(",", ".")));
        return { kg: kg !== null && kg >= 0 && kg <= 1000 ? kg : null, reps: reps > 0 && reps <= 200 ? reps : null };
      }).filter((s) => s.kg !== null || s.reps !== null),
    }))
    .filter((e) => e.nom && e.series.length);
  if (!exercices.length) return { erreur: T.libre.erreurVide };

  const supabase = await createClient();
  const { data: seance, error } = await supabase
    .from("seances")
    .insert({ user_id: user.id, jour_code: JOUR_LIBRE, focus: String(payload.nom ?? "").trim().slice(0, 80) || T.libre.defaut, phase: null, allegee: false })
    .select("id")
    .single();
  if (error || !seance) return { erreur: T.libre.erreur };

  const lang = await getLang();
  const fmt = (n: number) => String(n).replace(".", lang === "en" ? "." : ",");
  const lignes = exercices.map((e, i) => {
    const kgs = e.series.map((s) => s.kg).filter((k): k is number => k !== null);
    return {
      seance_id: seance.id,
      user_id: user.id,
      position: i,
      nom: e.nom,
      categorie: "-" as const,
      charge_kg: kgs.length ? Math.max(...kgs) : null,
      series: e.series.length,
      amrap: null,
      cible: null,
      /* Détail des séries : « 40 kg × 12 · 45 kg × 10 » */
      note: e.series.map((s) => [s.kg !== null ? `${fmt(s.kg)} kg` : "", s.reps !== null ? `× ${s.reps}` : ""].filter(Boolean).join(" ")).join(" · ").slice(0, 500),
    };
  });

  const { error: errEx } = await supabase.from("seance_exercices").insert(lignes);
  if (errEx) {
    await supabase.from("seances").delete().eq("id", seance.id);
    return { erreur: T.libre.erreur };
  }
  const titre = String(payload.nom ?? "").trim().slice(0, 80);
  await notifierCoach(user, "libre", JOUR_LIBRE, (lg) => [titre || ui(lg).libre.defaut, ui(lg).notifs.exos(lignes.length)].join(" · "));
  revalidatePath("/", "layout");
  return {};
}
