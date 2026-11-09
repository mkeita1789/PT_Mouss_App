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
