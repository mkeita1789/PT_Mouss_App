"use client";

import { useState } from "react";
import { inscrireReath } from "@/app/(app)/reathletisation/actions";
import { IDS_PROGRAMMES, PROGRAMMES, type IdProgramme } from "@/lib/coaching/programmes-speciaux";
import { useLang } from "./Langue";

/** Attribuer un programme spécial : choix du programme, critères d'entrée (LCA), date de début */
export function InscriptionProgramme({ clientId, ouvert = false }: { clientId: string; ouvert?: boolean }) {
  const { lang, T } = useLang();
  const R = T.reath;
  const [id, setId] = useState<IdProgramme>("presaison");
  const prog = PROGRAMMES[id];

  return (
    <details className="panel" open={ouvert}>
      <summary className="link" style={{ cursor: "pointer", fontSize: 14.5 }}>+ {R.inscrireGen}</summary>
      <form action={inscrireReath.bind(null, clientId)} style={{ marginTop: 12 }}>
        <div className="meta">{R.choisir}</div>
        <div className="prog-choix">
          {IDS_PROGRAMMES.map((p) => (
            <label key={p} className={`prog-opt${id === p ? " on" : ""}`}>
              <input type="radio" name="programme" value={p} checked={id === p} onChange={() => setId(p)} />
              <b>{PROGRAMMES[p].titre[lang]}</b>
              <span>{PROGRAMMES[p].semaines.length} {lang === "en" ? "weeks" : "semaines"}</span>
            </label>
          ))}
        </div>
        <p className="meta" style={{ fontSize: 13 }}>{prog.lede[lang]}</p>
        {prog.criteresEntree && (
          <>
            <div className="meta" style={{ marginTop: 12 }}>{R.criteresEntree}</div>
            <div className="criteres">
              {prog.criteresEntree[lang].map((c) => (
                <label key={c} className="accord-case"><input type="checkbox" name="critere" value={c} required /><span>{c}</span></label>
              ))}
            </div>
          </>
        )}
        <label className="field" style={{ maxWidth: 220 }}>
          <span>{R.debut}</span>
          <input type="date" name="debut" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>{R.attribuer}</button>
        {prog.criteresEntree && <p className="meta" style={{ marginTop: 8, fontSize: 12.5 }}>{R.criteresAide}</p>}
      </form>
    </details>
  );
}
