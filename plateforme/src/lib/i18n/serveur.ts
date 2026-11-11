import "server-only";
import { cookies } from "next/headers";
import { COOKIE_LANG, type Lang } from "./index";

/** Langue de l'utilisateur : français par défaut, anglais seulement s'il l'a choisi (Profil → Langue) */
export async function getLang(): Promise<Lang> {
  const choix = (await cookies()).get(COOKIE_LANG)?.value;
  return choix === "en" ? "en" : "fr";
}
