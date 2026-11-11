"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateur } from "@/lib/data";
import { locale, ui, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { envoyerApres, type Abonnement } from "@/lib/push";
import { LIGNES, nettoyerComposition, nettoyerReseaux, parisVersISO, ROLES_INVITES, serieHebdo, telephoneValide, tempsDeJeu, type CibleMessage, type Composition, type MatchFait, type Reponse, type RoleEquipe, type TypeEvenement } from "@/lib/equipe";

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
  const { data: abos } = await supabase.rpc("abonnements_equipe", { p_equipe: equipeId, p_parents: true });
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
  if (!UUID.test(equipeId) || !UUID.test(membreId) || !["entraineur", "adjoint", "prepa", "media", "president", "dirigeant", "joueur"].includes(role)) return;
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

/* ─── Identité du club (staff) ─── */
const HEX = /^#[0-9a-fA-F]{6}$/;
export async function modifierClub(equipeId: string, _: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  const nom = txt(f, "nom", 60);
  const c1 = String(f.get("couleur1") ?? ""), c2 = String(f.get("couleur2") ?? "");
  if (!UUID.test(equipeId) || !nom) return { erreur: T.erreur };
  const supabase = await createClient();
  const { error } = await supabase.from("equipes").update({
    nom, saison: txt(f, "saison", 20) || null,
    couleur1: HEX.test(c1) ? c1 : null, couleur2: HEX.test(c2) ? c2 : null,
    valeurs: txt(f, "valeurs", 1000) || null,
  }).eq("id", equipeId);
  if (error) return { erreur: T.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  revalidatePath("/equipe");
  return { ok: T.clubEnregistre };
}

/** Logo déjà envoyé dans le stockage (dossier de l'équipe) : on l'enregistre, ou on le retire (chemin null) */
export async function definirLogo(equipeId: string, chemin: string | null): Promise<{ erreur?: string }> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(equipeId) || (chemin !== null && !new RegExp(`^${equipeId}/logo-[0-9a-f-]{36}\\.(jpg|png)$`).test(chemin))) return { erreur: T.erreur };
  const supabase = await createClient();
  const { data: avant } = await supabase.from("equipes").select("logo_path").eq("id", equipeId).maybeSingle();
  const { error } = await supabase.from("equipes").update({ logo_path: chemin }).eq("id", equipeId);
  if (error) return { erreur: T.erreur };
  if (avant?.logo_path && avant.logo_path !== chemin) await supabase.storage.from("equipes").remove([avant.logo_path]);
  revalidatePath(`/equipe/${equipeId}`);
  return {};
}

/** Photo d'un membre (staff ou responsable média), avec l'accord de la personne */
export async function definirPhotoMembre(equipeId: string, membreId: string, chemin: string | null, accord: boolean): Promise<{ erreur?: string }> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(equipeId) || !UUID.test(membreId)) return { erreur: T.erreur };
  if (chemin !== null && (!accord || !new RegExp(`^${equipeId}/membres/${membreId}-[0-9a-f-]{36}\\.jpg$`).test(chemin))) return { erreur: T.erreur };
  const supabase = await createClient();
  const { data: avant } = await supabase.from("equipe_membres").select("photo_path").eq("id", membreId).maybeSingle();
  const { error } = await supabase.rpc("definir_photo_membre", { p_membre: membreId, p_chemin: chemin, p_accord: accord });
  if (error) return { erreur: T.erreur };
  if (avant?.photo_path && avant.photo_path !== chemin) await supabase.storage.from("equipes").remove([avant.photo_path]);
  revalidatePath(`/equipe/${equipeId}`);
  return {};
}

