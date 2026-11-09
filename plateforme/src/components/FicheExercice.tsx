"use client";

import { useState } from "react";
import { EXDB } from "@/lib/coaching/exdb";

/** Nom d'exercice cliquable qui ouvre sa fiche détaillée */
export function FicheExercice({ nom }: { nom: string }) {
  const [ouvert, setOuvert] = useState(false);
  const e = EXDB[nom];

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        style={{ background: "none", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer", borderBottom: "1px dotted var(--gold-line)" }}
      >
        {nom}
      </button>
      {ouvert && (
        <div className="modal-back" onClick={(ev) => ev.target === ev.currentTarget && setOuvert(false)}>
          <div className="modal" role="dialog" aria-label={`Fiche ${nom}`}>
            <button className="modal-x" type="button" onClick={() => setOuvert(false)} aria-label="Fermer">✕</button>
            <div className="modal-h">{nom}</div>
            {!e ? (
              <div style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, padding: "10px 0" }}>
                Fiche détaillée bientôt disponible. En attendant, demande à Moustapha.
              </div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <div className="ex-tags" style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 10px" }}>
                  {e.groupe} · {e.diff} · {e.materiel}
                </div>
                {e.video && (
                  <a className="btn s" href={e.video} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center", marginBottom: 12 }}>
                    ▶ Voir la vidéo
                  </a>
                )}
                <div className="eyebrow">Muscles</div>
                <div><b>Principaux :</b> {e.primaires}<br /><b>Secondaires :</b> {e.secondaires}</div>
                <div className="eyebrow">Exécution</div>
                <div><b>Départ :</b> {e.depart}</div>
                <div style={{ marginTop: 6 }}><b>Arrivée :</b> {e.arrivee}</div>
                <div style={{ marginTop: 6, color: "var(--muted)" }}>Tempo {e.tempo} · Repos {e.repos}</div>
                <div className="eyebrow">Points clés</div>
                {e.points.map((p) => <div key={p}>✓ {p}</div>)}
                <div className="eyebrow">Erreurs fréquentes</div>
                {e.erreurs.map((p) => <div key={p} style={{ color: "var(--muted)" }}>✗ {p}</div>)}
                <div className="card gold" style={{ marginTop: 14 }}>💬 {e.coach}</div>
                <div className="eyebrow">Variantes</div>
                <div>Débutant : {e.variantes.deb}<br />Intermédiaire : {e.variantes.int}<br />Avancé : {e.variantes.av}</div>
                <div style={{ marginTop: 8, color: "var(--muted)" }}>Alternatives : {e.alternatives}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
