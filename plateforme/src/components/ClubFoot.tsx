"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  ajouterFait, ajouterTactique, changerDuree, changerLigne, convoquer, modifierContact, obtenirCodeParents, supprimerFait, type EtatEquipe,
} from "@/app/(app)/equipe/actions";
import { URL_FOOT } from "@/lib/app";
import { LIGNES, RESEAUX, type Equipe, type Ligne, type MatchFait, type TypeFait } from "@/lib/equipe";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

type JoueurMini = { id: string; nom: string; numero: number | null };
const nomNum = (j?: JoueurMini) => (j ? `${j.numero !== null ? `${j.numero}. ` : ""}${j.nom}` : "?");

/** Contact du club : numéro à appeler et réseaux sociaux (staff et président) */
export function FormContact({ equipe }: { equipe: Equipe }) {
  const { T } = useLang();
  const C = T.club;
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(modifierContact.bind(null, equipe.id), undefined);
  return (
    <form action={action}>
      <div className="grid-2" style={{ gap: 12 }}>
        <label className="field" style={{ marginTop: 0 }}><span>{C.telephone}</span><input className="input" name="telephone" type="tel" inputMode="tel" defaultValue={equipe.telephone ?? ""} maxLength={20} placeholder="01 43 00 00 00" /></label>
        <label className="field" style={{ marginTop: 0 }}><span>{C.contactNom}</span><input className="input" name="contact_nom" defaultValue={equipe.contact_nom ?? ""} maxLength={60} placeholder={C.contactNomExemple} /></label>
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
        <span>{C.reseaux}</span>
        <div className="grid-2" style={{ gap: 10 }}>
          {RESEAUX.map((r) => (
            <label key={r} className="reseau-champ">
              <span className="meta">{C.reseauxNoms[r]}</span>
              <input className="input" name={r} type="url" inputMode="url" defaultValue={equipe.reseaux?.[r] ?? ""} placeholder="https://" maxLength={300} />
            </label>
          ))}
        </div>
        <small className="meta" style={{ display: "block", marginTop: 6 }}>{C.reseauxAide}</small>
      </fieldset>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 16 }}>{pending ? T.auth.unInstant : T.equipe.enregistrer}</button>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}

/** Code parents à partager (staff) */
export function CodeParents({ equipeId, nomEquipe, code: initial }: { equipeId: string; nomEquipe: string; code: string | null }) {
  const { T } = useLang();
  const C = T.club;
  const [code, setCode] = useState(initial);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);
  const [pending, start] = useTransition();
  const texte = code ? C.messageParents(nomEquipe, code, `${URL_FOOT}/equipe?code=${code}`) : "";
  return (
    <div>
      <p className="meta">{C.codeParentsAide}</p>
      {code ? (
        <div className="invitation-code">
          <div className="code-pro">{code}</div>
          <div className="inviter-actions" style={{ marginTop: 10 }}>
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={16} /> WhatsApp</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch {} }}>
              <Icon nom="check" taille={16} /> {copie ? T.inviter.copie : T.inviter.copierMessage}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={pending}
          onClick={() => start(async () => { const r = await obtenirCodeParents(equipeId); if (r.code) setCode(r.code); else setErreur(r.erreur ?? ""); })}>
          {C.creerCodeParents}
        </button>
      )}
      {erreur && <p className="form-err" role="alert">{erreur}</p>}
    </div>
  );
}

/** Ligne d'un joueur (gardien, défense, milieu, attaque) — staff */
export function ChoixLigne({ equipeId, membreId, ligne }: { equipeId: string; membreId: string; ligne: Ligne | null | undefined }) {
  const { T } = useLang();
  const C = T.club;
  const [pending, start] = useTransition();
  return (
    <select className="input select-mini" aria-label={C.ligne} defaultValue={ligne ?? ""} disabled={pending}
      onChange={(e) => { const v = e.target.value; start(() => changerLigne(equipeId, membreId, v)); }}>
      <option value="">{C.sansLigne}</option>
      {LIGNES.map((l) => <option key={l} value={l}>{C.ligneUn[l]}</option>)}
    </select>
  );
}

