"use server";

import { revalidatePath } from "next/cache";
import { getUtilisateur, VUES, type Vue } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { createClient } from "@/lib/supabase/server";

export type Resultat = { erreur?: string };

/* Chemin attendu : <uid>/<identifiant>.jpg — dans le dossier de l'utilisateur, rien d'autre */
const cheminValide = (chemin: string, uid: string) =>
  chemin.startsWith(uid + "/") && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(chemin);

/* ─── Photo de profil ─── */

export async function enregistrerAvatar(chemin: string): Promise<Resultat> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  if (!cheminValide(chemin, user.id)) return { erreur: T.avatar.erreur };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_path: chemin }).eq("id", user.id);
  if (error) return { erreur: T.avatar.erreur };
  if (user.avatarPath && user.avatarPath !== chemin) await supabase.storage.from("avatars").remove([user.avatarPath]);
  revalidatePath("/", "layout");
  return {};
}

export async function supprimerAvatar(): Promise<Resultat> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  if (user.avatarPath) await supabase.storage.from("avatars").remove([user.avatarPath]);
  revalidatePath("/", "layout");
  return {};
}

/* ─── Photos de progression ─── */

export async function donnerAccord(formData: FormData) {
  const user = await getUtilisateur();
  if (formData.get("accord") !== "oui") return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ photos_accord: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/photos");
}

export async function enregistrerPhoto(chemin: string, vue: string, date: string): Promise<Resultat> {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const jour = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : null;
  if (!user.photosAccord || !cheminValide(chemin, user.id) || !VUES.includes(vue as Vue) || !jour) return { erreur: T.photos.erreur };
  const supabase = await createClient();
  const { error } = await supabase.from("photos_progression").insert({ user_id: user.id, chemin, vue, prise_le: jour });
  if (error) {
    await supabase.storage.from("progression").remove([chemin]);
    return { erreur: T.photos.erreur };
  }
  revalidatePath("/photos");
  return {};
}

export async function supprimerPhoto(id: string): Promise<Resultat> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  const { data } = await supabase.from("photos_progression").select("chemin").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) return {};
  await supabase.from("photos_progression").delete().eq("id", id).eq("user_id", user.id);
  await supabase.storage.from("progression").remove([data.chemin]);
  revalidatePath("/photos");
  return {};
}

/** Retrait de l'accord : toutes les photos sont supprimées, fichiers compris */
export async function retirerAccord(): Promise<Resultat> {
  const user = await getUtilisateur();
  const supabase = await createClient();
  const { data } = await supabase.from("photos_progression").select("chemin").eq("user_id", user.id);
  const chemins = (data ?? []).map((p) => p.chemin);
  for (let i = 0; i < chemins.length; i += 100) await supabase.storage.from("progression").remove(chemins.slice(i, i + 100));
  await supabase.from("photos_progression").delete().eq("user_id", user.id);
  await supabase.from("profiles").update({ photos_accord: null }).eq("id", user.id);
  revalidatePath("/photos");
  return {};
}