/* ─── Composition (staff) ─── */
export async function enregistrerComposition(equipeId: string, evenementId: string | null, c: Composition): Promise<EtatEquipe> {
  await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang).equipe;
  if (!UUID.test(equipeId) || (evenementId !== null && !UUID.test(evenementId))) return { erreur: T.erreur };
  const supabase = await createClient();
  const { data: membres } = await supabase.from("equipe_membres").select("id").eq("equipe_id", equipeId);
  const propre = nettoyerComposition(c, new Set((membres ?? []).map((m) => m.id)));
  const { data: avant } = evenementId
    ? await supabase.from("compositions").select("publiee").eq("equipe_id", equipeId).eq("evenement_id", evenementId).maybeSingle()
    : await supabase.from("compositions").select("publiee").eq("equipe_id", equipeId).is("evenement_id", null).maybeSingle();
  const { error } = await supabase.from("compositions").upsert(
    { equipe_id: equipeId, evenement_id: evenementId, ...propre, maj_le: new Date().toISOString() },
    { onConflict: "equipe_id,evenement_id" },
  );
  if (error) return { erreur: T.erreur };

  /* Première publication d'une compo de match : les joueurs sont prévenus */
  if (propre.publiee && !avant?.publiee && evenementId) {
    const { data: e } = await supabase.from("evenements").select("type, adversaire, titre, debut").eq("id", evenementId).maybeSingle();
    const { data: abos } = await supabase.rpc("abonnements_equipe", { p_equipe: equipeId });
    envoyerApres((abos ?? []) as Abonnement[], (lg) => {
      const E = ui(lg).equipe;
      const nom = e?.type === "match" && e.adversaire ? `${E.types.match} ${E.contre(e.adversaire)}` : e?.titre || E.types[(e?.type as TypeEvenement) ?? "match"];
      return { titre: E.notifCompo(nom), corps: e ? quand(e.debut, lg) : "", url: `/equipe/${equipeId}/${evenementId}`, tag: `compo-${evenementId}` };
    });
  }
  revalidatePath(evenementId ? `/equipe/${equipeId}/${evenementId}` : `/equipe/${equipeId}`);
  return { ok: propre.publiee ? T.compoPubliee : T.compoEnregistree };
}

/* ─── Invitations du staff (entraîneur) ─── */
export async function creerInvitation(equipeId: string, role: string): Promise<{ code?: string; erreur?: string }> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(equipeId) || !(ROLES_INVITES as readonly string[]).includes(role)) return { erreur: T.erreur };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creer_invitation_equipe", { p_equipe: equipeId, p_role: role });
  if (error || typeof data !== "string") return { erreur: T.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  return { code: data };
}

export async function annulerInvitation(equipeId: string, code: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !/^[A-Z0-9]{6}$/.test(code)) return;
  const supabase = await createClient();
  await supabase.from("equipe_invitations").delete().eq("code", code).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
}

/* ─── Messages aux membres ─── */
export async function envoyerMessageEquipe(equipeId: string, prev: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  const user = await getUtilisateur();
  const T = ui(await getLang()).equipe;
  const cible = String(f.get("cible") ?? "tous") as CibleMessage;
  const texte = txt(f, "texte", 1000);
  const destinataires = cible === "selection" ? f.getAll("destinataires").map(String).filter((x) => UUID.test(x)).slice(0, 60) : [];
  if (!UUID.test(equipeId) || !["tous", "joueurs", "staff", "selection"].includes(cible) || !texte || (cible === "selection" && !destinataires.length)) return { erreur: T.messageVide };
  const supabase = await createClient();
  const { data: moi } = await supabase.from("equipe_membres").select("nom, role").eq("equipe_id", equipeId).eq("user_id", user.id).maybeSingle();
  if (!moi) return { erreur: T.erreur };
  const { data, error } = await supabase.from("equipe_messages")
    .insert({ equipe_id: equipeId, auteur_nom: (moi.nom || user.prenom || "Coach").slice(0, 60), auteur_role: moi.role, cible, destinataires, texte })
    .select("id").single();
  if (error || !data) return { erreur: T.erreur };
  const { data: abos } = await supabase.rpc("abonnements_message", { p_message: data.id });
  envoyerApres((abos ?? []) as Abonnement[], (lg) => {
    const E = ui(lg).equipe;
    return { titre: E.notifMessage(moi.nom, E.roles[moi.role as RoleEquipe] ?? ""), corps: texte.length > 160 ? texte.slice(0, 157) + "…" : texte, url: `/equipe/${equipeId}?vue=messages`, tag: `msg-${equipeId}` };
  });
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: T.messageEnvoye, n: (prev?.n ?? 0) + 1 };
}

