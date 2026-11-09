"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import type { TextesUI } from "@/lib/i18n/ui";

export type EtatForm = { erreur?: string; ok?: string } | undefined;

/* Seule destination de retour autorisée après connexion (évite les redirections ouvertes) */
const suiteSure = (v: FormDataEntryValue | null) => (v === "/importer" ? "/importer" : null);

const traduire = (msg: string, T: TextesUI) => {
  if (/invalid login credentials/i.test(msg)) return T.erreurs.identifiants;
  if (/email not confirmed/i.test(msg)) return T.erreurs.nonConfirme;
  if (/already registered|already exists/i.test(msg)) return T.erreurs.existe;
  if (/password/i.test(msg) && /characters|short|weak/i.test(msg)) return T.erreurs.motDePasseFaible;
  if (/rate limit/i.test(msg)) return T.erreurs.tropDeTentatives;
  return T.erreurs.generique;
};

export async function connexion(_: EtatForm, formData: FormData): Promise<EtatForm> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const T = ui(await getLang());
  if (!email || !password) return { erreur: T.erreurs.champsConnexion };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { erreur: traduire(error.message, T) };
  redirect(suiteSure(formData.get("suite")) ?? "/");
}

export async function inscription(_: EtatForm, formData: FormData): Promise<EtatForm> {
  const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const T = ui(await getLang());
  if (!prenom || !email) return { erreur: T.erreurs.champsInscription };
  if (password.length < 8) return { erreur: T.erreurs.motDePasseCourt };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { erreur: traduire(error.message, T) };

  /* Confirmation d'email désactivée dans Supabase → session immédiate */
  if (data.session) redirect(suiteSure(formData.get("suite")) ?? "/bilan");
  return { ok: T.erreurs.compteCree };
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
