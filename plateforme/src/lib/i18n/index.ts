/* ═══ Bilingue FR / EN ═══
   - tc() traduit le CONTENU de coaching (clé = texte français du moteur)
   - UI[lang] contient les textes de l'INTERFACE
   Utilisable côté serveur et côté client. */
import { CONTENU_EN } from "./contenu-en";
import { UI_EN, UI_FR, type TextesUI } from "./ui";
import type { Programme } from "@/lib/coaching/types";

export type Lang = "fr" | "en";
export const LANGS: Lang[] = ["fr", "en"];
export const COOKIE_LANG = "ptmouss_lang";
export type TextesUIPhotos = TextesUI["photos"];
export const lireLang = (v: string | undefined | null): Lang => (v === "en" ? "en" : "fr");

/** Textes d'interface dans la langue demandée */
export const ui = (lang: Lang): TextesUI => (lang === "en" ? UI_EN : UI_FR);

/** Traduction d'un texte de contenu (repli sur le français s'il manque) */
export function tc(lang: Lang, s: string | null | undefined): string {
  if (!s) return s ?? "";
  if (lang === "fr") return s;
  return CONTENU_EN[s] ?? s;
}

/** Locale pour dates et nombres */
export const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "fr-FR");

/** Libellé de phase « SEMAINE 4/8 · CYCLE 2 » */
export function labelSemaine(lang: Lang, s: string | undefined): string {
  if (!s || lang === "fr") return s ?? "";
  return s.replace(/SEMAINE/g, "WEEK").replace(/CYCLE/g, "CYCLE");
}

/** Statistiques de phase « 70 % · 10-12 reps · RIR 2-3 » */
function stats(lang: Lang, s: string | undefined) {
  if (!s || lang === "fr") return s;
  return s
    .split(" · ")
    .map((p) => (p.startsWith("Allure : ") ? "Pace: " + tc(lang, p.slice(9)) : tc(lang, p)))
    .join(" · ");
}

/** Programme complet traduit pour l'affichage (les noms d'exercices d'origine restent dans `cle`) */
export function traduireProgramme(P: Programme, lang: Lang): Programme {
  if (lang === "fr") return P;
  return {
    ...P,
    proto: tc(lang, P.proto),
    cle: tc(lang, P.cle),
    marqueur: tc(lang, P.marqueur),
    neat: P.neat && tc(lang, P.neat),
    citation: P.citation && tc(lang, P.citation),
    phase: P.phase && P.phase.split(" — ").map((x, i) => (i === 0 ? labelSemaine(lang, x) : tc(lang, x))).join(" — "),
    phaseNom: P.phaseNom && tc(lang, P.phaseNom),
    stats: stats(lang, P.stats),
    phaseTip: P.phaseTip && tc(lang, P.phaseTip),
    days: P.days.map((d) => ({
      ...d,
      d: tc(lang, d.d),
      f: tc(lang, d.f),
      ex: d.ex.map((e) => ({ ...e, note: tc(lang, e.note), r: tc(lang, e.r).replace(/(\d)\/j\b/g, "$1/leg").replace(/\/côté/g, "/side").replace(/\/bras/g, "/arm").replace(/ pas$/, " steps") })),
    })),
  };
}

/** Une phrase avec les ponctuations françaises (« ! ? : » précédés d'une espace) */
export const nombre = (lang: Lang, n: number) => String(Math.round(n * 100) / 100).replace(".", lang === "fr" ? "," : ".");
