/* Deux applis, un seul code et une seule base :
   - Baara (forme) : maison, salle ou les deux ; chacun choisit sa couleur
   - Baara Foot (club) : équipe, calendrier, compo, staff ; aux couleurs du club
   L'appli est choisie d'après l'adresse (BAARA_APP=foot|forme pour forcer en local). */
export type App = "forme" | "foot";
export const URL_FORME = "https://pt-mouss-app.vercel.app";
export const URL_FOOT = "https://baara-foot.vercel.app";

export function appDeHote(hote: string | null | undefined): App {
  const force = process.env.BAARA_APP;
  if (force === "foot" || force === "forme") return force;
  const h = (hote ?? "").split(":")[0].toLowerCase();
  return h.startsWith("baara-foot") || h.startsWith("foot.") ? "foot" : "forme";
}

export const NOM_APP: Record<App, string> = { forme: "Baara", foot: "Baara Foot" };
