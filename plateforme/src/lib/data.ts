import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";
import { DEMO, demo } from "@/lib/demo";
import { estPro, lireMetier, type Metier, type MetierPro } from "@/lib/profils";
import { avancementDefi, badges, records, serieSemaines, type AvancementDefi, type Badge, type Defi, type RecordExo, type Serie } from "@/lib/coaching/motivation";

/* ═══ Couche d'accès aux données ═══
   Toutes les lectures passent par ici. La sécurité réelle est assurée
   par les règles RLS de Supabase ; ces fonctions ne font que lire. */

export type Utilisateur = {
  id: string; email: string; prenom: string; role: "client" | "coach";
  /** Qui est la personne (accueil, onglets). Ne donne aucun droit : voir src/lib/profils.ts */
  metier: Metier;
  avatar: string | null;          // lien signé (1 h) vers la photo de profil
  avatarPath: string | null;
  photosAccord: string | null;    // date de l'accord pour les photos de progression
};

export type Bucket = "avatars" | "progression";
const DUREE_LIEN = 3600;

/** Liens signés de courte durée pour des fichiers privés (RLS vérifiée par Supabase) */
async function signer(bucket: Bucket, chemins: (string | null | undefined)[]): Promise<Record<string, string>> {
  const liste = [...new Set(chemins.filter((c): c is string => !!c))];
  if (!liste.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(liste, DUREE_LIEN);
  const out: Record<string, string> = {};
  (data ?? []).forEach((d) => { if (d.path && d.signedUrl) out[d.path] = d.signedUrl; });
  return out;
}

export type ExerciceFait = {
  nom: string;
  categorie: Categorie;
  charge_kg: number | null;
  series: number;
  amrap: number | null;
  cible: number | null;
  note: string | null;
  position: number;
  /** Charge fixée par le coach, et raison si la cliente s'en est écartée */
  charge_prevue?: number | null;
  ecart?: Ecart | null;
};
export type Ecart = "douleur" | "lourd" | "facile" | "materiel";

export type SeanceFaite = {
  id: string;
  realisee_le: string;
  jour_code: string;
  focus: string | null;
  phase: string | null;
  allegee: boolean;
  seance_exercices: ExerciceFait[];
};

/** Date du jour à Paris (AAAA-MM-JJ) — le serveur tourne en UTC */
export function jourParis(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
}

/** Utilisateur connecté ou null, sans redirection (pages publiques) */
export async function getUtilisateurOuNull(): Promise<{ id: string; prenom: string } | null> {
  if (DEMO) return demo.utilisateur();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? { id: data.claims.sub, prenom: "" } : null;
}

/** Utilisateur connecté, ou redirection vers la connexion */
export const getUtilisateur = cache(async (): Promise<Utilisateur> => {
  if (DEMO) return demo.utilisateur();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/connexion");

  const { data: profil } = await supabase
    .from("profiles")
    .select("prenom, role, metier, avatar_path, photos_accord")
    .eq("id", claims.sub)
    .single();
  const liens = await signer("avatars", [profil?.avatar_path]);

  return {
    id: claims.sub,
    email: (claims.email as string) ?? "",
    prenom: profil?.prenom ?? "",
    role: profil?.role === "coach" ? "coach" : "client",
    metier: lireMetier(profil?.metier),
    avatar: profil?.avatar_path ? liens[profil.avatar_path] ?? null : null,
    avatarPath: profil?.avatar_path ?? null,
    photosAccord: profil?.photos_accord ?? null,
  };
});

export const getBilan = cache(async (userId: string) => {
  if (DEMO) return demo.bilan(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("bilans")
    .select("reponses, debut")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? { reponses: data.reponses as Bilan, debut: data.debut as string } : null;
});

export const getHistorique = cache(async (userId: string, limite = 200): Promise<SeanceFaite[]> => {
  if (DEMO) return demo.historique(userId).slice(0, limite);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seances")
    .select("id, realisee_le, jour_code, focus, phase, allegee, seance_exercices(nom, categorie, charge_kg, series, amrap, cible, note, position, charge_prevue, ecart)")
    .eq("user_id", userId)
    .order("realisee_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    ...s,
    seance_exercices: [...(s.seance_exercices ?? [])]
      .map((e) => ({ ...e, charge_kg: e.charge_kg === null ? null : Number(e.charge_kg), charge_prevue: e.charge_prevue == null ? null : Number(e.charge_prevue) }) as ExerciceFait)
      .sort((a, b) => a.position - b.position),
  })) as SeanceFaite[];
});

