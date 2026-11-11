import type { App } from "./app";
/* ═══ Profils par métier ═══
   Le métier dit QUI est la personne : il règle l'accueil et les onglets.
   Il ne donne aucun droit sur les données — seul un lien « suivi », accepté
   par le sportif, relie un professionnel à quelqu'un (voir migration 0011). */

export const METIERS = ["sportif", "joueur", "coach", "prepa", "entraineur", "kine", "osteo"] as const;
export type Metier = (typeof METIERS)[number];
export type MetierPro = Exclude<Metier, "sportif" | "joueur">;

export const lireMetier = (v: unknown): Metier => (METIERS.includes(v as Metier) ? (v as Metier) : "sportif");
export const estPro = (m: Metier): m is MetierPro => m !== "sportif" && m !== "joueur";

/** Joueur, entraîneur et préparateur physique ont un bilan et des programmes de football */
export const familleDe = (m: Metier): "forme" | "foot" => (m === "joueur" || m === "entraineur" || m === "prepa" ? "foot" : "forme");

/** Onglets de la barre du bas, dans l'ordre (5 au plus) */
export type CleNav = "accueil" | "entrainement" | "seance" | "suivi" | "profil" | "coach" | "pro" | "exercices" | "equipe";

export function ongletsDe(metier: Metier, admin: boolean, app: App = "forme"): CleNav[] {
  if (app === "foot") return ongletsFoot(metier, admin);
  /* Baara (forme) : pas d'équipe ici, elle vit dans Baara Foot */
  return ongletsBase(metier, admin).filter((k) => k !== "equipe").concat(metier === "joueur" && !admin ? ["profil"] : []).slice(0, 5);
}

/** Baara Foot : l'équipe d'abord ; l'entraînement individuel pour ceux qui s'entraînent */
function ongletsFoot(metier: Metier, admin: boolean): CleNav[] {
  if (admin) return ["equipe", "entrainement", "seance", "suivi", "coach"];
  switch (metier) {
    case "joueur":
      return ["accueil", "entrainement", "seance", "suivi", "equipe"];
    case "entraineur":
      return ["equipe", "entrainement", "profil"];
    case "coach":
    case "prepa":
      return ["equipe", "pro", "entrainement", "profil"];
    case "kine":
    case "osteo":
      return ["equipe", "pro", "profil"];
    default:
      /* Président, dirigeant, responsable média… */
      return ["equipe", "profil"];
  }
}

function ongletsBase(metier: Metier, admin: boolean): CleNav[] {
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
export const accueilSansBilan = (metier: Metier, admin: boolean, app: App = "forme") =>
  app === "foot"
    ? (metier === "joueur" ? "/bilan" : "/equipe")
    : admin ? "/coach" : estPro(metier) && metier !== "entraineur" ? "/pro" : "/bilan";
