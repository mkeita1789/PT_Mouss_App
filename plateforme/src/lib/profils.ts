/* ═══ Profils par métier ═══
   Le métier dit QUI est la personne : il règle l'accueil et les onglets.
   Il ne donne aucun droit sur les données — seul un lien « suivi », accepté
   par le sportif, relie un professionnel à quelqu'un (voir migration 0011). */

export const METIERS = ["sportif", "joueur", "coach", "prepa", "entraineur", "kine", "osteo"] as const;
export type Metier = (typeof METIERS)[number];
export type MetierPro = Exclude<Metier, "sportif" | "joueur">;

export const lireMetier = (v: unknown): Metier => (METIERS.includes(v as Metier) ? (v as Metier) : "sportif");
export const estPro = (m: Metier): m is MetierPro => m !== "sportif" && m !== "joueur";

/** Onglets de la barre du bas, dans l'ordre (5 au plus) */
export type CleNav = "accueil" | "entrainement" | "seance" | "suivi" | "profil" | "coach" | "pro" | "exercices" | "equipe";

export function ongletsDe(metier: Metier, admin: boolean): CleNav[] {
  if (admin) return ["accueil", "entrainement", "seance", "suivi", "coach"];
  switch (metier) {
    case "coach":
    case "prepa":
      return ["accueil", "entrainement", "seance", "suivi", "pro"];
    case "entraineur":
      return ["equipe", "entrainement", "profil"];
    case "joueur":
      /* Le profil reste accessible par la photo en haut de l'écran */
      return ["accueil", "entrainement", "seance", "suivi", "equipe"];
    case "kine":
    case "osteo":
      return ["pro", "exercices", "profil"];
    default:
      return ["accueil", "entrainement", "seance", "suivi", "profil"];
  }
}

/** Où va quelqu'un qui n'a pas (encore) de bilan d'entraînement */
export const accueilSansBilan = (metier: Metier, admin: boolean) => (admin ? "/coach" : metier === "entraineur" ? "/equipe" : estPro(metier) ? "/pro" : "/bilan");