/** Convocation d'un match : liste à cocher, notification aux nouveaux convoqués, partage WhatsApp */
export function Convocation({ equipeId, evenementId, joueurs, convoques, partage }: {
  equipeId: string; evenementId: string; joueurs: JoueurMini[]; convoques: string[] | null;
  partage: { titre: string; quand: string; lieu: string };
}) {
  const { T } = useLang();
  const C = T.club;
  const [choix, setChoix] = useState<Set<string>>(new Set(convoques ?? []));
  const [etat, setEtat] = useState<EtatEquipe>();
  const [pending, start] = useTransition();
  const basculer = (id: string) => { setEtat(undefined); setChoix((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const noms = joueurs.filter((j) => choix.has(j.id)).map((j) => j.nom).join(", ");
  const texte = C.texteWhatsApp(partage.titre, partage.quand, partage.lieu, noms);
  return (
    <div>
      <p className="meta">{C.convoquerAide}</p>
      <div className="btn-row" style={{ margin: "10px 0", flexWrap: "wrap" }}>
        <button type="button" className="link" onClick={() => setChoix(new Set(joueurs.map((j) => j.id)))}>{C.toutCocher}</button>
        <button type="button" className="link" onClick={() => setChoix(new Set())}>{C.rienCocher}</button>
        <span className="meta">{C.nConvoques(choix.size)}</span>
      </div>
      <div className="convocation-liste">
        {joueurs.map((j) => (
          <label key={j.id} className={`convocation-joueur ${choix.has(j.id) ? "on" : ""}`}>
            <input type="checkbox" checked={choix.has(j.id)} onChange={() => basculer(j.id)} />
            <span className="num muted" style={{ width: 22 }}>{j.numero ?? ""}</span>
            <span>{j.nom}</span>
          </label>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" disabled={pending || choix.size === 0}
          onClick={() => start(async () => setEtat(await convoquer(equipeId, evenementId, [...choix])))}>{pending ? T.auth.unInstant : C.convoquer}</button>
        <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={16} /> {C.partagerWhatsApp}</a>
      </div>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </div>
  );
}

/** Partager un événement sur WhatsApp (groupe du club) */
export function PartagerWhatsApp({ texte }: { texte: string }) {
  const { T } = useLang();
  return <a className="btn btn-ghost btn-sm" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer"><Icon nom="message" taille={16} /> {T.club.partagerWhatsApp}</a>;
}

/** Feuille de match : buts, cartons, remplacements ; temps de jeu de chacun */
export function FeuilleMatch({ equipeId, evenementId, faits, joueurs, editable, minutes, duree }: {
  equipeId: string; evenementId: string; faits: MatchFait[]; joueurs: JoueurMini[]; editable: boolean;
  minutes: Record<string, number>; duree: number;
}) {
  const { T } = useLang();
  const C = T.club;
  const [type, setType] = useState<TypeFait>("but");
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(ajouterFait.bind(null, equipeId, evenementId), undefined);
  const [, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const parId = new Map(joueurs.map((j) => [j.id, j]));
  const icone = (t: TypeFait) => (t === "but" ? <Icon nom="ballon" taille={16} /> : t === "remplacement" ? <Icon nom="transfert" taille={16} /> : <span className={`carton carton-${t}`} aria-hidden />);
  const avecMinutes = joueurs.filter((j) => minutes[j.id] !== undefined).sort((a, b) => (minutes[b.id] ?? 0) - (minutes[a.id] ?? 0));
  const options = joueurs.map((j) => <option key={j.id} value={j.id}>{nomNum(j)}</option>);
  return (
    <div>
      {faits.length ? (
        <ol className="feuille-faits">
          {faits.map((f) => (
            <li key={f.id}>
              <span className="num feuille-minute">{f.minute !== null ? `${f.minute}'` : "–"}</span>
              <span className="feuille-icone" title={C.types[f.type]}>{icone(f.type)}</span>
              <span className="feuille-texte">
                {f.type === "remplacement" ? C.pourRemplacer(nomNum(parId.get(f.membre_id)), nomNum(parId.get(f.membre2_id ?? ""))) : (
                  <>{nomNum(parId.get(f.membre_id))}{f.type === "but" && f.membre2_id && <span className="meta"> · {C.passeDe(parId.get(f.membre2_id)?.nom ?? "?")}</span>}{f.type !== "but" && <span className="meta"> · {C.types[f.type]}</span>}</>
                )}
              </span>
              {editable && <button type="button" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }} onClick={() => start(() => supprimerFait(equipeId, evenementId, f.id))}>{C.supprimerFait}</button>}
            </li>
          ))}
        </ol>
      ) : <p className="meta">{C.aucunFait}</p>}

      {editable && (
        <form ref={form} action={action} className="feuille-form">
          <div className="chips" role="radiogroup" aria-label={C.feuilleMatch}>
            {(["but", "jaune", "rouge", "remplacement"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{C.types[t]}</button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />
          <div className="feuille-champs">
            <label className="field" style={{ marginTop: 0 }}><span>{type === "but" ? C.buteur : type === "remplacement" ? C.sort : C.joueur}</span>
              <select className="input" name="membre" required defaultValue=""><option value="" disabled>—</option>{options}</select></label>
            {(type === "but" || type === "remplacement") && (
              <label className="field" style={{ marginTop: 0 }}><span>{type === "but" ? C.passeur : C.entre}</span>
                <select className="input" name="membre2" required={type === "remplacement"} defaultValue=""><option value="">—</option>{options}</select></label>
            )}
            <label className="field" style={{ marginTop: 0, maxWidth: 110 }}><span>{C.minute}</span><input className="input num" name="minute" type="number" inputMode="numeric" min={0} max={130} /></label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending} style={{ marginTop: 12 }}><Icon nom="plus" taille={16} /> {C.ajouter}</button>
          {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
        </form>
      )}

      {avecMinutes.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="section-head"><h3 className="section-title" style={{ fontSize: 16 }}>{C.tempsDeJeu}</h3>
            {editable ? (
              <label className="meta" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>{C.dureeMatch}
                <select className="input select-mini" defaultValue={duree} onChange={(e) => { const d = Number(e.target.value); start(() => changerDuree(equipeId, evenementId, d)); }}>
                  {[60, 70, 80, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </label>
            ) : <span className="section-note">{C.minutes(duree)}</span>}
          </div>
          <div className="temps-jeu">
            {avecMinutes.map((j) => (
              <div key={j.id} className="temps-ligne">
                <span className="temps-nom">{nomNum(j)}</span>
                <span className="temps-barre"><span style={{ width: `${Math.min(100, ((minutes[j.id] ?? 0) / duree) * 100)}%` }} /></span>
                <span className="num temps-min">{C.minutes(minutes[j.id] ?? 0)}</span>
              </div>
            ))}
          </div>
          <p className="meta" style={{ marginTop: 8, fontSize: 12.5 }}>{C.tempsAuto}</p>
        </div>
      )}
    </div>
  );
}

/** Ajouter un principe de jeu, une consigne ou une séquence vidéo (staff) */
export function FormTactique({ equipeId, joueurs }: { equipeId: string; joueurs: JoueurMini[] }) {
  const { T } = useLang();
  const C = T.club;
  const form = useRef<HTMLFormElement>(null);
  const [genre, setGenre] = useState<"principe" | "consigne" | "video">("principe");
  const [cible, setCible] = useState<"equipe" | "ligne" | "joueur">("equipe");
  const [etat, action, pending] = useActionState<EtatEquipe, FormData>(async (p, fd) => {
    const r = await ajouterTactique(equipeId, p, fd);
    if (r?.ok) form.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={form} action={action}>
      <div className="chips" role="radiogroup" aria-label={C.tactique}>
        {(["principe", "consigne", "video"] as const).map((g) => (
          <button key={g} type="button" role="radio" aria-checked={genre === g} className={`chip ${genre === g ? "on" : ""}`} onClick={() => setGenre(g)}>{C.genres[g]}</button>
        ))}
      </div>
      <input type="hidden" name="genre" value={genre} />
      <div className="field"><span>{C.pour}</span>
        <div className="chips" role="radiogroup" aria-label={C.pour}>
          {(["equipe", "ligne", "joueur"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cible === c} className={`chip ${cible === c ? "on" : ""}`} onClick={() => setCible(c)}>{C.cibles[c]}</button>
          ))}
        </div>
        <input type="hidden" name="cible" value={cible} />
      </div>
      {cible === "ligne" && (
        <label className="field"><span>{C.ligne}</span>
          <select className="input" name="ligne" required defaultValue="">{[<option key="" value="" disabled>—</option>, ...LIGNES.map((l) => <option key={l} value={l}>{C.lignes[l]}</option>)]}</select></label>
      )}
      {cible === "joueur" && (
        <label className="field"><span>{C.joueur}</span>
          <select className="input" name="membre" required defaultValue=""><option value="" disabled>—</option>{joueurs.map((j) => <option key={j.id} value={j.id}>{nomNum(j)}</option>)}</select></label>
      )}
      <label className="field"><span>{C.titre}</span><input className="input" name="titre" required maxLength={80} /></label>
      <label className="field"><span>{C.texte}</span><textarea className="input" name="texte" rows={3} maxLength={3000} style={{ height: "auto", padding: 12, resize: "vertical" }} /></label>
      <label className="field"><span>{C.lienVideo}</span>
        <input className="input" name="url" type="url" inputMode="url" placeholder="https://" required={genre === "video"} maxLength={500} />
        <small className="meta" style={{ display: "block", marginTop: 6 }}>{C.lienVideoAide}</small>
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 14 }}>{pending ? T.auth.unInstant : C.publier}</button>
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </form>
  );
}
