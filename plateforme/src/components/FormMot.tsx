"use client";

import { useActionState, useState } from "react";
import { envoyerMot, type EtatMot } from "@/app/(app)/coach/actions";
import { useLang } from "./Langue";

/** Formulaire du coach : écrire un mot à un client */
export function FormMot({ clientId, prenom }: { clientId: string; prenom: string }) {
  const { T } = useLang();
  const [etat, action, pending] = useActionState<EtatMot, FormData>(envoyerMot.bind(null, clientId), undefined);
  const [texte, setTexte] = useState("");
  const [envoisVus, setEnvoisVus] = useState(0);

  /* Après un envoi réussi : on vide le champ (ajustement d'état pendant le rendu, sans effet) */
  if (etat?.n && etat.n !== envoisVus) {
    setEnvoisVus(etat.n);
    setTexte("");
  }

  return (
    <form action={action}>
      <textarea
        name="texte" className="input" rows={3} maxLength={600} required value={texte} onChange={(e) => setTexte(e.target.value)}
        placeholder={T.mot.placeholder(prenom)} style={{ height: "auto", padding: "12px 14px", resize: "vertical", lineHeight: 1.5 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !texte.trim()}>{pending ? T.mot.envoi : T.mot.envoyer}</button>
        <span className="meta" style={{ fontSize: 12.5 }}>{etat?.erreur ? <span className="ko">{etat.erreur}</span> : etat?.ok && !texte ? <span className="ok">{etat.ok}</span> : T.mot.aide}</span>
        <span className="meta num" style={{ marginLeft: "auto", fontSize: 12 }}>{texte.length}/600</span>
      </div>
    </form>
  );
}
