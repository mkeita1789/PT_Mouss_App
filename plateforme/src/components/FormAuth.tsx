"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connexion, inscription, type EtatForm } from "@/app/(auth)/actions";

export function FormAuth({ mode }: { mode: "connexion" | "inscription" }) {
  const action = mode === "connexion" ? connexion : inscription;
  const [etat, formAction, pending] = useActionState<EtatForm, FormData>(action, undefined);

  return (
    <form action={formAction} className="card gold glow">
      <div className="eyebrow" style={{ marginTop: 0 }}>
        {mode === "connexion" ? "Connexion" : "Créer mon compte"}
      </div>

      {mode === "inscription" && (
        <>
          <label className="label" htmlFor="prenom">Prénom</label>
          <input className="input" id="prenom" name="prenom" autoComplete="given-name" required maxLength={40} />
        </>
      )}

      <label className="label" htmlFor="email">Email</label>
      <input className="input" id="email" name="email" type="email" autoComplete="email" required />

      <label className="label" htmlFor="password">Mot de passe</label>
      <input
        className="input"
        id="password"
        name="password"
        type="password"
        required
        minLength={mode === "inscription" ? 8 : undefined}
        autoComplete={mode === "connexion" ? "current-password" : "new-password"}
      />

      <div style={{ marginTop: 14 }}>
        {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
        {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
        <button className="btn p" type="submit" disabled={pending}>
          {pending ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
        </button>
      </div>

      <p className="sub" style={{ textAlign: "center", margin: "16px 0 0" }}>
        {mode === "connexion" ? (
          <>Pas encore de compte ? <Link className="link" href="/inscription">Créer un compte</Link></>
        ) : (
          <>Déjà inscrit ? <Link className="link" href="/connexion">Se connecter</Link></>
        )}
      </p>
    </form>
  );
}
