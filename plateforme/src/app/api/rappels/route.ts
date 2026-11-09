import { createClient } from "@supabase/supabase-js";
import { envoyer, type Abonnement } from "@/lib/push";

/* ═══ Rappels automatiques — appelé chaque jour par la tâche planifiée de Vercel ═══
   • cliente sans séance depuis 3 jours (et sans douleur signalée) : un rappel motivant ;
   • le dimanche : le récap de la semaine.
   La base choisit les destinataires et note chaque envoi : jamais deux fois le même message. */

type Ligne = Abonnement & { user_id: string; type: "inactif" | "recap"; prenom: string; jours: number; seances: number; objectif: number };

const MESSAGES = {
  fr: {
    inactif: (l: Ligne) => ({ titre: `On t'attend, ${l.prenom || "championne"} 💪`, corps: `${l.jours} jours sans séance. Ta prochaine séance est prête : on s'y remet aujourd'hui ?` }),
    recap: (l: Ligne) =>
      l.seances >= l.objectif
        ? { titre: `Semaine validée : ${l.seances}/${l.objectif} séances 🔥`, corps: "Ta série continue. Repose-toi bien, on remet ça lundi." }
        : { titre: `Ta semaine : ${l.seances}/${l.objectif} séances`, corps: `Nouvelle semaine demain : objectif ${l.objectif} séances. Tu peux le faire 💪` },
  },
  en: {
    inactif: (l: Ligne) => ({ titre: `We're waiting for you, ${l.prenom || "champ"} 💪`, corps: `${l.jours} days without a workout. Your next session is ready: back at it today?` }),
    recap: (l: Ligne) =>
      l.seances >= l.objectif
        ? { titre: `Week completed: ${l.seances}/${l.objectif} workouts 🔥`, corps: "Your streak goes on. Rest well, we go again Monday." }
        : { titre: `Your week: ${l.seances}/${l.objectif} workouts`, corps: `New week tomorrow: target ${l.objectif} workouts. You've got this 💪` },
  },
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Non autorisé", { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("rappels_du_jour", { p_secret: secret });
  if (error) {
    console.error("rappels:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  const lignes = (data ?? []) as Ligne[];
  const morts: string[] = [];
  for (const l of lignes) {
    const lang = l.lang === "en" ? "en" : "fr";
    const m = MESSAGES[lang][l.type](l);
    morts.push(...(await envoyer([l], () => ({ titre: m.titre, corps: m.corps, url: l.type === "recap" ? "/suivi" : "/seance", tag: `rappel-${l.type}` }))));
  }
  if (morts.length) await supabase.rpc("oublier_abonnements", { p_secret: secret, p_endpoints: morts });

  return Response.json({ ok: true, envoyes: lignes.length - morts.length });
}
