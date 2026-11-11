"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { enregistrerComposition, type EtatEquipe } from "@/app/(app)/equipe/actions";
import { FORMATIONS, MAX_REMPLACANTS, POSTES, texteSur, type Composition as Compo, type Formation, type Reponse } from "@/lib/equipe";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

export type JoueurCompo = { id: string; nom: string; numero: number | null; poste: string | null; photo: string | null; reponse: Reponse | null };

const initiales = (nom: string) => nom.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

/** Composition façon FIFA : terrain, schéma, titulaires, remplaçants. Lecture seule pour les joueurs. */
export function Composition({ equipeId, evenementId, joueurs, initial, editable, couleur1, couleur2 }: {
  equipeId: string; evenementId: string | null; joueurs: JoueurCompo[]; initial: Compo | null; editable: boolean;
  couleur1?: string | null; couleur2?: string | null;
}) {
  const { T } = useLang();
  const E = T.equipe;
  const [c, setC] = useState<Compo>(initial ?? { formation: "4-4-2", titulaires: {}, remplacants: [], publiee: false });
  const [sel, setSel] = useState<number | null>(null);
  const [etat, setEtat] = useState<EtatEquipe>();
  const [pending, start] = useTransition();
  const postes = POSTES[c.formation];
  /* Placement libre : chaque poste peut être déplacé sur le terrain */
  const libre = Object.keys(c.positions ?? {}).length > 0;
  const terrain = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ i: number; x0: number; y0: number; bouge: boolean } | null>(null);
  const pos = (i: number) => c.positions?.[String(i)] ?? postes[i];
  const basculerLibre = () => modifier((x) => ({ ...x, positions: libre ? {} : Object.fromEntries(postes.map((p, i) => [String(i), { x: p.x, y: p.y }])) }));
  const debut = (i: number, e: React.PointerEvent) => {
    if (!editable || !libre) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    glisse.current = { i, x0: e.clientX, y0: e.clientY, bouge: false };
  };
  const bouger = (e: React.PointerEvent) => {
    const g = glisse.current, r = terrain.current?.getBoundingClientRect();
    if (!g || !r) return;
    if (!g.bouge && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return;
    g.bouge = true;
    const x = Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - r.top) / r.height) * 100));
    setC((v) => ({ ...v, positions: { ...v.positions, [String(g.i)]: { x, y } } }));
    setEtat(undefined);
  };
  const fin = () => {
    const g = glisse.current;
    glisse.current = null;
    if (g && !g.bouge) toucherPoste(g.i);
  };
  const parId = useMemo(() => new Map(joueurs.map((j) => [j.id, j])), [joueurs]);
  const surTerrain = new Set(Object.values(c.titulaires));
  const auBanc = new Set(c.remplacants);
  const libres = joueurs
    .filter((j) => !surTerrain.has(j.id) && !auBanc.has(j.id))
    .sort((a, b) => ordre(a.reponse) - ordre(b.reponse) || (a.numero ?? 99) - (b.numero ?? 99) || a.nom.localeCompare(b.nom));
  const n = Object.keys(c.titulaires).filter((k) => Number(k) < postes.length).length;
  const club1 = couleur1 || "var(--gold)";
  const style = { "--club1": club1, "--club1-texte": texteSur(couleur1), "--club2": couleur2 || "var(--ink)" } as React.CSSProperties;

  const modifier = (f: (x: Compo) => Compo) => { setC((x) => f(x)); setEtat(undefined); };
  const toucherPoste = (i: number) => {
    if (!editable) return;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    /* Deux postes : on échange les joueurs */
    modifier((x) => {
      const t = { ...x.titulaires };
      const a = t[String(sel)], b = t[String(i)];
      if (b) t[String(sel)] = b; else delete t[String(sel)];
      if (a) t[String(i)] = a; else delete t[String(i)];
      return { ...x, titulaires: t };
    });
    setSel(null);
  };
  const placer = (id: string) => {
    if (sel === null) return;
    modifier((x) => {
      const t = Object.fromEntries(Object.entries(x.titulaires).filter(([, v]) => v !== id));
      t[String(sel)] = id;
      return { ...x, titulaires: t, remplacants: x.remplacants.filter((r) => r !== id) };
    });
    setSel(null);
  };
  const vider = () => {
    if (sel === null) return;
    modifier((x) => { const t = { ...x.titulaires }; delete t[String(sel)]; return { ...x, titulaires: t }; });
    setSel(null);
  };
  const versBanc = (id: string) => modifier((x) => (x.remplacants.length >= MAX_REMPLACANTS ? x : { ...x, remplacants: [...x.remplacants, id] }));
  const horsBanc = (id: string) => modifier((x) => ({ ...x, remplacants: x.remplacants.filter((r) => r !== id) }));
  const changerSchema = (f: Formation) => { modifier((x) => ({ ...x, formation: f, positions: {} })); setSel(null); };
  const enregistrer = (publier: boolean) => start(async () => {
    const r = await enregistrerComposition(equipeId, evenementId, { ...c, publiee: publier || c.publiee });
    setEtat(r);
    if (!r?.erreur && publier) setC((x) => ({ ...x, publiee: true }));
  });

  const Carte = ({ j, mini }: { j: JoueurCompo; mini?: boolean }) => (
    <span className={`compo-carte ${mini ? "mini" : ""}`}>
      <span className="compo-visage">
        {j.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire
          <img src={j.photo} alt="" />
        ) : <span>{initiales(j.nom)}</span>}
        {j.numero !== null && <b className="compo-num num">{j.numero}</b>}
      </span>
      <span className="compo-nom">{j.nom}</span>
    </span>
  );

  return (
    <div className="compo" style={style}>
      {editable && (
        <div className="chips" style={{ marginBottom: 10 }} role="radiogroup" aria-label={T.club.placementLibre}>
          <button type="button" role="radio" aria-checked={!libre} className={`chip ${!libre ? "on" : ""}`} onClick={() => libre && basculerLibre()}>{T.club.placementSchema}</button>
          <button type="button" role="radio" aria-checked={libre} className={`chip ${libre ? "on" : ""}`} onClick={() => !libre && basculerLibre()}>{T.club.placementLibre}</button>
        </div>
      )}
      {editable && (
        <div className="compo-schemas" role="radiogroup" aria-label={E.formation}>
          {FORMATIONS.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={c.formation === f} className={`chip num ${c.formation === f ? "on" : ""}`} onClick={() => changerSchema(f)}>{f}</button>
          ))}
        </div>
      )}

      <div className="compo-entete">
        <span className="num compo-schema">{c.formation}{libre ? ` · ${T.club.personnalise}` : ""}</span>
        <span className="meta">{E.nTitulaires(n)}</span>
        {editable && <span className={`pill ${c.publiee ? "pill-ok" : "pill-neutre"}`} style={{ fontSize: 12 }}>{c.publiee ? E.publiee : E.nonPubliee}</span>}
      </div>

      <div className={`terrain ${libre && editable ? "terrain-libre" : ""}`} ref={terrain} aria-label={E.titulaires}>
        <span className="terrain-ligne" /><span className="terrain-rond" /><span className="terrain-surface haut" /><span className="terrain-surface bas" />
        {postes.map((p, i) => {
          const j = parId.get(c.titulaires[String(i)]);
          return (
            <button key={`${c.formation}-${i}`} type="button" className={`poste ${sel === i ? "sel" : ""} ${j ? "" : "vide"}`}
              style={{ left: `${pos(i).x}%`, top: `${pos(i).y}%` }} onClick={() => !libre && toucherPoste(i)} disabled={!editable}
              onPointerDown={(e) => debut(i, e)} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={() => (glisse.current = null)}
              aria-label={j ? `${p.p} : ${j.nom}` : `${p.p} : ${E.posteVide}`} aria-pressed={sel === i}>
              {j ? <Carte j={j} /> : <span className="compo-visage vide"><Icon nom="plus" taille={16} /></span>}
              <span className="poste-label">{p.p}</span>
            </button>
          );
        })}
      </div>

      {editable && <p className="meta" style={{ marginTop: 10 }}>{sel !== null ? E.choisirJoueur(postes[sel].p) : libre ? T.club.libreAide : E.compoAide}</p>}
      {editable && sel !== null && c.titulaires[String(sel)] && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={vider}>{E.vider}</button>
      )}

      <div className="compo-listes">
        <section>
          <h3 className="compo-titre">{E.remplacants} <span className="meta">{c.remplacants.length}/{MAX_REMPLACANTS}</span></h3>
          {c.remplacants.length ? (
            <div className="compo-banc">
              {c.remplacants.map((id) => parId.get(id)).filter((j): j is JoueurCompo => !!j).map((j) => (
                <div key={j.id} className="compo-ligne">
                  <button type="button" className="compo-choix" onClick={() => sel !== null && placer(j.id)} disabled={!editable || sel === null}><Carte j={j} mini /></button>
                  {editable && <button type="button" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }} onClick={() => horsBanc(j.id)} aria-label={`${E.retirerDuBanc} : ${j.nom}`}>{E.retirer}</button>}
                </div>
              ))}
            </div>
          ) : <p className="meta">—</p>}
        </section>

        {editable && (
          <section>
            <h3 className="compo-titre">{E.disponibles} <span className="meta">{libres.length}</span></h3>
            <div className="compo-banc">
              {libres.map((j) => (
                <div key={j.id} className={`compo-ligne rep-${j.reponse ?? "sans"}`}>
                  <button type="button" className="compo-choix" onClick={() => placer(j.id)} disabled={sel === null} aria-label={sel !== null ? `${E.choisirJoueur(postes[sel].p)} : ${j.nom}` : j.nom}>
                    <Carte j={j} mini />
                    <span className="compo-rep">{j.reponse === "oui" ? E.vient : j.reponse === "non" ? E.absentCompo : j.reponse === "incertain" ? E.incertainCompo : j.poste ?? ""}</span>
                  </button>
                  <button type="button" className="link" style={{ fontSize: 12.5 }} onClick={() => versBanc(j.id)} disabled={c.remplacants.length >= MAX_REMPLACANTS}>{E.auBanc}</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {editable && (
        <div className="btn-row" style={{ marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => enregistrer(false)}>{E.enregistrerCompo}</button>
          {!c.publiee && <button type="button" className="btn btn-primary" disabled={pending} onClick={() => enregistrer(true)}>{E.publierCompo}</button>}
        </div>
      )}
      {etat?.ok && <p className="form-ok" role="status">{etat.ok}</p>}
      {etat?.erreur && <p className="form-err" role="alert">{etat.erreur}</p>}
    </div>
  );
}

const ordre = (r: Reponse | null) => (r === "oui" ? 0 : r === "incertain" ? 1 : r === null ? 2 : 3);
