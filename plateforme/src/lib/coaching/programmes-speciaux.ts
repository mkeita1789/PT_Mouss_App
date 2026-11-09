/* ═══ Programmes spéciaux, attribués par le coach ═══
   Réathlétisation LCA, pré-saison football, trêve. Même fonctionnement :
   semaines ouvertes une à une par le coach, séances notées par le client. */
import { CONSEILS_PRESAISON, CONSEILS_TREVE, FICHES_PREPA, PRESAISON, TREVE } from "./prepa-foot";
import { CRITERES_ENTREE, CRITERES_SORTIE, LEXIQUE, REATH_LCA, type SemaineReath, type Txt } from "./reath-lca";

export type IdProgramme = "lca" | "presaison" | "treve";
export const IDS_PROGRAMMES: IdProgramme[] = ["lca", "presaison", "treve"];

export type ProgrammeSpecial = {
  id: IdProgramme;
  titre: { fr: string; en: string };
  lede: { fr: string; en: string };
  semaines: SemaineReath[];
  /* Contrôle du genou (douleur + gonflement) au lieu du ressenti d'effort */
  genou: boolean;
  criteresEntree?: { fr: string[]; en: string[] };
  criteresSortie?: { fr: string[]; en: string[] };
  conseils?: { fr: string[]; en: string[] };
  lexique?: { fr: string[][]; en: string[][] };
};

export const PROGRAMMES: Record<IdProgramme, ProgrammeSpecial> = {
  lca: {
    id: "lca",
    titre: { fr: "Réathlétisation LCA", en: "ACL return to sport" },
    lede: { fr: "Ta reprise après le ligament croisé, semaine par semaine. Ton coach valide chaque passage à la semaine suivante.", en: "Your comeback after the ACL, week by week. Your coach approves each move to the next week." },
    semaines: REATH_LCA,
    genou: true,
    criteresEntree: CRITERES_ENTREE,
    criteresSortie: CRITERES_SORTIE,
    lexique: LEXIQUE,
  },
  presaison: {
    id: "presaison",
    titre: { fr: "Pré-saison football", en: "Football pre-season" },
    lede: { fr: "4 semaines pour arriver prêt à la reprise collective : course, gainage, renforcement, prévention des blessures et mobilité.", en: "4 weeks to be ready for team training: running, core, strength, injury prevention and mobility." },
    semaines: PRESAISON,
    genou: false,
    conseils: CONSEILS_PRESAISON,
  },
  treve: {
    id: "treve",
    titre: { fr: "Trêve hivernale", en: "Winter break" },
    lede: { fr: "Couper sans tout arrêter : quelques jours de récupération, puis 4 séances d'une heure pour bien repartir.", en: "Switch off without stopping everything: a few days of recovery, then 4 one-hour sessions to restart well." },
    semaines: TREVE,
    genou: false,
    conseils: CONSEILS_TREVE,
  },
};

export const lireProgramme = (id: string | null | undefined): ProgrammeSpecial => PROGRAMMES[(id as IdProgramme) ?? "lca"] ?? PROGRAMMES.lca;

/** Consigne d'un exercice de circuit, s'il en a une */
export const consigne = (t: Txt) => FICHES_PREPA[typeof t === "string" ? t : t.fr];