export async function supprimerMessageEquipe(equipeId: string, id: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("equipe_messages").delete().eq("id", id);
  revalidatePath(`/equipe/${equipeId}`);
}

/* ─── Le joueur accepte le suivi du préparateur de l'équipe ─── */
export async function accepterSuiviEquipe(equipeId: string, proMembreId: string): Promise<{ erreur?: string; ok?: string }> {
  await getUtilisateur();
  const T = ui(await getLang()).equipe;
  if (!UUID.test(equipeId) || !UUID.test(proMembreId)) return { erreur: T.erreur };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accepter_suivi_equipe", { p_equipe: equipeId, p_pro_membre: proMembreId });
  if (error) return { erreur: T.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  revalidatePath("/profil");
  return { ok: T.suiviAccepte };
}


/* ═══ Club complet (migration 0018) ═══ */
const nomEvenement = (e: { type: string; adversaire: string | null; titre: string | null } | null, lg: Lang) => {
  const E = ui(lg).equipe;
  return e?.type === "match" && e.adversaire ? `${E.types.match} ${E.contre(e.adversaire)}` : e?.titre || E.types[(e?.type as TypeEvenement) ?? "match"];
};

/** Contact du club : numéro à appeler, qui répond, réseaux sociaux */
export async function modifierContact(equipeId: string, _: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  await getUtilisateur();
  const C = ui(await getLang()).club;
  if (!UUID.test(equipeId)) return { erreur: C.telInvalide };
  const tel = txt(f, "telephone", 20);
  if (tel && !telephoneValide(tel)) return { erreur: C.telInvalide };
  const reseaux = nettoyerReseaux(Object.fromEntries(f.entries()));
  const supabase = await createClient();
  const { error } = await supabase.from("equipes").update({ telephone: tel || null, contact_nom: txt(f, "contact_nom", 60) || null, reseaux }).eq("id", equipeId);
  if (error) return { erreur: ui(await getLang()).equipe.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: C.contactEnregistre };
}

/** Code parents (créé à la première demande) */
export async function obtenirCodeParents(equipeId: string): Promise<{ code?: string; erreur?: string }> {
  await getUtilisateur();
  if (!UUID.test(equipeId)) return { erreur: "?" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("code_parents", { p_equipe: equipeId });
  if (error || typeof data !== "string") return { erreur: ui(await getLang()).equipe.erreur };
  revalidatePath(`/equipe/${equipeId}`);
  return { code: data };
}

/** Ligne de jeu d'un joueur (pour les consignes par ligne) */
export async function changerLigne(equipeId: string, membreId: string, ligne: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(membreId)) return;
  const supabase = await createClient();
  await supabase.from("equipe_membres").update({ ligne: (LIGNES as readonly string[]).includes(ligne) ? ligne : null }).eq("id", membreId).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
}

/** Convocation : liste des joueurs convoqués ; les nouveaux convoqués sont prévenus */
export async function convoquer(equipeId: string, evenementId: string, membres: string[]): Promise<EtatEquipe> {
  await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  if (!UUID.test(equipeId) || !UUID.test(evenementId)) return { erreur: T.equipe.erreur };
  const supabase = await createClient();
  const { data: joueurs } = await supabase.from("equipe_membres").select("id").eq("equipe_id", equipeId).eq("role", "joueur");
  const valides = new Set((joueurs ?? []).map((m) => m.id));
  const liste = [...new Set(membres)].filter((m) => valides.has(m)).slice(0, 60);
  const { data: avant } = await supabase.from("evenements").select("convoques, type, adversaire, titre, debut").eq("id", evenementId).eq("equipe_id", equipeId).maybeSingle();
  if (!avant) return { erreur: T.equipe.erreur };
  const { error } = await supabase.from("evenements").update({ convoques: liste }).eq("id", evenementId).eq("equipe_id", equipeId);
  if (error) return { erreur: T.equipe.erreur };
  const nouveaux = liste.filter((m) => !(avant.convoques ?? []).includes(m));
  if (nouveaux.length) {
    const { data: abos } = await supabase.rpc("abonnements_membres", { p_equipe: equipeId, p_membres: nouveaux });
    envoyerApres((abos ?? []) as Abonnement[], (lg) => ({
      titre: ui(lg).club.notifConvocation(nomEvenement(avant, lg)), corps: quand(avant.debut, lg),
      url: `/equipe/${equipeId}/${evenementId}`, tag: `convoc-${evenementId}`,
    }));
  }
  revalidatePath(`/equipe/${equipeId}/${evenementId}`);
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: T.club.convocationEnvoyee(liste.length) };
}

