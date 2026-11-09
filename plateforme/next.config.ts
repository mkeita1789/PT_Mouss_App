import type { NextConfig } from "next";

/* Appli authentifiée : chaque page dépend de la session (cookies Supabase),
   donc rendu dynamique classique — pas de Cache Components. */
const nextConfig: NextConfig = {};

export default nextConfig;
