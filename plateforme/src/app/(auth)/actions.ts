"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatForm = { erreur?: string; ok?: string } | undefined;

/* Seule destination de retour autorisée après connexion (évite les redirections ouvertes) */
const suiteSure = (v: FormDataEntryValue | null) => (v === "/importer" ? "/importer" : null);

const traduire = (msg: string) => {
  if (/invalid login credentials/i.test(msg)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Confirme d'abord ton email : clique sur le lien reçu.";
  if (/already registered|already exists/i.test(msg)) return "Un compte existe déjà avec cet email. Connecte-toi.";
  if (/password/i.test(msg) && /characters|short|weak/i.test(msg)) return "Mot de passe trop faible : 8 caractères minimum.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives. Réessaie dans quelques minutes.";
  return "Une erreur est survenue. Réessaie.";
};

export async function connexion(_: EtatForm, formData: FormData): Promise<EtatForm> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { erreur: "Renseigne ton email et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { erreur: traduire(error.message) };
  redirect(suiteSure(formData.get("suite")) ?? "/");
}

export async function inscription(_: EtatForm, formData: FormData): Promise<EtatForm> {
  const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 40);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!prenom || !email) return { erreur: "Prénom et email sont obligatoires." };
  if (password.length < 8) return { erreur: "Mot de passe trop court : 8 caractères minimum." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { erreur: traduire(error.message) };

  /* Confirmation d'email désactivée dans Supabase → session immédiate */
  if (data.session) redirect(suiteSure(formData.get("suite")) ?? "/bilan");
  return { ok: "Compte créé ! Ouvre l'email de confirmation que tu viens de recevoir, puis connecte-toi." };
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