export const getCheckinDuJour = cache(async (userId: string): Promise<Checkin | null> => {
  if (DEMO) return demo.checkinDuJour(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("checkins")
    .select("sommeil, energie, corps")
    .eq("user_id", userId)
    .eq("jour", jourParis())
    .maybeSingle();
  return data ?? null;
});

/* ═══ Espace coach ═══ */

/** Garde : réservé au coach */
export async function exigerCoach(): Promise<Utilisateur> {
  const user = await getUtilisateur();
  if (user.role !== "coach") redirect(estPro(user.metier) ? "/pro" : "/");
  return user;
}

/** Peut-on suivre ce sportif ? Le coach historique, ou un coach / préparateur qu'il a accepté.
    (Les règles de la base vérifient la même chose : ceci ne sert qu'à afficher la bonne page.) */
export async function exigerAccesSportif(sportifId: string): Promise<Utilisateur & { admin: boolean }> {
  const user = await getUtilisateur();
  if (user.role === "coach") return { ...user, admin: true };
  if (!estPro(user.metier)) redirect("/");
  if (DEMO) return { ...user, admin: false };
  const supabase = await createClient();
  const { data } = await supabase.from("suivis").select("sportif_id").eq("pro_id", user.id).eq("sportif_id", sportifId).in("metier_pro", ["coach", "prepa"]).maybeSingle();
  if (!data) redirect("/pro");
  return { ...user, admin: false };
}

export type ClientResume = {
  id: string;
  prenom: string;
  inscrit_le: string;
  avatar: string | null;
  bilan: { reponses: Bilan; debut: string } | null;
};

/** Tous les clients (RLS : seul le coach voit les autres profils) */
export async function getClients(coachId: string): Promise<ClientResume[]> {
  if (DEMO) return demo.clients();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, prenom, created_at, avatar_path, bilans(reponses, debut)")
    .neq("id", coachId)
    .order("prenom");
  if (error) throw new Error(error.message);
  const liens = await signer("avatars", (data ?? []).map((p) => p.avatar_path));
  return (data ?? []).map((p) => {
    const b = Array.isArray(p.bilans) ? p.bilans[0] : p.bilans;
    return {
      id: p.id,
      prenom: p.prenom,
      inscrit_le: p.created_at,
      avatar: p.avatar_path ? liens[p.avatar_path] ?? null : null,
      bilan: b ? { reponses: b.reponses as Bilan, debut: b.debut as string } : null,
    };
  });
}

export async function getClient(id: string): Promise<ClientResume | null> {
  if (DEMO) return demo.client(id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, prenom, created_at, avatar_path, bilans(reponses, debut)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const liens = await signer("avatars", [data.avatar_path]);
  const b = Array.isArray(data.bilans) ? data.bilans[0] : data.bilans;
  return {
    id: data.id,
    prenom: data.prenom,
    inscrit_le: data.created_at,
    avatar: data.avatar_path ? liens[data.avatar_path] ?? null : null,
    bilan: b ? { reponses: b.reponses as Bilan, debut: b.debut as string } : null,
  };
}

/** Check-ins des N derniers jours, pour un ou tous les clients */
export async function getCheckinsRecents(jours = 7, userId?: string) {
  if (DEMO) return demo.checkins(userId);
  const supabase = await createClient();
  const depuis = jourParis(new Date(Date.now() - jours * 864e5));
  let q = supabase.from("checkins").select("user_id, jour, sommeil, energie, corps").gte("jour", depuis).order("jour", { ascending: false });
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q;
  return data ?? [];
}

/** Séances récentes de tous les clients, groupées par client (plus récente en premier) */
export async function getSeancesTousClients(limite = 1000) {
  if (DEMO) return demo.seancesTous() as Record<string, SeanceFaite[]>;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seances")
    .select("id, user_id, realisee_le, jour_code, focus, phase, allegee, seance_exercices(nom, categorie, charge_kg, series, amrap, cible, note, position, charge_prevue, ecart)")
    .order("realisee_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  const parClient: Record<string, SeanceFaite[]> = {};
  (data ?? []).forEach((s) => {
    (parClient[s.user_id] ||= []).push({
      ...s,
      seance_exercices: [...(s.seance_exercices ?? [])]
        .map((e) => ({ ...e, charge_kg: e.charge_kg === null ? null : Number(e.charge_kg), charge_prevue: e.charge_prevue == null ? null : Number(e.charge_prevue) }) as ExerciceFait)
        .sort((a, b) => a.position - b.position),
    } as SeanceFaite);
  });
  return parClient;
}

/** Charges successives par exercice (ordre chronologique) */
export function chargesParExercice(historique: SeanceFaite[]) {
  const map: Record<string, { date: string; kg: number; amrap: number | null; cible: number | null }[]> = {};
  [...historique].reverse().forEach((s) =>
    s.seance_exercices.forEach((e) => {
      if (e.charge_kg === null) return;
      (map[e.nom] ||= []).push({ date: s.realisee_le, kg: e.charge_kg, amrap: e.amrap, cible: e.cible });
    }),
  );
  return map;
}


/* ═══ Mot du coach ═══ */

export type MotCoach = { id: string; texte: string; cree_le: string; coach: { prenom: string; avatar: string | null } };

/** Mots du coach pour un client (le plus récent en premier) */
export async function getMots(clientId: string, limite = 5): Promise<MotCoach[]> {
  if (DEMO) return demo.mots(clientId).slice(0, limite);
  const supabase = await createClient();
  const { data } = await supabase
    .from("mots_coach")
    .select("id, texte, cree_le, coach:profiles!mots_coach_coach_id_fkey(prenom, avatar_path)")
    .eq("client_id", clientId)
    .order("cree_le", { ascending: false })
    .limit(limite);
  const lignes = (data ?? []).map((m) => ({ ...m, coach: (Array.isArray(m.coach) ? m.coach[0] : m.coach) as { prenom: string; avatar_path: string | null } | null }));
  const liens = await signer("avatars", lignes.map((m) => m.coach?.avatar_path));
  return lignes.map((m) => ({
    id: m.id,
    texte: m.texte,
    cree_le: m.cree_le,
    coach: { prenom: m.coach?.prenom ?? "", avatar: m.coach?.avatar_path ? liens[m.coach.avatar_path] ?? null : null },
  }));
}

/** Le dernier mot du coach reste affiché 3 semaines sur l'accueil */
export function motRecent(mots: MotCoach[], maintenant = Date.now()): MotCoach | null {
  const m = mots[0];
  return m && maintenant - Date.parse(m.cree_le) < 21 * 864e5 ? m : null;
}

/* ═══ Photos de progression ═══ */

export type Vue = "face" | "profil" | "dos";
export const VUES: Vue[] = ["face", "profil", "dos"];
export type PhotoProgression = { id: string; chemin: string; vue: Vue; prise_le: string; url: string | null };

export async function getPhotos(userId: string): Promise<PhotoProgression[]> {
  if (DEMO) return demo.photos(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos_progression")
    .select("id, chemin, vue, prise_le")
    .eq("user_id", userId)
    .order("prise_le", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);
  const liens = await signer("progression", (data ?? []).map((p) => p.chemin));
  return (data ?? []).map((p) => ({ ...p, vue: p.vue as Vue, url: liens[p.chemin] ?? null }));
}

/* ═══ Fil d'activité (coach) ═══ */

export type Activite = { id: string; type: "debut" | "fin" | "libre"; jour_code: string | null; detail: string | null; cree_le: string; client: { id: string; prenom: string; avatar: string | null } };

export async function getActivites(limite = 12): Promise<Activite[]> {
  if (DEMO) return demo.activites();
  const supabase = await createClient();
  const { data } = await supabase
    .from("activites")
    .select("id, type, jour_code, detail, cree_le, client_id, client:profiles!activites_client_id_fkey(prenom, avatar_path)")
    .order("cree_le", { ascending: false })
    .limit(limite);
  const lignes = (data ?? []).map((a) => ({ ...a, client: (Array.isArray(a.client) ? a.client[0] : a.client) as { prenom: string; avatar_path: string | null } | null }));
  const liens = await signer("avatars", lignes.map((a) => a.client?.avatar_path));
  return lignes.map((a) => ({
    id: a.id,
    type: a.type as Activite["type"],
    jour_code: a.jour_code,
    detail: a.detail,
    cree_le: a.cree_le,
    client: { id: a.client_id, prenom: a.client?.prenom ?? "", avatar: a.client?.avatar_path ? liens[a.client.avatar_path] ?? null : null },
  }));
}

/* ═══ Réathlétisation ═══ */

export type Reath = { programme: string; semaine: number; debut: string; vma: number | null };
export type ReathSeance = { semaine: number; jour: number; douleur: number | null; gonflement: boolean; rpe: number | null; note: string | null; fait_le: string };

export async function getReath(clientId: string): Promise<Reath | null> {
  if (DEMO) return demo.reath(clientId);
  const supabase = await createClient();
  const { data } = await supabase.from("reath").select("programme, semaine, debut, vma").eq("client_id", clientId).maybeSingle();
  return data ? { ...data, vma: data.vma === null ? null : Number(data.vma) } : null;
}

export async function getReathSeances(clientId: string): Promise<ReathSeance[]> {
  if (DEMO) return demo.reathSeances(clientId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("reath_seances")
    .select("semaine, jour, douleur, gonflement, rpe, note, fait_le")
    .eq("client_id", clientId)
    .order("fait_le", { ascending: false });
  return data ?? [];
}

/* ═══ Motivation ═══ */

/** Défis visibles (coach : tous ; client : les siens et ceux pour toutes). Vide si la table n'existe pas encore. */
export async function getDefis(): Promise<Defi[]> {
  if (DEMO) return demo.defis();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("defis")
    .select("id, client_id, titre, type, exercice, cible, debut, fin")
    .order("fin", { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []).map((d) => ({ ...d, cible: Number(d.cible) })) as Defi[];
}

export type Motivation = {
  serie: Serie;
  records: RecordExo[];
  badges: Badge[];
  defis: { defi: Defi; av: AvancementDefi }[];
};

/** Tout ce qui motive une cliente : série, records, badges, défis en cours */
export const getMotivation = cache(async (userId: string, objectif: number, cycles: number): Promise<Motivation> => {
  const [historique, reathSeances, checkins, defis] = await Promise.all([getHistorique(userId, 500), getReathSeances(userId), getCheckinsRecents(120, userId), getDefis()]);
  const autres = reathSeances.map((r) => r.fait_le);
  const dates = [...historique.map((h) => h.realisee_le), ...autres];
  const pauses = checkins.filter((c) => /douleur/i.test(c.corps)).map((c) => c.jour + "T12:00:00Z");
  const serie = serieSemaines(dates, objectif, pauses);
  const recs = records(historique);
  const miens = defis.filter((d) => d.client_id === null || d.client_id === userId).map((defi) => ({ defi, av: avancementDefi(defi, historique, autres) }));
  return {
    serie,
    records: recs,
    badges: badges({
      seances: dates.length,
      records: recs.reduce((n, r) => n + r.nbRecords, 0),
      meilleureSerie: serie.meilleure,
      cycles,
      defisReussis: miens.filter((x) => x.av.reussi).length,
    }),
    defis: miens,
  };
});

/** Séances des programmes spéciaux de tous les clients (dates seulement), pour le coach */
export async function getReathDatesTous(): Promise<Record<string, string[]>> {
  if (DEMO) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("reath_seances").select("client_id, fait_le").limit(5000);
  const out: Record<string, string[]> = {};
  (data ?? []).forEach((r) => (out[r.client_id] ||= []).push(r.fait_le));
  return out;
}

/* ─── Charges imposées par le coach ─── */
export type ChargeImposee = { id: string; exercice: string; jour_code: string | null; lundi: string; charge: number };

/** Charges du coach pour une cliente, à partir d'un lundi (AAAA-MM-JJ) */
export async function getChargesImposees(clientId: string, depuis?: string, jusqua?: string): Promise<ChargeImposee[]> {
  if (DEMO) return demo.chargesImposees();
  const supabase = await createClient();
  let q = supabase.from("charges_imposees").select("id, exercice, jour_code, lundi, charge").eq("client_id", clientId);
  if (depuis) q = q.gte("lundi", depuis);
  if (jusqua) q = q.lte("lundi", jusqua);
  const { data, error } = await q.order("lundi").limit(500);
  if (error) return [];
  return (data ?? []).map((c) => ({ ...c, charge: Number(c.charge) }));
}

/* ─── Professionnels et sportifs liés (table suivis) ─── */
export type Lie = { id: string; prenom: string; metier: Metier; metierPro: MetierPro; depuis: string };

/** Professionnel (métier déclaré), hors coach historique qui a son propre espace */
export async function exigerPro(): Promise<Utilisateur> {
  const user = await getUtilisateur();
  if (user.role === "coach") redirect("/coach");
  if (!estPro(user.metier)) redirect("/");
  return user;
}

async function lies(colonneMoi: "pro_id" | "sportif_id", moi: string): Promise<Lie[]> {
  const autre = colonneMoi === "pro_id" ? "sportif_id" : "pro_id";
  const supabase = await createClient();
  const { data: liens, error } = await supabase.from("suivis").select("pro_id, sportif_id, metier_pro, cree_le").eq(colonneMoi, moi).order("cree_le", { ascending: false }).limit(500);
  if (error || !liens?.length) return [];
  const ids = liens.map((l) => l[autre] as string);
  const { data: profils } = await supabase.from("profiles").select("id, prenom, metier").in("id", ids);
  const par = new Map((profils ?? []).map((p) => [p.id, p]));
  return liens.map((l) => {
    const p = par.get(l[autre] as string);
    return { id: l[autre] as string, prenom: p?.prenom ?? "", metier: lireMetier(p?.metier), metierPro: l.metier_pro as MetierPro, depuis: l.cree_le as string };
  });
}

/** Les sportifs qui ont accepté d'être suivis par ce professionnel */
export async function getMesSportifs(proId: string): Promise<Lie[]> {
  if (DEMO) return demo.sportifs();
  return lies("pro_id", proId);
}

/** Les professionnels que ce sportif a acceptés */
export async function getMesPros(sportifId: string): Promise<Lie[]> {
  if (DEMO) return demo.pros();
  return lies("sportif_id", sportifId);
}

/** Code d'invitation personnel du professionnel (créé au premier appel) */
export async function getCodeInvitation(): Promise<string | null> {
  if (DEMO) return "BAARA7";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mon_code_invitation");
  return error || typeof data !== "string" ? null : data;
}

/** À qui appartient un code d'invitation (page d'inscription, avant d'avoir un compte) */
export async function getInvitation(code: string): Promise<{ prenom: string; metier: MetierPro } | null> {
  if (!/^[A-Za-z0-9]{6}$/.test(code)) return null;
  if (DEMO) return { prenom: "Moustapha", metier: "coach" };
  const supabase = await createClient();
  const { data } = await supabase.rpc("invitation_info", { p_code: code });
  const l = Array.isArray(data) ? data[0] : null;
  return l && estPro(lireMetier(l.metier)) ? { prenom: l.prenom ?? "", metier: l.metier as MetierPro } : null;
}

/** Bilans de plusieurs sportifs (fréquence visée, prénom) — limités par les règles de la base */
export async function getBilans(ids: string[]): Promise<Record<string, Bilan>> {
  if (!ids.length) return {};
  if (DEMO) return Object.fromEntries(ids.map((id) => [id, demo.bilan(id)?.reponses]).filter(([, b]) => b)) as Record<string, Bilan>;
  const supabase = await createClient();
  const { data } = await supabase.from("bilans").select("user_id, reponses").in("user_id", ids);
  return Object.fromEntries((data ?? []).map((b) => [b.user_id, b.reponses as Bilan]));
}
