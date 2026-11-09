import "server-only";
import { after } from "next/server";
import webpush from "web-push";
import type { Lang } from "@/lib/i18n";

/* ═══ Notifications (Web Push) ═══
   L'envoi part APRÈS la réponse (after) : la cliente n'attend jamais
   la notification du coach pour voir sa séance enregistrée. */

export type Abonnement = { endpoint: string; p256dh: string; auth: string; lang: string };
export type MessagePush = { titre: string; corps: string; url: string; tag?: string };

const SUJET = "https://pt-mouss-app.vercel.app";

function configure(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(SUJET, pub, priv);
  return true;
}

/** Envoie un message à chaque téléphone, dans sa langue. Ne bloque jamais l'action. */
export async function envoyer(abos: Abonnement[], message: (lang: Lang) => MessagePush): Promise<string[]> {
  if (!abos.length || !configure()) return [];
  const morts: string[] = [];
  await Promise.allSettled(
    abos.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          JSON.stringify(message(a.lang === "en" ? "en" : "fr")),
          { TTL: 6 * 3600, urgency: "high" },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        /* Téléphone désabonné ou réinstallé : on oubliera ce lien */
        if (code === 404 || code === 410) morts.push(a.endpoint);
        else console.error("push:", code ?? (e as Error).message);
      }
    }),
  );
  return morts;
}

/** Même chose, mais après la réponse au client */
export function envoyerApres(abos: Abonnement[], message: (lang: Lang) => MessagePush, nettoyer?: (morts: string[]) => Promise<void>) {
  if (!abos.length) return;
  after(async () => {
    const morts = await envoyer(abos, message);
    if (morts.length && nettoyer) await nettoyer(morts).catch(() => {});
  });
}
