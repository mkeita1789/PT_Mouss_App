"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { connexion, inscription, type EtatForm } from "@/app/(auth)/actions";
import { useLang } from "./Langue";
import { useApp } from "./AppContexte";
import { estPro, METIERS, type Metier, type MetierPro } from "@/lib/profils";

export function FormAuth({ mode, suite, invitation, codeInvalide }: {
  mode: "connexion" | "inscription"; suite?: string;
  invitation?: { code: string; prenom: string; metier: MetierPro };
  codeInvalide?: boolean;
}) {
  const action = mode === "connexion" ? connexion : inscription;
  const [etat, formAction, pending] = useActionState<EtatForm, FormData>(action, undefined);
  const insc = mode === "inscription";
  const { T } = useLang();
  const M = T.metiers;
  /* Invité par un professionnel : on arrive en tant que sportif, sans avoir à choisir */
  const foot = useApp() === "foot";
  const [metier, setMetier] = useState<Metier>(foot ? "joueur" : "sportif");
  /* Baara Foot : joueurs, membres du club et staff ; Baara : pratiquants et coachs (l'entraîneur est côté foot) */
  const pratique: Metier[] = foot ? ["joueur", "sportif"] : ["sportif", "joueur"];
  const pros: Metier[] = METIERS.filter((m) => estPro(m) && (foot ? m !== "coach" : m !== "entraineur"));
  const groupes: [string, Metier[]][] = [[foot ? T.foot.auClub : M.jePratique, pratique], ...(invitation ? [] : [[M.jeSuisPro, pros] as [string, Metier[]]])];
  const nom = (m: Metier) => (foot && m === "sportif" ? T.foot.membreClub : M.noms[m]);
  const sous = (m: Metier) => (foot && m === "sportif" ? T.foot.membreClubSous : M.sous[m]);

  return (
    <form action={formAction} className="reveal">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <h1 className="page-title" style={{ fontSize: 38 }}>{insc ? T.auth.titreInscription : T.auth.titreConnexion}</h1>
      <p className="page-lede" style={{ marginBottom: 12 }}>
        {insc ? (estPro(metier) ? M.ledePro : T.auth.ledeInscription) : T.auth.ledeConnexion}
      </p>

      {insc && invitation && (
        <div className="note note-gold" style={{ marginTop: 14 }}>
          <div>{M.invitePar(invitation.prenom || "Coach", M.noms[invitation.metier])}</div>
          <input type="hidden" name="code" value={invitation.code} />
        </div>
      )}
      {insc && codeInvalide && <p className="form-err" role="status">{M.codeInvalide}</p>}

      {insc && (
        <fieldset className="metiers">
          <legend>{M.question}</legend>
          {groupes.map(([titre, liste]) => (
            <div key={titre}>
              <div className="metiers-groupe">{titre}</div>
              <div className="metiers-grille">
                {liste.map((m) => (
                  <label key={m} className={`metier ${metier === m ? "on" : ""}`}>
                    <input type="radio" name="metier" value={m} checked={metier === m} onChange={() => setMetier(m)} />
                    <b>{nom(m)}</b>
                    <span>{sous(m)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
      )}

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

      {insc && (
        <label className="case">
          <input type="checkbox" name="majeur" required />
          <span>{M.majeur}</span>
        </label>
      )}

      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}

      <button className="btn btn-primary btn-block" type="submit" disabled={pending} style={{ marginTop: 24 }}>
        {pending ? T.auth.unInstant : insc ? T.auth.creerCompte : T.auth.seConnecter}
      </button>

      <p className="meta" style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
        {insc ? (
          <>{T.auth.dejaInscrit} <Link className="link" href={suite ? `/connexion?suite=${encodeURIComponent(suite)}` : "/connexion"}>{T.auth.seConnecter}</Link></>
        ) : (
          <>{T.auth.pasDeCompte} <Link className="link" href={suite ? `/inscription?suite=${encodeURIComponent(suite)}` : "/inscription"}>{T.auth.creerUnCompte}</Link></>
        )}
      </p>
    </form>
  );
}
