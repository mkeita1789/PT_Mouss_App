"use server";

import { getUtilisateur } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { envoyer, type Abonnement } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

type AboNavigateur = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Enregistre ce téléphone pour recevoir les notifications du compte connecté */
export async function enregistrerAbonnement(abo: AboNavigateur): Promise<{ erreur?: string }> {
  await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const { endpoint, keys } = abo ?? {};
  if (!endpoint?.startsWith("https://") || endpoint.length > 1000 || !keys?.p256dh || !keys.auth || keys.p256dh.length > 200 || keys.auth.length > 100)
    return { erreur: T.notifs.erreur };
  const supabase = await createClient();
  const { error } = await supabase.rpc("enregistrer_abonnement", { p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth, p_lang: lang });
  return error ? { erreur: T.notifs.erreur } : {};
}

export async function supprimerAbonnement(endpoint: string): Promise<void> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  await supabase.from("push_abonnements").delete().eq("user_id", user.id).eq("endpoint", String(endpoint).slice(0, 1000));
}

/** Notification de test vers ce téléphone uniquement */
export async function testerNotification(endpoint: string): Promise<{ ok?: string; erreur?: string }> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const supabase = await createClient();
  const { data } = await supabase.from("push_abonnements").select("endpoint, p256dh, auth, lang").eq("user_id", user.id).eq("endpoint", String(endpoint).slice(0, 1000));
  if (!data?.length) return { erreur: T.notifs.erreur };
  const morts = await envoyer(data as Abonnement[], (lang) => ({ titre: ui(lang).notifs.testTitre, corps: ui(lang).notifs.testCorps, url: "/profil", tag: "test" }));
  return morts.length ? { erreur: T.notifs.erreur } : { ok: T.notifs.testEnvoye };
}
