/* Destinations de retour autorisées après connexion ou inscription (évite les redirections ouvertes) :
   l'import, ou une équipe à rejoindre avec un code d'invitation (/equipe?code=ABC234). */
export const suiteValide = (v: unknown): string | null =>
  typeof v === "string" && (v === "/importer" || /^\/equipe\?code=[A-Z0-9]{6}$/.test(v)) ? v : null;
