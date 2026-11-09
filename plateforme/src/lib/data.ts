import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bilan, Categorie, Checkin } from "@/lib/coaching/types";

/* ═══ Couche d'accès aux données ═══
   Toutes les lectures passent par ici. La sécurité réelle est assurée
   par les règles RLS de Supabase ; ces fonctions ne font que lire. */

export type Utilisateur = { id: string; email: string; prenom: string; role: "client" | "coach" };

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

/** Utilisateur connecté, ou redirection vers la connexion */
export const getUtilisateur = cache(async (): Promise<Utilisateur> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/connexion");

  const { data: profil } = await supabase
    .from("profiles")
    .select("prenom, role")
    .eq("id", claims.sub)
    .single();

  return {
    id: claims.sub,
    email: (claims.email as string) ?? "",
    prenom: profil?.prenom ?? "",
    role: profil?.role === "coach" ? "coach" : "client",
  };
});

export const getBilan = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bilans")
    .select("reponses, debut")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? { reponses: data.reponses as Bilan, debut: data.debut as string } : null;
});

export const getHistorique = cache(async (userId: string, limite = 200): Promise<SeanceFaite[]> => {
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
  bilan: { reponses: Bilan; debut: string } | null;
};

/** Tous les clients (RLS : seul le coach voit les autres profils) */
export async function getClients(coachId: string): Promise<ClientResume[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, prenom, created_at, bilans(reponses, debut)")
    .neq("id", coachId)
    .order("prenom");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => {
    const b = Array.isArray(p.bilans) ? p.bilans[0] : p.bilans;
    return {
      id: p.id,
      prenom: p.prenom,
      inscrit_le: p.created_at,
      bilan: b ? { reponses: b.reponses as Bilan, debut: b.debut as string } : null,
    };
  });
}

export async function getClient(id: string): Promise<ClientResume | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, prenom, created_at, bilans(reponses, debut)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const b = Array.isArray(data.bilans) ? data.bilans[0] : data.bilans;
  return {
    id: data.id,
    prenom: data.prenom,
    inscrit_le: data.created_at,
    bilan: b ? { reponses: b.reponses as Bilan, debut: b.debut as string } : null,
  };
}

/** Check-ins des N derniers jours, pour un ou tous les clients */
export async function getCheckinsRecents(jours = 7, userId?: string) {
  const supabase = await createClient();
  const depuis = jourParis(new Date(Date.now() - jours * 864e5));
  let q = supabase.from("checkins").select("user_id, jour, sommeil, energie, corps").gte("jour", depuis).order("jour", { ascending: false });
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q;
  return data ?? [];
}

/** Séances récentes de tous les clients, groupées par client (plus récente en premier) */
export async function getSeancesTousClients(limite = 1000) {
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
