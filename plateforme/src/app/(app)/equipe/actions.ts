"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateur } from "@/lib/data";
import { locale, ui, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { envoyerApres, type Abonnement } from "@/lib/push";
import { parisVersISO, serieHebdo, type Reponse, type RoleEquipe, type TypeEvenement } from "@/lib/equipe";

/* La sécurité réelle est dans la base (migration 0013) : seul le staff écrit,
   un joueur ne fait que répondre à ses convocations. Ici on valide la forme. */

export type EtatEquipe = { erreur?: string; ok?: string; n?: number } | undefined;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const txt = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

export async function creerEquipe(_: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  const nom = txt(f, "nom", 60);
  const role = ["entraineur", "adjoint", "prepa"].includes(String(f.get("role"))) ? String(f.get("role")) : "entraineur";
  if (!nom) return { erreur: T.erreur };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creer_equipe", { p_nom: nom, p_saison: txt(f, "saison", 20), p_role: role });
  if (error || typeof data !== "string") return { erreur: T.erreur };
  redirect(`/equipe/${data}`);
}

export async function rejoindreEquipe(_: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  const code = txt(f, "code", 6).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return { erreur: T.codeInconnu };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rejoindre_equipe", { p_code: code });
  const eq = Array.isArray(data) ? data[0] : null;
  if (error || !eq) return { erreur: T.codeInconnu };
  redirect(`/equipe/${eq.id}`);
}

/* ─── Calendrier ─── */
const quand = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(locale(lang), { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export async function ajouterEvenement(equipeId: string, prev: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang).equipe;
  if (!UUID.test(equipeId)) return { erreur: T.erreur };
  const type = (["entrainement", "match", "rdv"].includes(String(f.get("type"))) ? f.get("type") : "entrainement") as TypeEvenement;
  const debutLocal = String(f.get("debut") ?? "");
  const repeter = type === "entrainement" ? String(f.get("jusqua") ?? "") : "";
  const dates = repeter ? serieHebdo(debutLocal, repeter) : [parisVersISO(debutLocal)].filter((d): d is string => !!d);
  if (!dates.length) return { erreur: T.erreur };
  const domicile = type === "match" ? (f.get("domicile") === "non" ? false : true) : null;
  const ligne = {
    equipe_id: equipeId, type,
    titre: type === "rdv" ? txt(f, "titre", 80) || null : null,
    lieu: txt(f, "lieu", 120) || null,
    adversaire: type === "match" ? txt(f, "adversaire", 60) || null : null,
    domicile,
  };
  const supabase = await createClient();
  const { error } = await supabase.from("evenements").insert(dates.map((debut) => ({ ...ligne, debut })));
  if (error) return { erreur: T.erreur };

  /* Les joueurs qui ont un compte et les notifications sont prévenus */
  const { data: abos } = await supabase.rpc("abonnements_equipe", { p_equipe: equipeId });
  envoyerApres((abos ?? []) as Abonnement[], (lg) => {
    const E = ui(lg).equipe;
    const nom = type === "match" && ligne.adversaire ? `${E.types.match} ${E.contre(ligne.adversaire)}` : ligne.titre || E.types[type];
    return dates.length > 1
      ? { titre: E.notifSerie(dates.length), corps: `${E.types.entrainement} · ${quand(dates[0], lg)}${ligne.lieu ? ` · ${ligne.lieu}` : ""}`, url: `/equipe/${equipeId}`, tag: `equipe-${equipeId}` }
      : { titre: E.notifTitre(nom), corps: `${quand(dates[0], lg)}${ligne.lieu ? ` · ${ligne.lieu}` : ""} — ${E.tuViens}`, url: `/equipe/${equipeId}`, tag: `equipe-${equipeId}` };
  });
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: T.ajoute(dates.length), n: (prev?.n ?? 0) + 1 };
}

export async function supprimerEvenement(equipeId: string, evenementId: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(evenementId)) return;
  const supabase = await createClient();
  await supabase.from("evenements").delete().eq("id", evenementId).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
  redirect(`/equipe/${equipeId}`);
}

/** Le joueur répond à sa convocation */
export async function repondre(equipeId: string, evenementId: string, reponse: Reponse): Promise<{ erreur?: string }> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(evenementId) || !["oui", "non", "incertain"].includes(reponse)) return { erreur: T.erreur };
  const supabase = await createClient();
  const { error } = await supabase.rpc("repondre_convocation", { p_evenement: evenementId, p_reponse: reponse });
  if (error) return { erreur: T.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  return {};
}

/** Feuille de présence + score + résumé (staff) */
export async function enregistrerFeuille(
  equipeId: string, evenementId: string,
  lignes: { membre_id: string; present: boolean; minutes: number | null }[],
  infos: { resume: string; score_pour: number | null; score_contre: number | null },
): Promise<EtatEquipe> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(equipeId) || !UUID.test(evenementId) || lignes.length > 80) return { erreur: T.erreur };
  const score = (n: number | null) => (n === null || !Number.isInteger(n) || n < 0 || n > 99 ? null : n);
  const supabase = await createClient();
  const { error: e1 } = await supabase.from("evenements").update({
    resume: String(infos.resume ?? "").trim().slice(0, 1500) || null,
    score_pour: score(infos.score_pour), score_contre: score(infos.score_contre),
  }).eq("id", evenementId).eq("equipe_id", equipeId);
  if (e1) return { erreur: T.erreur };
  const propres = lignes
    .filter((l) => UUID.test(l.membre_id))
    .map((l) => ({
      evenement_id: evenementId, membre_id: l.membre_id, equipe_id: equipeId, present: !!l.present,
      minutes: l.minutes === null || !Number.isFinite(l.minutes) ? null : Math.max(0, Math.min(150, Math.round(l.minutes))),
      maj_le: new Date().toISOString(),
    }));
  if (propres.length) {
    const { error: e2 } = await supabase.from("presences").upsert(propres, { onConflict: "evenement_id,membre_id" });
    if (e2) return { erreur: T.erreur };
  }
  revalidatePath(`/equipe/${equipeId}`);
  revalidatePath(`/equipe/${equipeId}/${evenementId}`);
  return { ok: T.enregistre };
}

/* ─── Effectif ─── */
export async function ajouterFiche(equipeId: string, prev: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  const nom = txt(f, "nom", 60);
  const n = parseInt(String(f.get("numero") ?? ""), 10);
  if (!UUID.test(equipeId) || !nom) return { erreur: T.erreur };
  const supabase = await createClient();
  const { error } = await supabase.from("equipe_membres").insert({
    equipe_id: equipeId, nom, role: "joueur", poste: txt(f, "poste", 30) || null, numero: Number.isInteger(n) && n >= 0 && n <= 99 ? n : null,
  });
  if (error) return { erreur: T.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: "✓", n: (prev?.n ?? 0) + 1 };
}

export async function changerRole(equipeId: string, membreId: string, role: RoleEquipe) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(membreId) || !["entraineur", "adjoint", "prepa", "joueur"].includes(role)) return;
  const supabase = await createClient();
  await supabase.from("equipe_membres").update({ role }).eq("id", membreId).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
}

export async function retirerMembre(equipeId: string, membreId: string, moiMeme: boolean) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(membreId)) return;
  const supabase = await createClient();
  await supabase.from("equipe_membres").delete().eq("id", membreId).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
  revalidatePath("/equipe");
  if (moiMeme) redirect("/equipe");
}
