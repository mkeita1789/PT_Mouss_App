"use client";

import { useActionState, useEffect, useRef } from "react";
import { demanderChangement, type EtatMot } from "@/app/(app)/coach/actions";
import { useLang } from "./Langue";

/** Demande de changement envoyée à l'auteur des charges */
export function FormDemande({ clientId, destinataireId }: { clientId: string; destinataireId: string }) {
  const { T } = useLang();
  const P = T.plan;
  const [etat, action, pending] = useActionState<EtatMot, FormData>(demanderChangement.bind(null, clientId, destinataireId), undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (etat?.ok) form.current?.reset(); }, [etat]);
  return (
    <form action={action} ref={form} style={{ marginTop: 10 }}>
      <textarea className="input" name="message" rows={3} maxLength={500} required placeholder={P.demandePlaceholder} aria-label={P.demander} style={{ height: "auto", padding: 12, resize: "vertical" }} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending} style={{ marginTop: 10 }}>{pending ? T.auth.unInstant : P.envoyer}</button>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}
