"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBilan, getUtilisateur, jourParis } from "@/lib/data";
import { CHECKIN_Q, OBJECTIFS, phaseFor, questionsBilan } from "@/lib/coaching/programme";
import { parseKg } from "@/lib/coaching/amrap";
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";

/* Toutes les écritures passent par ces actions serveur. Les entrées sont
   revalidées ici ; les règles RLS de Supabase restent la barrière finale. */

export async function enregistrerBilan(reponses: Partial<Bilan>, recommencer: boolean): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();

  /* Chaque réponse doit appartenir aux choix proposés */
  const propre: Partial<Bilan> = {};
  for (const q of questionsBilan(reponses)) {
    const v = reponses[q.k];
    if (q.type === "text") {
      const txt = String(v ?? "").trim().slice(0, 40);
      if (!txt) return { erreur: "Le prénom est obligatoire." };
      (propre as Record<string, string>)[q.k] = txt;
    } else {
      if (!q.o?.includes(String(v))) return { erreur: `Réponse manquante : ${q.q}` };
      (propre as Record<string, string>)[q.k] = String(v);
    }
  }
  if (!OBJECTIFS.includes(propre.objectif!)) return { erreur: "Objectif inconnu." };

  const supabase = await createClient();
  const existant = await getBilan(user.id);
  const debut = !existant || recommencer ? new Date().toISOString() : existant.debut;

  const { error } = await supabase
    .from("bilans")
    .upsert({ user_id: user.id, reponses: propre, debut, updated_at: new Date().toISOString() });
  if (error) return { erreur: "Impossible d'enregistrer le bilan. Réessaie." };

  await supabase.from("profiles").update({ prenom: propre.prenom }).eq("id", user.id);
  revalidatePath("/", "layout");
  return {};
}

export async function enregistrerCheckin(ci: Checkin): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  for (const q of CHECKIN_Q) if (!q.o.includes(ci[q.k])) return { erreur: "Réponse invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("checkins").upsert({
    user_id: user.id,
    jour: jourParis(),
    sommeil: ci.sommeil,
    energie: ci.energie,
    corps: ci.corps,
  });
  if (error) return { erreur: "Impossible d'enregistrer le check-in." };
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
  const bilan = await getBilan(user.id);
  if (!bilan) return { erreur: "Fais d'abord ton bilan." };
  if (!payload.exercices?.length || payload.exercices.length > 20) return { erreur: "Séance vide." };

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
  if (error || !seance) return { erreur: "Impossible d'enregistrer la séance. Réessaie." };

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
    return { erreur: "Impossible d'enregistrer les exercices. Réessaie." };
  }
  revalidatePath("/", "layout");
  return {};
}
