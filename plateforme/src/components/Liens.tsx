"use client";

import { useActionState, useState, useTransition } from "react";
import { changerMetier, rejoindre, type EtatLien } from "@/app/(app)/profil/liens";
import { estPro, METIERS, type Metier } from "@/lib/profils";
import { useLang } from "./Langue";

/** Choix du profil : enregistré dès qu'on touche une carte */
export function ChoixMetier({ actuel }: { actuel: Metier }) {
  const { T } = useLang();
  const M = T.metiers;
  const [metier, setMetier] = useState(actuel);
  const [etat, setEtat] = useState<EtatLien>();
  const [pending, start] = useTransition();
  const choisir = (m: Metier) => {
    if (m === metier || pending) return;
    const avant = metier;
    setMetier(m);
    start(async () => {
      const r = await changerMetier(m);
      setEtat(r);
      if (r?.erreur) setMetier(avant);
    });
  };
  const groupes: [string, Metier[]][] = [[M.jePratique, METIERS.filter((m) => !estPro(m))], [M.jeSuisPro, METIERS.filter(estPro)]];
  return (
    <fieldset className="metiers" style={{ marginTop: 0 }} disabled={pending}>
      <legend className="sr-only">{M.question}</legend>
      {groupes.map(([titre, liste]) => (
        <div key={titre}>
          <div className="metiers-groupe">{titre}</div>
          <div className="metiers-grille">
            {liste.map((m) => (
              <label key={m} className={`metier ${metier === m ? "on" : ""}`}>
                <input type="radio" name="metier" value={m} checked={metier === m} onChange={() => choisir(m)} />
                <b>{M.noms[m]}</b>
                <span>{M.sous[m]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </fieldset>
  );
}

/** Entrer le code d'un professionnel pour être relié à lui */
export function FormCode({ initial }: { initial?: string }) {
  const { T } = useLang();
  const M = T.metiers;
  const [etat, action, pending] = useActionState<EtatLien, FormData>(rejoindre, undefined);
  return (
    <form action={action} style={{ marginTop: 14 }}>
      <label className="field" style={{ marginTop: 0 }}>
        <span>{M.code}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input code-input" name="code" required minLength={6} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="ABC234" defaultValue={initial} />
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? T.auth.unInstant : M.rejoindre}</button>
        </div>
      </label>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}
