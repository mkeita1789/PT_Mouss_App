"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { APERCU, COOKIE_THEME, THEMES, type Theme } from "@/lib/theme";
import { useLang } from "./Langue";

/* Hors composant : la règle react-hooks interdit de modifier document dans un rendu */
function appliquer(t: Theme) {
  document.cookie = `${COOKIE_THEME}=${t}; path=/; max-age=31536000; samesite=lax`;
  if (t === "or") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", APERCU[t].barre);
}

/** Sélecteur de couleurs : le changement est immédiat, sans recharger la page */
export function ChoixTheme({ actuel }: { actuel: Theme }) {
  const { T } = useLang();
  const router = useRouter();
  const [choix, setChoix] = useState(actuel);
  const [, start] = useTransition();

  const choisir = (t: Theme) => {
    if (t === choix) return;
    appliquer(t);
    setChoix(t);
    start(() => router.refresh());
  };

  return (
    <div className="themes" role="radiogroup" aria-label={T.theme.titre}>
      {THEMES.map((t) => (
        <button key={t} type="button" role="radio" aria-checked={t === choix} className={`theme-opt${t === choix ? " on" : ""}`} onClick={() => choisir(t)}>
          <span className="theme-swatch" style={{ background: APERCU[t].fond, ["--sw" as string]: APERCU[t].accent }} />
          {T.theme.noms[t]}
        </button>
      ))}
    </div>
  );
}
