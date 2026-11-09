"use client";

import { useEffect, useState } from "react";
import { EXDB } from "@/lib/coaching/exdb";
import { EXDB_EN } from "@/lib/coaching/exdb-en";
import { tc } from "@/lib/i18n";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

/** Nom d'exercice cliquable qui ouvre sa fiche détaillée.
    `nom` est l'identifiant d'origine (français) ; l'affichage suit la langue. */
export function FicheExercice({ nom }: { nom: string }) {
  const { lang, T } = useLang();
  const [ouvert, setOuvert] = useState(false);
  const e = lang === "en" ? (EXDB_EN[nom] ?? EXDB[nom]) : EXDB[nom];
  const libelle = tc(lang, nom);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert]);

  return (
    <>
      <button type="button" className="ex-link ex-name" onClick={() => setOuvert(true)}>{libelle}</button>
      {ouvert && (
        <div className="sheet-back" onClick={(ev) => ev.target === ev.currentTarget && setOuvert(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={libelle}>
            <button className="sheet-close" type="button" onClick={() => setOuvert(false)} aria-label={T.fiche.fermer} autoFocus>
              <Icon nom="plus" taille={18} />
            </button>
            {e && <div className="meta">{e.groupe} · {e.diff}</div>}
            <h2 style={{ marginTop: 6, paddingRight: 44 }}>{libelle}</h2>
            {!e ? (
              <p style={{ marginTop: 12 }}>{T.fiche.bientot}</p>
            ) : (
              <>
                <p style={{ marginTop: 10 }}>{e.materiel} · {T.fiche.tempo} {e.tempo} · {T.fiche.repos} {e.repos}</p>
                {e.video && (
                  <a className="btn btn-ghost btn-sm" href={e.video} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14 }}>
                    <Icon nom="video" taille={17} /> {T.fiche.video}
                  </a>
                )}
                <div className="note note-gold" style={{ marginTop: 18 }}>
                  <span className="note-icon">M</span>
                  <div>{e.coach}</div>
                </div>
                <h3>{T.fiche.muscles}</h3>
                <p><b style={{ color: "var(--ink)" }}>{T.fiche.principaux}</b> {e.primaires}. <b style={{ color: "var(--ink)" }}>{T.fiche.secondaires}</b> {e.secondaires}.</p>
                <h3>{T.fiche.depart}</h3>
                <p>{e.depart}</p>
                <h3>{T.fiche.arrivee}</h3>
                <p>{e.arrivee}</p>
                <h3>{T.fiche.points}</h3>
                <ul>{e.points.map((p) => <li key={p}><Icon nom="check" taille={16} className="ok" /> {p}</li>)}</ul>
                <h3>{T.fiche.erreurs}</h3>
                <ul>{e.erreurs.map((p) => <li key={p}><Icon nom="alerte" taille={16} className="ko" /> {p}</li>)}</ul>
                <h3>{T.fiche.niveau}</h3>
                <ul>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>{T.fiche.deb}</b> {e.variantes.deb}</li>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>{T.fiche.int}</b> {e.variantes.int}</li>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>{T.fiche.av}</b> {e.variantes.av}</li>
                </ul>
                <h3>{T.fiche.alternatives}</h3>
                <p>{e.alternatives}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
