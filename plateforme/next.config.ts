import type { NextConfig } from "next";

/* Appli authentifiée : chaque page dépend de la session (cookies Supabase),
   donc rendu dynamique classique — pas de Cache Components. */
const nextConfig: NextConfig = {
  /* Les téléphones qui avaient installé l'ancienne appli redemandent parfois son manifeste */
  async rewrites() {
    return [{ source: "/manifest.json", destination: "/manifest.webmanifest" }];
  },
};

export default nextConfig;
