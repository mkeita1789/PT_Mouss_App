"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateur } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { METIERS, type Metier } from "@/lib/profils";

export type EtatLien = { erreur?: string; ok?: string } | undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Changer de profil (sportif, joueur, coach…) : n'adapte que l'accueil et les onglets */
export async function changerMetier(metier: Metier): Promise<EtatLien> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  if (!METIERS.includes(metier)) return { erreur: T.erreurs.generique };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ metier }).eq("id", user.id);
  if (error) return { erreur: T.erreurs.generique };
  revalidatePath("/", "layout");
  return { ok: T.metiers.metierEnregistre };
}

/** Le sportif entre le code d'un professionnel : il accepte d'être suivi par lui */
export async function rejoindre(_: EtatLien, formData: FormData): Promise<EtatLien> {
  await getUtilisateur();
  const T = ui(await getLang());
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return { erreur: T.metiers.codeInconnu };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rejoindre", { p_code: code });
  const pro = Array.isArray(data) ? data[0] : null;
  if (error || !pro) return { erreur: T.metiers.codeInconnu };
  revalidatePath("/profil");
  return { ok: T.metiers.rejoint(pro.prenom || T.metiers.noms[pro.metier as Metier] || "") };
}

/** Rompre un lien : `cote` dit de quel côté je suis dans ce lien */
export async function rompre(autreId: string, cote: "sportif" | "pro"): Promise<void> {
  const user = await getUtilisateur();
  if (!UUID.test(autreId)) return;
  const supabase = await createClient();
  const q = supabase.from("suivis").delete();
  await (cote === "sportif" ? q.eq("sportif_id", user.id).eq("pro_id", autreId) : q.eq("pro_id", user.id).eq("sportif_id", autreId));
  revalidatePath("/profil");
  revalidatePath("/pro");
}
