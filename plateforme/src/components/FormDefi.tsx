"use client";

import { useActionState, useState } from "react";
import { creerDefi, type EtatDefi } from "@/app/(app)/coach/actions";
import { tc } from "@/lib/i18n";
import { useLang } from "./Langue";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Lancer un défi : nombre de séances ou charge à atteindre, pour une cliente ou toutes */
export function FormDefi({ clients, exercices }: { clients: { id: string; prenom: string }[]; exercices: string[] }) {
  const { lang, T } = useLang();
  const M = T.motiv;
  const [type, setType] = useState<"seances" | "charge">("seances");
  const [etat, action, pending] = useActionState<EtatDefi, FormData>(creerDefi, undefined);
  const auj = new Date();

  return (
    <details className="panel" open={false}>
      <summary className="link" style={{ cursor: "pointer", fontSize: 14.5 }}>+ {M.lancerDefi}</summary>
      <form action={action} key={etat?.n ?? 0} style={{ marginTop: 12 }}>
        <label className="field" style={{ marginTop: 0 }}>
          <span>{M.titreDefi}</span>
          <input name="titre" className="input" maxLength={80} required placeholder={lang === "en" ? "e.g. 12 workouts before Christmas" : "ex. 12 séances avant Noël"} />
        </label>
        <div className="lang-switch" role="radiogroup" style={{ marginTop: 14 }}>
          {(["seances", "charge"] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={type === t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t === "seances" ? M.typeSeances : M.typeCharge}</button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
        <div className="defi-champs">
          {type === "charge" && (
            <label className="field">
              <span>{M.exercice}</span>
              <select name="exercice" className="input" required>
                {exercices.map((e) => <option key={e} value={e}>{tc(lang, e)}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            <span>{M.cible} ({type === "seances" ? M.seancesUnite : M.kgUnite})</span>
            <input name="cible" className="input num" inputMode="decimal" required placeholder={type === "seances" ? "12" : "80"} />
          </label>
          <label className="field">
            <span>{M.pour}</span>
            <select name="client" className="input" defaultValue="">
              <option value="">{M.toutes}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.prenom || "—"}</option>)}
            </select>
          </label>
          <label className="field"><span>{M.du}</span><input type="date" name="debut" className="input" defaultValue={iso(auj)} required /></label>
          <label className="field"><span>{M.au}</span><input type="date" name="fin" className="input" defaultValue={iso(new Date(auj.getTime() + 28 * 864e5))} required /></label>
        </div>
        {etat?.erreur && <p className="form-err" style={{ marginTop: 10 }}>{etat.erreur}</p>}
        <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} disabled={pending}>{M.lancer}</button>
      </form>
    </details>
  );
}
