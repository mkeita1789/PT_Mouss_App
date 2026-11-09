"use server";

import { revalidatePath } from "next/cache";
import { exigerCoach } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { createClient } from "@/lib/supabase/server";
import { envoyerApres, type Abonnement } from "@/lib/push";

export type EtatMot = { erreur?: string; ok?: string; n?: number } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function envoyerMot(clientId: string, prev: EtatMot, formData: FormData): Promise<EtatMot> {
  const coach = await exigerCoach();
  const T = ui(await getLang());
  const texte = String(formData.get("texte") ?? "").trim();
  if (!UUID.test(clientId) || !texte) return { erreur: T.mot.erreur };
  if (texte.length > 600) return { erreur: T.mot.trop };
  const supabase = await createClient();
  const { error } = await supabase.from("mots_coach").insert({ client_id: clientId, texte });
  if (error) return { erreur: T.mot.erreur };

  /* La cliente est prévenue sur son téléphone (si elle a activé les notifications) */
  const { data: abos } = await supabase.from("push_abonnements").select("endpoint, p256dh, auth, lang").eq("user_id", clientId);
  const signature = coach.prenom || "Coach";
  envoyerApres((abos ?? []) as Abonnement[], (lang) => ({
    titre: ui(lang).notifs.mot(signature),
    corps: texte.length > 160 ? texte.slice(0, 157) + "…" : texte,
    url: "/",
    tag: "mot-coach",
  }));

  revalidatePath(`/coach/${clientId}`);
  return { ok: T.mot.envoye, n: (prev?.n ?? 0) + 1 };
}

export async function supprimerMot(id: string, clientId: string) {
  await exigerCoach();
  if (!UUID.test(id) || !UUID.test(clientId)) return;
  const supabase = await createClient();
  await supabase.from("mots_coach").delete().eq("id", id);
  revalidatePath(`/coach/${clientId}`);
}

/* ─── Défis ─── */
export type EtatDefi = { erreur?: string; ok?: string; n?: number } | undefined;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function creerDefi(prev: EtatDefi, formData: FormData): Promise<EtatDefi> {
  const coach = await exigerCoach();
  const lang = await getLang();
  const T = ui(lang);
  const titre = String(formData.get("titre") ?? "").trim().slice(0, 80);
  const type = formData.get("type") === "charge" ? "charge" : "seances";
  const exercice = type === "charge" ? String(formData.get("exercice") ?? "").trim().slice(0, 80) : null;
  const cible = Number(String(formData.get("cible") ?? "").replace(",", "."));
  const client = String(formData.get("client") ?? "");
  const debut = String(formData.get("debut") ?? "");
  const fin = String(formData.get("fin") ?? "");
  if (!titre || !(cible > 0 && cible <= 1000) || !DATE.test(debut) || !DATE.test(fin) || fin < debut || (type === "charge" && !exercice) || (client && !UUID.test(client)))
    return { erreur: T.mot.erreur };

  const supabase = await createClient();
  const { error } = await supabase.from("defis").insert({ titre, type, exercice, cible, debut, fin, client_id: client || null });
  if (error) return { erreur: T.motiv.defisIndispo };

  /* Les clientes concernées sont prévenues */
  let q = supabase.from("push_abonnements").select("endpoint, p256dh, auth, lang, user_id").neq("user_id", coach.id);
  if (client) q = q.eq("user_id", client);
  const { data: abos } = await q;
  envoyerApres((abos ?? []) as Abonnement[], (lg) => ({
    titre: lg === "en" ? `New challenge: ${titre} 🎯` : `Nouveau défi : ${titre} 🎯`,
    corps: lg === "en" ? `Your coach ${coach.prenom || ""} is counting on you. Ends ${fin.split("-").reverse().join("/")}.` : `${coach.prenom || "Ton coach"} compte sur toi. Fin le ${fin.split("-").reverse().join("/")}.`,
    url: "/",
    tag: "defi",
  }));
  revalidatePath("/coach");
  revalidatePath("/", "layout");
  return { ok: "✓", n: (prev?.n ?? 0) + 1 };
}

export async function supprimerDefi(id: string) {
  await exigerCoach();
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("defis").delete().eq("id", id);
  revalidatePath("/coach");
  revalidatePath("/", "layout");
}
