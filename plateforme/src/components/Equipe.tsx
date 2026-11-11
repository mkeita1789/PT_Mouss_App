"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  ajouterEvenement, ajouterFiche, changerRole, creerEquipe, enregistrerFeuille, rejoindreEquipe, repondre,
  type EtatEquipe,
} from "@/app/(app)/equipe/actions";
import type { Evenement, Membre, Presence, Reponse, RoleEquipe, TypeEvenement } from "@/lib/equipe";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

const Msg = ({ etat }: { etat: EtatEquipe }) => (
  <>
    {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
    {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
  </>
);

/* ─── Créer / rejoindre ─── */
export function FormCreerEquipe({ roleParDefaut }: { roleParDefaut: RoleEquipe }) {
  const { T } = useLang();
  const E = T.equipe;
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(creerEquipe, undefined);
  return (
    <form action={action}>
      <label className="field" style={{ marginTop: 0 }}><span>{E.nom}</span>
        <input className="input" name="nom" required maxLength={60} placeholder={E.nomExemple} />
      </label>
      <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label className="field"><span>{E.saison}</span>
          <input className="input" name="saison" maxLength={20} placeholder={E.saisonExemple} />
        </label>
        <label className="field"><span>{E.monRole}</span>
          <select className="input" name="role" defaultValue={roleParDefaut === "joueur" ? "entraineur" : roleParDefaut}>
            {(["entraineur", "adjoint", "prepa"] as const).map((r) => <option key={r} value={r}>{E.roles[r]}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 16 }}>{pending ? T.auth.unInstant : E.creerBouton}</button>
      <Msg etat={etat} />
    </form>
  );
}

export function FormRejoindreEquipe() {
  const { T } = useLang();
  const E = T.equipe;
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(rejoindreEquipe, undefined);
  return (
    <form action={action}>
      <label className="field" style={{ marginTop: 0 }}><span>{E.code}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input code-input" name="code" required minLength={6} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="K7MPQ3" />
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? T.auth.unInstant : E.rejoindreBouton}</button>
        </div>
      </label>
      <Msg etat={etat} />
    </form>
  );
}

/* ─── Répondre à une convocation ─── */
export function BoutonsReponse({ equipeId, evenementId, actuelle }: { equipeId: string; evenementId: string; actuelle: Reponse | null }) {
  const { T } = useLang();
  const E = T.equipe;
  const [optimiste, setOptimiste] = useOptimistic(actuelle);
  const [erreur, setErreur] = useState("");
  const [, start] = useTransition();
  const choisir = (r: Reponse) => start(async () => {
    setErreur("");
    setOptimiste(r);
    const res = await repondre(equipeId, evenementId, r);
    if (res.erreur) setErreur(res.erreur);
  });
  return (
    <div>
      <div className="reponses" role="radiogroup" aria-label={E.tuViens}>
        {(["oui", "incertain", "non"] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={optimiste === r} className={`reponse reponse-${r} ${optimiste === r ? "on" : ""}`} onClick={() => choisir(r)}>
            {r === "oui" && <Icon nom="check" taille={16} />}{E[r]}
          </button>
        ))}
      </div>
      {erreur && <p className="form-err" role="alert">{erreur}</p>}
    </div>
  );
}

