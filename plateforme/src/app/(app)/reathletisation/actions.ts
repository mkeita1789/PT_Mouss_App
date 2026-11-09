"use server";

import { revalidatePath } from "next/cache";
import { exigerCoach, getReath, getUtilisateur } from "@/lib/data";
import { notifierCoach } from "@/lib/activite";
import { alerteGenou, JOURS_EN, JOURS_FR, NB_SEMAINES, REATH_LCA } from "@/lib/coaching/reath-lca";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ─── Cliente : noter une séance ─── */
export async function noterSeanceReath(semaine: number, jour: number, douleur: number, gonflement: boolean, note: string): Promise<{ erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const reath = await getReath(user.id);
  const s = Math.round(semaine), j = Math.round(jour), d = Math.round(douleur);
  const seance = REATH_LCA[s - 1]?.jours[j];
  if (!reath || s < 1 || s > Math.min(reath.semaine, NB_SEMAINES) || !seance || seance.type === "repos" || !(d >= 0 && d <= 10)) return { erreur: T.reath.erreur };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reath_seances")
    .upsert({ client_id: user.id, semaine: s, jour: j, douleur: d, gonflement: !!gonflement, note: String(note ?? "").trim().slice(0, 300) || null, fait_le: new Date().toISOString() }, { onConflict: "client_id,semaine,jour" });
  if (error) return { erreur: T.reath.erreur };

  /* Le coach est prévenu, avec un signal clair en cas de douleur ou de gonflement */
  const alerte = alerteGenou(d, !!gonflement);
  await notifierCoach(user, "fin", `LCA S${s}`, (lang) => {
    const R = ui(lang).reath;
    const parts = [R.detail(s, (lang === "en" ? JOURS_EN : JOURS_FR)[j]), R.douleurCourt(d)];
    if (gonflement) parts.push(R.gonfle);
    return (alerte ? "⚠️ " : "") + parts.join(" · ");
  });
  revalidatePath("/reathletisation");
  return {};
}

export async function retirerSeanceReath(semaine: number, jour: number): Promise<void> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  await supabase.from("reath_seances").delete().eq("client_id", user.id).eq("semaine", Math.round(semaine)).eq("jour", Math.round(jour));
  revalidatePath("/reathletisation");
}

/* ─── Coach : inscrire, faire passer les semaines, arrêter ─── */
export async function inscrireReath(clientId: string, formData: FormData): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const criteres = formData.getAll("critere").length;
  if (criteres < 5) return;
  const debut = String(formData.get("debut") ?? "");
  const supabase = await createClient();
  await supabase.from("reath").upsert({ client_id: clientId, semaine: 1, debut: /^\d{4}-\d{2}-\d{2}$/.test(debut) ? debut : new Date().toISOString().slice(0, 10), maj_le: new Date().toISOString() });
  revalidatePath(`/coach/${clientId}`);
  revalidatePath("/reathletisation");
}

export async function changerSemaineReath(clientId: string, semaine: number): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const s = Math.max(1, Math.min(NB_SEMAINES + 1, Math.round(semaine)));
  const supabase = await createClient();
  await supabase.from("reath").update({ semaine: s, maj_le: new Date().toISOString() }).eq("client_id", clientId);
  revalidatePath(`/coach/${clientId}`);
  revalidatePath("/reathletisation");
}

export async function arreterReath(clientId: string): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const supabase = await createClient();
  await supabase.from("reath").delete().eq("client_id", clientId);
  revalidatePath(`/coach/${clientId}`);
  revalidatePath("/reathletisation");
}

export async function enregistrerVma(clientId: string, formData: FormData): Promise<void> {
  await exigerCoach();
  if (!UUID.test(clientId)) return;
  const brut = String(formData.get("vma") ?? "").replace(",", ".").trim();
  const v = brut ? Math.round(Number(brut) * 10) / 10 : null;
  if (v !== null && !(v >= 8 && v <= 25)) return;
  const supabase = await createClient();
  await supabase.from("reath").update({ vma: v, maj_le: new Date().toISOString() }).eq("client_id", clientId);
  revalidatePath(`/coach/${clientId}`);
  revalidatePath("/reathletisation");
}