/* Temps de jeu recalculé depuis la composition du match et les remplacements (le staff peut toujours corriger) */
async function recalculerTempsDeJeu(supabase: Awaited<ReturnType<typeof createClient>>, equipeId: string, evenementId: string) {
  const [{ data: compo }, { data: faits }, { data: e }] = await Promise.all([
    supabase.from("compositions").select("titulaires").eq("equipe_id", equipeId).eq("evenement_id", evenementId).maybeSingle(),
    supabase.from("match_faits").select("id, evenement_id, type, membre_id, membre2_id, minute").eq("evenement_id", evenementId),
    supabase.from("evenements").select("duree").eq("id", evenementId).maybeSingle(),
  ]);
  if (!compo) return;
  const titulaires = Object.values((compo.titulaires ?? {}) as Record<string, string>);
  const minutes = tempsDeJeu(titulaires, (faits ?? []) as MatchFait[], e?.duree ?? 90);
  const lignes = Object.entries(minutes).map(([membre_id, m]) => ({ evenement_id: evenementId, membre_id, equipe_id: equipeId, minutes: m, present: true, maj_le: new Date().toISOString() }));
  if (lignes.length) await supabase.from("presences").upsert(lignes, { onConflict: "evenement_id,membre_id" });
}

/** Feuille de match : un fait (but, carton, remplacement) ; un carton prévient le joueur et le staff */
export async function ajouterFait(equipeId: string, evenementId: string, _: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  const moi = await getUtilisateur();
  const T = ui(await getLang());
  const type = String(f.get("type"));
  const m1 = String(f.get("membre") ?? ""), m2 = String(f.get("membre2") ?? "");
  const minute = Number(f.get("minute"));
  if (!UUID.test(equipeId) || !UUID.test(evenementId) || !["but", "jaune", "rouge", "remplacement"].includes(type) || !UUID.test(m1)) return { erreur: T.equipe.erreur };
  if (type === "remplacement" && (!UUID.test(m2) || m2 === m1)) return { erreur: T.equipe.erreur };
  const supabase = await createClient();
  const { data, error } = await supabase.from("match_faits").insert({
    equipe_id: equipeId, evenement_id: evenementId, type, membre_id: m1,
    membre2_id: (type === "but" || type === "remplacement") && UUID.test(m2) && m2 !== m1 ? m2 : null,
    minute: Number.isInteger(minute) && minute >= 0 && minute <= 130 ? minute : null, cree_par: moi.id,
  }).select("id").single();
  if (error || !data) return { erreur: T.equipe.erreur };
  if (type === "jaune" || type === "rouge") {
    const [{ data: abos }, { data: j }, { data: e }] = await Promise.all([
      supabase.rpc("abonnements_carton", { p_fait: data.id }),
      supabase.from("equipe_membres").select("nom").eq("id", m1).maybeSingle(),
      supabase.from("evenements").select("type, adversaire, titre").eq("id", evenementId).maybeSingle(),
    ]);
    envoyerApres((abos ?? []) as Abonnement[], (lg) => {
      const C = ui(lg).club;
      return { titre: C.notifCarton(C.types[type], j?.nom ?? "", nomEvenement(e, lg)), corps: Number.isInteger(minute) ? `${minute}'` : "", url: `/equipe/${equipeId}/${evenementId}`, tag: `carton-${data.id}` };
    });
  }
  if (type === "remplacement" || type === "rouge") await recalculerTempsDeJeu(supabase, equipeId, evenementId);
  revalidatePath(`/equipe/${equipeId}/${evenementId}`);
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: T.club.faitAjoute };
}

