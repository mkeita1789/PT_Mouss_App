/* Thèmes de couleur : choisis par chaque client, mémorisés sur son appareil */
export const THEMES = ["or", "rose", "lilas", "peche", "blush"] as const;
export type Theme = (typeof THEMES)[number];
export const COOKIE_THEME = "ptmouss_theme";

export const lireTheme = (v?: string | null): Theme => (THEMES as readonly string[]).includes(v ?? "") ? (v as Theme) : "or";

/** Aperçu du sélecteur (fond, accent) et couleur de la barre du téléphone */
export const APERCU: Record<Theme, { fond: string; accent: string; barre: string }> = {
  or: { fond: "#111114", accent: "#f2b441", barre: "#060607" },
  rose: { fond: "#1f151a", accent: "#f78fb3", barre: "#0c070a" },
  lilas: { fond: "#1a1724", accent: "#b9a2ff", barre: "#09080e" },
  peche: { fond: "#1d1714", accent: "#ff9b7d", barre: "#0b0807" },
  blush: { fond: "#fbeef3", accent: "#d94f84", barre: "#fcf3f6" },
};
