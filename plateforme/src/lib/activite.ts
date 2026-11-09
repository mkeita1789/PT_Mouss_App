import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Utilisateur } from "@/lib/data";
import { ui, type Lang } from "@/lib/i18n";
import { envoyerApres, type Abonnement } from "@/lib/push";

export type TypeActivite = "debut" | "fin" | "libre";

/** Enregistre l'activité d'un client et prévient le coach sur son téléphone.
    N'échoue jamais : une notification ratée ne doit pas bloquer la séance. */
export async function notifierCoach(user: Utilisateur, type: TypeActivite, jourCode: string | null, detail: (lang: Lang) => string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("activites").insert({ type, jour_code: jourCode?.slice(0, 40) ?? null, detail: detail("fr").slice(0, 200) });
    if (error) return;
    const { data } = await supabase.rpc("abonnements_coachs");
    const prenom = user.prenom || user.email.split("@")[0];
    envoyerApres((data ?? []) as Abonnement[], (lang) => {
      const N = ui(lang).notifs;
      return {
        titre: type === "debut" ? N.debut(prenom) : type === "fin" ? N.fin(prenom) : N.libre(prenom),
        corps: detail(lang),
        url: `/coach/${user.id}`,
        /* Même étiquette : « terminé » remplace « commencé » sur le téléphone du coach */
        tag: `seance-${user.id}`,
      };
    });
  } catch (e) {
    console.error("activité:", (e as Error).message);
  }
}

/** Durée depuis le début signalé de cette séance (dans les 4 dernières heures) */
export async function minutesDepuisDebut(userId: string, jourCode: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activites")
    .select("cree_le")
    .eq("client_id", userId)
    .eq("type", "debut")
    .eq("jour_code", jourCode)
    .gt("cree_le", new Date(Date.now() - 4 * 3600e3).toISOString())
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const min = Math.round((Date.now() - Date.parse(data.cree_le)) / 60000);
  return min >= 1 && min <= 240 ? min : null;
}
