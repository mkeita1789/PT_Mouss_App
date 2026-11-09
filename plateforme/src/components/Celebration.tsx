"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { NouveauRecord } from "@/lib/coaching/motivation";
import { tc } from "@/lib/i18n";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

/* Pluie de confettis (respecte « réduire les animations ») */
export function confettis(emojis = ["🏆", "🔥", "💪", "⭐", "✨"]) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 26; i++) {
    const e = document.createElement("div");
    e.className = "confetti";
    e.textContent = emojis[i % emojis.length];
    e.style.left = 5 + Math.random() * 90 + "%";
    e.style.top = 50 + Math.random() * 35 + "%";
    e.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 2200);
  }
  if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 160]);
}

/** Fin de séance avec record(s) battu(s) : on célèbre avant de passer à la progression */
export function CelebrationRecords({ records, onFin }: { records: NouveauRecord[]; onFin: () => void }) {
  const { lang, T } = useLang();
  const M = T.motiv;
  const kg = (n: number) => String(n).replace(".", lang === "fr" ? "," : ".");
  useEffect(() => { confettis(); }, []);

  return createPortal(
    <div className="sheet-back" style={{ alignItems: "center" }}>
      <div className="sheet celebration" role="dialog" aria-modal="true" aria-label={M.nouveauRecord}>
        <div className="celebration-trophee" aria-hidden>🏆</div>
        <h2>{records.length > 1 ? M.nouveauxRecords(records.length) : M.nouveauRecord}</h2>
        <ul className="celebration-liste">
          {records.map((r) => (
            <li key={r.nom}>
              <b>{tc(lang, r.nom)}</b>
              <span className="num">{M.recordLigne(kg(r.kg), kg(r.avant))}</span>
              <span className="ok num">+{kg(Math.round((r.kg - r.avant) * 10) / 10)} kg</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary btn-block" autoFocus onClick={onFin}>
          {M.continuer} <Icon nom="fleche" taille={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
