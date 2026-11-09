"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useTransition } from "react";
import { COOKIE_LANG, ui, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>;
}

/** Langue courante + textes d'interface, pour les composants client */
export function useLang() {
  const lang = use(LangContext);
  return { lang, T: ui(lang) };
}

/** Sélecteur FR / EN — mémorisé un an dans le navigateur */
/* Hors composant : la règle react-hooks interdit de modifier document dans un rendu */
function ecrireCookie(l: Lang) {
  document.cookie = `${COOKIE_LANG}=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function ChoixLangue({ compact = false }: { compact?: boolean }) {
  const { lang, T } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choisir = (l: Lang) => {
    if (l === lang) return;
    ecrireCookie(l);
    start(() => router.refresh());
  };

  return (
    <div className="lang-switch" role="radiogroup" aria-label={T.langue} style={pending ? { opacity: 0.6 } : undefined}>
      {(["fr", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" role="radio" aria-checked={l === lang} className={l === lang ? "on" : ""} onClick={() => choisir(l)}>
          {compact ? l.toUpperCase() : l === "fr" ? "Français" : "English"}
        </button>
      ))}
    </div>
  );
}