export async function supprimerFait(equipeId: string, evenementId: string, faitId: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(evenementId) || !UUID.test(faitId)) return;
  const supabase = await createClient();
  await supabase.from("match_faits").delete().eq("id", faitId).eq("equipe_id", equipeId);
  await recalculerTempsDeJeu(supabase, equipeId, evenementId);
  revalidatePath(`/equipe/${equipeId}/${evenementId}`);
  revalidatePath(`/equipe/${equipeId}`);
}

/** Durée du match (pour le temps de jeu) */
export async function changerDuree(equipeId: string, evenementId: string, duree: number) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(evenementId) || !Number.isInteger(duree) || duree < 20 || duree > 130) return;
  const supabase = await createClient();
  await supabase.from("evenements").update({ duree }).eq("id", evenementId).eq("equipe_id", equipeId);
  await recalculerTempsDeJeu(supabase, equipeId, evenementId);
  revalidatePath(`/equipe/${equipeId}/${evenementId}`);
}

/** Tactique : principe de jeu, consigne ou séquence vidéo (lien) pour l'équipe, une ligne ou un joueur */
export async function ajouterTactique(equipeId: string, _: EtatEquipe, f: FormData): Promise<EtatEquipe> {
  const moi = await getUtilisateur();
  const T = ui(await getLang());
  const genre = String(f.get("genre")), cible = String(f.get("cible"));
  const ligne = String(f.get("ligne") ?? ""), membre = String(f.get("membre") ?? "");
  const titre = txt(f, "titre", 80), texte = txt(f, "texte", 3000), url = txt(f, "url", 500);
  if (!UUID.test(equipeId) || !["principe", "consigne", "video"].includes(genre) || !["equipe", "ligne", "joueur"].includes(cible) || !titre) return { erreur: T.equipe.erreur };
  if (cible === "ligne" && !(LIGNES as readonly string[]).includes(ligne)) return { erreur: T.equipe.erreur };
  if (cible === "joueur" && !UUID.test(membre)) return { erreur: T.equipe.erreur };
  let lien: string | null = null;
  if (url) { try { const u = new URL(url); if (u.protocol !== "https:") throw 0; lien = u.toString(); } catch { return { erreur: T.club.lienInvalide }; } }
  if (genre === "video" && !lien) return { erreur: T.club.lienInvalide };
  const supabase = await createClient();
  const { data: auteur } = await supabase.from("equipe_membres").select("nom").eq("equipe_id", equipeId).eq("user_id", moi.id).maybeSingle();
  const { data, error } = await supabase.from("tactiques").insert({
    equipe_id: equipeId, genre, cible, ligne: cible === "ligne" ? ligne : null, membre_id: cible === "joueur" ? membre : null,
    titre, texte: texte || null, url: lien, auteur_nom: auteur?.nom ?? moi.prenom ?? "Staff", cree_par: moi.id,
  }).select("id").single();
  if (error || !data) return { erreur: T.equipe.erreur };
  const { data: abos } = await supabase.rpc("abonnements_tactique", { p_id: data.id });
  envoyerApres((abos ?? []) as Abonnement[], (lg) => {
    const C = ui(lg).club;
    return { titre: C.notifTactique(C.genres[genre], titre), corps: texte.slice(0, 120), url: `/equipe/${equipeId}?vue=tactique`, tag: `tactique-${data.id}` };
  });
  revalidatePath(`/equipe/${equipeId}`);
  return { ok: T.club.tactiqueAjoutee };
}

export async function supprimerTactique(equipeId: string, id: string) {
  await getUtilisateur();
  if (!UUID.test(equipeId) || !UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("tactiques").delete().eq("id", id).eq("equipe_id", equipeId);
  revalidatePath(`/equipe/${equipeId}`);
}
