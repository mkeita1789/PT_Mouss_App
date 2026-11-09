"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connexion, inscription, type EtatForm } from "@/app/(auth)/actions";
import { useLang } from "./Langue";

export function FormAuth({ mode, suite }: { mode: "connexion" | "inscription"; suite?: string }) {
  const action = mode === "connexion" ? connexion : inscription;
  const [etat, formAction, pending] = useActionState<EtatForm, FormData>(action, undefined);
  const insc = mode === "inscription";
  const { T } = useLang();

  return (
    <form action={formAction} className="reveal">
      {suite === "/importer" && <input type="hidden" name="suite" value="/importer" />}
      <h1 className="page-title" style={{ fontSize: 38 }}>{insc ? T.auth.titreInscription : T.auth.titreConnexion}</h1>
      <p className="page-lede" style={{ marginBottom: 12 }}>
        {insc ? T.auth.ledeInscription : T.auth.ledeConnexion}
      </p>

      {insc && (
        <label className="field">
          <span>{T.auth.prenom}</span>
          <input className="input" name="prenom" autoComplete="given-name" required maxLength={40} />
        </label>
      )}
      <label className="field">
        <span>{T.auth.email}</span>
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>{T.auth.motDePasse}{insc && <span className="muted" style={{ fontWeight: 400 }}>{T.auth.huitCaracteres}</span>}</span>
        <input className="input" name="password" type="password" required minLength={insc ? 8 : undefined} autoComplete={insc ? "new-password" : "current-password"} />
      </label>

      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}

      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ marginTop: 24 }}>
        {pending ? T.auth.unInstant : insc ? T.auth.creerCompte : T.auth.seConnecter}
      </button>

      <p className="meta" style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
        {insc ? (
          <>{T.auth.dejaInscrit} <Link className="link" href={suite ? `/connexion?suite=${suite}` : "/connexion"}>{T.auth.seConnecter}</Link></>
        ) : (
          <>{T.auth.pasDeCompte} <Link className="link" href={suite ? `/inscription?suite=${suite}` : "/inscription"}>{T.auth.creerUnCompte}</Link></>
        )}
      </p>
    </form>
  );
}
