import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";
import { DEMO, demo } from "@/lib/demo";

/* ═══ Couche d'accès aux données ═══
   Toutes les lectures passent par ici. La sécurité réelle est assurée
   par les règles RLS de Supabase ; ces fonctions ne font que lire. */

export type Utilisateur = {
  id: string; email: string; prenom: string; role: "client" | "coach";
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
};

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
    .select("prenom, role, avatar_path, photos_accord")
    .eq("id", claims.sub)
    .single();
  const liens = await signer("avatars", [profil?.avatar_path]);

  return {
    id: claims.sub,
    email: (claims.email as string) ?? "",
    prenom: profil?.prenom ?? "",
    role: profil?.role === "coach" ? "coach" : "client",
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
    .select("id, realisee_le, jour_code, focus, phase, allegee, seance_exercices(nom, categorie, charge_kg, series, amrap, cible, note, position)")
    .eq("user_id", userId)
    .order("realisee_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    ...s,
    seance_exercices: [...(s.seance_exercices ?? [])]
      .map((e) => ({ ...e, charge_kg: e.charge_kg === null ? null : Number(e.charge_kg) }) as ExerciceFait)
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
  if (user.role !== "coach") redirect("/");
  return user;
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
    .select("id, user_id, realisee_le, jour_code, focus, phase, allegee, seance_exercices(nom, categorie, charge_kg, series, amrap, cible, note, position)")
    .order("realisee_le", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  const parClient: Record<string, SeanceFaite[]> = {};
  (data ?? []).forEach((s) => {
    (parClient[s.user_id] ||= []).push({
      ...s,
      seance_exercices: [...(s.seance_exercices ?? [])]
        .map((e) => ({ ...e, charge_kg: e.charge_kg === null ? null : Number(e.charge_kg) }) as ExerciceFait)
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
