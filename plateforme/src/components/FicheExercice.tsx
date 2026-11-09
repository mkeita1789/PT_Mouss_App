"use client";

import { useEffect, useState } from "react";
import { EXDB } from "@/lib/coaching/exdb";
import { Icon } from "./Icon";

/** Nom d'exercice cliquable qui ouvre sa fiche détaillée */
export function FicheExercice({ nom }: { nom: string }) {
  const [ouvert, setOuvert] = useState(false);
  const e = EXDB[nom];

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert]);

  return (
    <>
      <button type="button" className="ex-link ex-name" onClick={() => setOuvert(true)}>{nom}</button>
      {ouvert && (
        <div className="sheet-back" onClick={(ev) => ev.target === ev.currentTarget && setOuvert(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={`Fiche ${nom}`}>
            <button className="sheet-close" type="button" onClick={() => setOuvert(false)} aria-label="Fermer" autoFocus>
              <Icon nom="plus" taille={18} className="" />
            </button>
            {e && <div className="meta">{e.groupe} · {e.diff}</div>}
            <h2 style={{ marginTop: 6, paddingRight: 44 }}>{nom}</h2>
            {!e ? (
              <p style={{ marginTop: 12 }}>Fiche détaillée bientôt disponible. En attendant, demande à Moustapha.</p>
            ) : (
              <>
                <p style={{ marginTop: 10 }}>{e.materiel} · tempo {e.tempo} · repos {e.repos}</p>
                {e.video && (
                  <a className="btn btn-ghost btn-sm" href={e.video} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14 }}>
                    <Icon nom="video" taille={17} /> Voir la vidéo
                  </a>
                )}
                <div className="note note-gold" style={{ marginTop: 18 }}>
                  <span className="note-icon">M</span>
                  <div>{e.coach}</div>
                </div>
                <h3>Muscles</h3>
                <p><b style={{ color: "var(--ink)" }}>Principaux :</b> {e.primaires}. <b style={{ color: "var(--ink)" }}>Secondaires :</b> {e.secondaires}.</p>
                <h3>Position de départ</h3>
                <p>{e.depart}</p>
                <h3>Position d'arrivée</h3>
                <p>{e.arrivee}</p>
                <h3>Points clés</h3>
                <ul>{e.points.map((p) => <li key={p}><Icon nom="check" taille={16} className="ok" /> {p}</li>)}</ul>
                <h3>Erreurs fréquentes</h3>
                <ul>{e.erreurs.map((p) => <li key={p}><Icon nom="alerte" taille={16} className="ko" /> {p}</li>)}</ul>
                <h3>Selon ton niveau</h3>
                <ul>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>Débutant</b> {e.variantes.deb}</li>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>Intermédiaire</b> {e.variantes.int}</li>
                  <li><b style={{ color: "var(--ink)", minWidth: 96 }}>Avancé</b> {e.variantes.av}</li>
                </ul>
                <h3>Alternatives</h3>
                <p>{e.alternatives}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
