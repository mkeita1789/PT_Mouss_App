"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { accepterSuiviEquipe, creerInvitation, envoyerMessageEquipe, type EtatEquipe } from "@/app/(app)/equipe/actions";
import { ROLES_INVITES, type CibleMessage, type Membre, type RoleInvite } from "@/lib/equipe";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

const LIEN = "https://pt-mouss-app.vercel.app/inscription";

/** L'entraîneur invite le staff : un code personnel par personne, avec son rôle */
export function InviterStaff({ equipeId, nomEquipe }: { equipeId: string; nomEquipe: string }) {
  const { T } = useLang();
  const E = T.equipe;
  const [role, setRole] = useState<RoleInvite>("prepa");
  const [code, setCode] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);
  const [pending, start] = useTransition();
  const texte = code ? E.messageInvitation(nomEquipe, E.roles[role].toLowerCase(), code, LIEN) : "";
  const creer = () => start(async () => {
    setErreur(""); setCode(null);
    const r = await creerInvitation(equipeId, role);
    if (r.code) setCode(r.code); else setErreur(r.erreur ?? E.erreur);
  });
  const copier = async () => { try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch {} };
  return (
    <div>
      <p className="meta">{E.inviterStaffAide}</p>
      <div className="chips" role="radiogroup" aria-label={E.role}>
        {ROLES_INVITES.map((r) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} className={`chip ${role === r ? "on" : ""}`} onClick={() => { setRole(r); setCode(null); }}>{E.roles[r]}</button>
        ))}
      </div>
      <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} disabled={pending} onClick={creer}><Icon nom="plus" taille={16} /> {E.creerInvitation}</button>
      {erreur && <p className="form-err" role="alert">{erreur}</p>}
      {code && (
        <div className="invitation-code">
          <div className="meta">{E.roles[role]}</div>
          <div className="code-pro">{code}</div>
          <div className="inviter-actions" style={{ marginTop: 10 }}>
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={16} /> WhatsApp</a>
            <a className="btn btn-ghost btn-sm" href={`sms:?&body=${encodeURIComponent(texte)}`}><Icon nom="message" taille={16} /> SMS</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copier}><Icon nom="check" taille={16} /> {copie ? T.inviter.copie : T.inviter.copierMessage}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Écrire aux membres : toute l'équipe, les joueurs, le staff, ou certains membres */
export function EcrireMembres({ equipeId, membres }: { equipeId: string; membres: Membre[] }) {
  const { T } = useLang();
  const E = T.equipe;
  const [cible, setCible] = useState<CibleMessage>("tous");
  const form = useRef<HTMLFormElement>(null);
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(async (prev, fd) => {
    const r = await envoyerMessageEquipe(equipeId, prev, fd);
    if (r?.ok) { form.current?.reset(); setCible("tous"); }
    return r;
  }, undefined);
  return (
    <form action={action} ref={form}>
      <div className="field" style={{ marginTop: 0 }}>
        <span>{E.pour}</span>
        <div className="chips" role="radiogroup" aria-label={E.pour}>
          {(["tous", "joueurs", "staff", "selection"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cible === c} className={`chip ${cible === c ? "on" : ""}`} onClick={() => setCible(c)}>{E.cibles[c]}</button>
          ))}
        </div>
        <input type="hidden" name="cible" value={cible} />
      </div>
      {cible === "selection" && (
        <fieldset className="selection-membres">
          <legend className="meta">{E.choisirMembres}</legend>
          {membres.filter((m) => m.user_id).map((m) => (
            <label key={m.id} className="case" style={{ marginTop: 6 }}>
              <input type="checkbox" name="destinataires" value={m.id} />
              <span>{m.nom} <span className="meta">· {E.roles[m.role]}</span></span>
            </label>
          ))}
        </fieldset>
      )}
      <textarea className="input" name="texte" rows={3} maxLength={1000} required placeholder={E.messageExemple} aria-label={E.ecrire} style={{ height: "auto", padding: 12, resize: "vertical", marginTop: 14 }} />
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 12 }}>{pending ? T.auth.unInstant : E.envoyerMessage}</button>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}

/** Le joueur accepte que le préparateur de l'équipe suive sa préparation */
export function AccepterSuivi({ equipeId, proMembreId, nom }: { equipeId: string; proMembreId: string; nom: string }) {
  const { T } = useLang();
  const E = T.equipe;
  const [etat, setEtat] = useState<{ ok?: string; erreur?: string }>({});
  const [pending, start] = useTransition();
  if (etat.ok) return <div className="note note-ok" style={{ marginTop: 14 }}><span className="note-icon"><Icon nom="check" taille={17} /></span><div>{etat.ok}</div></div>;
  return (
    <div className="panel suivi-demande" style={{ marginTop: 14 }}>
      <div className="section-title" style={{ fontSize: 15.5 }}>{E.demandeSuiviTitre(nom)}</div>
      <p className="meta" style={{ marginTop: 6 }}>{E.demandeSuiviTexte}</p>
      <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={pending} onClick={() => start(async () => setEtat(await accepterSuiviEquipe(equipeId, proMembreId)))}>{E.accepter}</button>
      {etat.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </div>
  );
}
