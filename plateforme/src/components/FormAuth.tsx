"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connexion, inscription, type EtatForm } from "@/app/(auth)/actions";

export function FormAuth({ mode, suite }: { mode: "connexion" | "inscription"; suite?: string }) {
  const action = mode === "connexion" ? connexion : inscription;
  const [etat, formAction, pending] = useActionState<EtatForm, FormData>(action, undefined);
  const insc = mode === "inscription";

  return (
    <form action={formAction} className="reveal">
      {suite === "/importer" && <input type="hidden" name="suite" value="/importer" />}
      <h1 className="page-title" style={{ fontSize: 38 }}>{insc ? "Créer ton compte" : "Te revoilà"}</h1>
      <p className="page-lede" style={{ marginBottom: 12 }}>
        {insc ? "Ton bilan prend deux minutes. Ton programme suit tout de suite après." : "Connecte-toi pour retrouver ta séance du jour."}
      </p>

      {insc && (
        <label className="field">
          <span>Prénom</span>
          <input className="input" name="prenom" autoComplete="given-name" required maxLength={40} />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Mot de passe{insc && <span className="muted" style={{ fontWeight: 400 }}> · 8 caractères minimum</span>}</span>
        <input className="input" name="password" type="password" required minLength={insc ? 8 : undefined} autoComplete={insc ? "new-password" : "current-password"} />
      </label>

      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}

      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ marginTop: 24 }}>
        {pending ? "Un instant…" : insc ? "Créer mon compte" : "Se connecter"}
      </button>

      <p className="meta" style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
        {insc ? (
          <>Déjà inscrit ? <Link className="link" href={suite ? `/connexion?suite=${suite}` : "/connexion"}>Se connecter</Link></>
        ) : (
          <>Pas encore de compte ? <Link className="link" href={suite ? `/inscription?suite=${suite}` : "/inscription"}>Créer un compte</Link></>
        )}
      </p>
    </form>
  );
}