/* ─── Ajouter un événement (staff) ─── */
export function FormEvenement({ equipeId }: { equipeId: string }) {
  const { T } = useLang();
  const E = T.equipe;
  const [type, setType] = useState<TypeEvenement>("entrainement");
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(ajouterEvenement.bind(null, equipeId), undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (etat?.ok) form.current?.reset(); }, [etat]);
  return (
    <form action={action} ref={form}>
      <div className="lang-switch" role="radiogroup" aria-label={E.type}>
        {(["entrainement", "match", "rdv"] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={type === t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{E.types[t]}</button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />
      {type === "rdv" && (
        <label className="field"><span>{E.titre}</span><input className="input" name="titre" maxLength={80} required placeholder={E.titreExemple} /></label>
      )}
      {type === "match" && (
        <div className="grid-2" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
          <label className="field"><span>{E.adversaire}</span><input className="input" name="adversaire" maxLength={60} required /></label>
          <label className="field"><span>{E.lieu}</span>
            <select className="input" name="domicile" defaultValue="oui">
              <option value="oui">{E.lieuDomicile}</option><option value="non">{E.lieuExterieur}</option>
            </select>
          </label>
        </div>
      )}
      <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label className="field"><span>{E.date}</span><input className="input" type="datetime-local" name="debut" required /></label>
        <label className="field"><span>{type === "match" ? `${E.lieu} (stade)` : E.lieu}</span><input className="input" name="lieu" maxLength={120} placeholder={E.lieuExemple} /></label>
      </div>
      {type === "entrainement" && (
        <label className="field"><span>{E.repeter}</span>
          <input className="input" type="date" name="jusqua" style={{ maxWidth: 220 }} />
          <small className="meta" style={{ display: "block", marginTop: 6 }}>{E.repeterAide}</small>
        </label>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 16 }}>{pending ? T.auth.unInstant : E.ajouter}</button>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok} {E.joueursPrevenus}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}

/* ─── Feuille de présence (staff) ─── */
export function FeuillePresence({ equipeId, evenement, joueurs, presences }: { equipeId: string; evenement: Evenement; joueurs: Membre[]; presences: Presence[] }) {
  const { T } = useLang();
  const E = T.equipe;
  const match = evenement.type === "match";
  const de = (m: Membre) => presences.find((p) => p.membre_id === m.id);
  /* Pré-coché : présence déjà notée, sinon « je viens » */
  const [lignes, setLignes] = useState(() => joueurs.map((m) => ({
    membre_id: m.id,
    present: de(m)?.present ?? de(m)?.reponse === "oui",
    minutes: de(m)?.minutes != null ? String(de(m)!.minutes) : "",
  })));
  const [resume, setResume] = useState(evenement.resume ?? "");
  const [pour, setPour] = useState(evenement.score_pour?.toString() ?? "");
  const [contre, setContre] = useState(evenement.score_contre?.toString() ?? "");
  const [etat, setEtat] = useState<EtatEquipe>();
  const [pending, start] = useTransition();
  const maj = (i: number, v: Partial<(typeof lignes)[number]>) => setLignes((ls) => ls.map((l, k) => (k === i ? { ...l, ...v } : l)));
  const num = (s: string) => (s.trim() === "" ? null : parseInt(s, 10));
  const enregistrer = () => start(async () => {
    setEtat(await enregistrerFeuille(equipeId, evenement.id,
      lignes.map((l) => ({ membre_id: l.membre_id, present: l.present, minutes: match ? num(l.minutes) : null })),
      { resume, score_pour: match ? num(pour) : null, score_contre: match ? num(contre) : null }));
  });
  const nPresents = lignes.filter((l) => l.present).length;

  return (
    <div className="panel">
      <div className="section-head"><h2 className="section-title">{E.feuille}</h2><span className="section-note">{E.presents(nPresents, lignes.length)}</span></div>
      <p className="meta" style={{ marginBottom: 10 }}>{E.feuilleAide}</p>
      <div className="rows">
        {joueurs.map((m, i) => {
          const r = de(m)?.reponse;
          return (
            <div key={m.id} className="row-item feuille-ligne">
              <label className="case" style={{ margin: 0, flex: 1, minWidth: 0 }}>
                <input type="checkbox" checked={lignes[i].present} onChange={(e) => maj(i, { present: e.target.checked })} />
                <span style={{ minWidth: 0 }}>
                  <b style={{ fontWeight: 600, color: "var(--ink)" }}>{m.numero !== null ? <span className="num muted">{m.numero} </span> : null}{m.nom}</b>
                  <span className="row-sub" style={{ display: "block" }}>{r ? E.reponseDe[r] : E.sansReponse}{m.user_id ? "" : ` · ${E.sansCompte}`}</span>
                </span>
              </label>
              {match && (
                <label className="minutes">
                  <input className="input kg" inputMode="numeric" value={lignes[i].minutes} onChange={(e) => maj(i, { minutes: e.target.value.replace(/\D/g, "").slice(0, 3) })} aria-label={`${m.nom}, ${E.minutes}`} placeholder="—" disabled={!lignes[i].present} />
                  <span className="meta">{E.minutes}</span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {match && (
        <div className="score-saisie">
          <span className="meta">{E.score}</span>
          <label><span className="sr-only">{E.nous}</span><input className="input kg" inputMode="numeric" value={pour} onChange={(e) => setPour(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-label={E.nous} /></label>
          <span className="num">–</span>
          <label><span className="sr-only">{E.eux}</span><input className="input kg" inputMode="numeric" value={contre} onChange={(e) => setContre(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-label={E.eux} /></label>
        </div>
      )}
      <label className="field"><span>{match ? E.resumeMatch : E.resume}</span>
        <textarea className="input" rows={3} maxLength={1500} value={resume} onChange={(e) => setResume(e.target.value)} placeholder={E.resumeExemple} style={{ height: "auto", padding: 12, resize: "vertical" }} />
      </label>
      <button type="button" className="btn btn-primary" disabled={pending} onClick={enregistrer} style={{ marginTop: 16 }}>{pending ? T.auth.unInstant : E.enregistrer}</button>
      <Msg etat={etat} />
    </div>
  );
}

/* ─── Effectif (staff) ─── */
export function FormFiche({ equipeId }: { equipeId: string }) {
  const { T } = useLang();
  const E = T.equipe;
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(ajouterFiche.bind(null, equipeId), undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (etat?.ok) form.current?.reset(); }, [etat]);
  return (
    <form action={action} ref={form}>
      <p className="meta">{E.ajouterJoueurAide}</p>
      <div className="fiche-grille">
        <label className="field"><span>{E.prenomNom}</span><input className="input" name="nom" required maxLength={60} /></label>
        <label className="field"><span>{E.poste}</span><input className="input" name="poste" maxLength={30} /></label>
        <label className="field"><span>{E.numero}</span><input className="input" name="numero" inputMode="numeric" maxLength={2} /></label>
      </div>
      <button type="submit" className="btn btn-ghost" disabled={pending} style={{ marginTop: 14 }}><Icon nom="plus" taille={16} /> {E.ajouterBouton}</button>
      <Msg etat={etat} />
    </form>
  );
}

export function ChoixRole({ equipeId, membreId, role }: { equipeId: string; membreId: string; role: RoleEquipe }) {
  const { T } = useLang();
  const E = T.equipe;
  const [pending, start] = useTransition();
  return (
    <select className="input role-select" aria-label={E.role} defaultValue={role} disabled={pending}
      onChange={(e) => { const r = e.target.value as RoleEquipe; start(() => changerRole(equipeId, membreId, r)); }}>
      {(["joueur", "entraineur", "adjoint", "prepa"] as const).map((r) => <option key={r} value={r}>{E.roles[r]}</option>)}
    </select>
  );
}

/* ─── Inviter des joueurs (code d'équipe) ─── */
export function InviterEquipe({ nom, code }: { nom: string; code: string }) {
  const { T } = useLang();
  const E = T.equipe;
  const [copie, setCopie] = useState(false);
  const [partage, setPartage] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- capacité du navigateur, inconnue au rendu serveur
  useEffect(() => setPartage(typeof navigator.share === "function"), []);
  const texte = E.inviterMessage(nom, code, "https://pt-mouss-app.vercel.app/inscription");
  const copier = async () => { try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch {} };
  return (
    <div className="inviter-actions" style={{ marginTop: 12 }}>
      {partage && <button type="button" className="btn btn-primary btn-sm" onClick={async () => { try { await navigator.share({ title: nom, text: texte }); } catch {} }}><Icon nom="transfert" taille={16} /> {E.inviter}</button>}
      <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={16} /> WhatsApp</a>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copier}><Icon nom="check" taille={16} /> {copie ? T.inviter.copie : T.inviter.copierMessage}</button>
    </div>
  );
}
