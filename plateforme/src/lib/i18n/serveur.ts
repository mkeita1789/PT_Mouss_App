import "server-only";
import { cookies, headers } from "next/headers";
import { COOKIE_LANG, type Lang } from "./index";

/** Langue de l'utilisateur : son choix (cookie), sinon la langue de son téléphone */
export async function getLang(): Promise<Lang> {
  const choix = (await cookies()).get(COOKIE_LANG)?.value;
  if (choix === "fr" || choix === "en") return choix;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*fr/i.test(accept) || !/^\s*en/i.test(accept) ? "fr" : "en";
}
