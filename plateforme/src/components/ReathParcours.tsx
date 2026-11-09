"use client";

import { useState, useTransition } from "react";
import { noterSeanceReath, retirerSeanceReath } from "@/app/(app)/reathletisation/actions";
import type { ReathSeance } from "@/lib/data";
import { alerteGenou, avecVma, JOURS_EN, JOURS_FR, joursActifs, LEXIQUE, NB_SEMAINES, REATH_LCA, tr, type SeanceReath } from "@/lib/coaching/reath-lca";
import { Icon, type NomIcone } from "./Icon";
import { useLang } from "./Langue";

const ICONE: Record<SeanceReath["type"], NomIcone> = { course: "suivi", renfo: "seance", terrain: "drapeau", repos: "feuille" };

/** Parcours de réathlétisation : semaines, séances, contrôle du genou */
export function ReathParcours({ semaineOuverte, termine, seances, vma }: { semaineOuverte: number; termine: boolean; seances: ReathSeance[]; vma: number | null }) {
  const { lang, T } = useLang();
  const R = T.reath;
  const [vue, setVue] = useState(semaineOuverte);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const semaine = REATH_LCA[vue - 1];
  const jours = lang === "en" ? JOURS_EN : JOURS_FR;
  const faite = (j: number) => seances.find((x) => x.semaine === vue && x.jour === j);
  const actifs = joursActifs(semaine);
  const nbFaites = actifs.filter(({ i }) => faite(i)).length;
  const alertesSemaine = seances.filter((x) => x.semaine === vue && alerteGenou(x.douleur, x.gonflement));

  return (
    <>
      <div className="note note-gold">
        <span className="note-icon"><Icon nom="info" taille={17} /></span>
        <div><b>{R.regleTitre}.</b> {R.regle}</div>
      </div>

      <p className="meta" style={{ marginTop: 12, fontSize: 13 }}>{vma ? R.vmaConnue(String(vma).replace(".", lang === "en" ? "." : ",")) : R.vmaInconnue}</p>

      <div className="reath-semaines" role="tablist" aria-label={R.titre}>
        {REATH_LCA.map((s) => {
          const ouv = s.n <= semaineOuverte;
          const complete = joursActifs(s).every(({ i }) => seances.some((x) => x.semaine === s.n && x.jour === i));
          return (
            <button key={s.n} type="button" role="tab" aria-selected={vue === s.n} disabled={!ouv} className={`reath-sem${vue === s.n ? " on" : ""}${complete ? " ok" : ""}`} onClick={() => { setVue(s.n); setOuverte(null); }}>
              <span className="num">S{s.n}</span>
              {complete ? <Icon nom="check" taille={13} /> : !ouv ? <span aria-hidden>🔒</span> : null}
            </button>
          );
        })}
      </div>

      <section className="panel panel-hero section" style={{ marginTop: 14 }}>
        <div className="today-kicker">{R.semaineSur(vue, NB_SEMAINES)}</div>
        <div className="today-title" style={{ fontSize: 28 }}>{tr(lang, semaine.theme)}</div>
        <div className="today-sub">{R.seances(nbFaites, actifs.length)}</div>
        <div className="reath-barre"><span style={{ width: `${(nbFaites / actifs.length) * 100}%` }} /></div>
      </section>

      {alertesSemaine.length > 0 && (
        <div className="note note-ko section">
          <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
          <div>{R.alerte}</div>
        </div>
      )}
      {termine && vue === NB_SEMAINES ? (
        <div className="note note-ok section"><span className="note-icon"><Icon nom="check" taille={17} /></span><div>{R.termine}</div></div>
      ) : nbFaites === actifs.length && vue === semaineOuverte ? (
        <div className="note note-ok section"><span className="note-icon"><Icon nom="check" taille={17} /></span><div>{R.semaineFinie}</div></div>
      ) : null}

      <div className="stack section">
        {semaine.jours.map((sc, j) => {
          const f = faite(j);
          const alerte = f && alerteGenou(f.douleur, f.gonflement);
          if (sc.type === "repos")
            return (
              <div key={j} className="reath-jour repos">
                <span className="reath-ico"><Icon nom="feuille" taille={18} /></span>
                <span><b>{jours[j]}</b> · <span className="muted">{R.repos}</span></span>
              </div>
            );
          return (
            <article key={j} className={`panel reath-jour${f ? " fait" : ""}`}>
              <div className="reath-tete">
                <span className="reath-ico"><Icon nom={ICONE[sc.type]} taille={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="meta">{jours[j]}</div>
                  <div className="row-title" style={{ fontSize: 16 }}>{tr(lang, sc.titre)}</div>
                </div>
                {f ? (
                  <span className={`pill ${alerte ? "pill-ko" : "pill-ok"}`} style={{ fontSize: 12 }}>
                    <span className="dot" />{f.douleur !== null ? R.douleurCourt(f.douleur) : R.fait}{f.gonflement ? ` · ${R.gonfle}` : ""}
                  </span>
                ) : (
                  <span className="pill" style={{ fontSize: 12 }}>{R.aFaire}</span>
                )}
              </div>
              {sc.lignes.length > 0 && <ul className="reath-lignes">{sc.lignes.map((l) => <li key={l}>{avecVma(lang, tr(lang, l), vma)}</li>)}</ul>}
              {sc.circuit && (
                <div className="reath-circuit">
                  {sc.circuit.format && <div className="meta">{R.circuit} · {tr(lang, sc.circuit.format)}</div>}
                  <ul className="reath-lignes">{sc.circuit.exos.map((e) => <li key={e}>{tr(lang, e)}</li>)}</ul>
                </div>
              )}
              {f?.note && <p className="meta" style={{ marginTop: 8 }}>« {f.note} »</p>}
              {vue <= semaineOuverte && (ouverte === j ? (
                <FormGenou semaine={vue} jour={j} initial={f} onFin={() => setOuverte(null)} />
              ) : (
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button type="button" className={`btn btn-sm ${f ? "btn-ghost" : "btn-primary"}`} onClick={() => setOuverte(j)}>
                    {f ? <><Icon nom="crayon" taille={16} /> {R.modifier}</> : <><Icon nom="check" taille={16} /> {R.marquer}</>}
                  </button>
                  {f && <Retirer semaine={vue} jour={j} label={R.retirer} />}
                </div>
              ))}
            </article>
          );
        })}
      </div>

      <details className="panel section">
        <summary className="link" style={{ cursor: "pointer", fontSize: 14 }}>{R.lexique}</summary>
        <dl className="reath-lexique">
          {LEXIQUE[lang].map(([m, d]) => (
            <div key={m}><dt>{m}</dt><dd>{d}</dd></div>
          ))}
        </dl>
      </details>
    </>
  );
}

function Retirer({ semaine, jour, label }: { semaine: number; jour: number; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-sm link" style={{ color: "var(--muted)" }} disabled={pending} onClick={() => start(() => retirerSeanceReath(semaine, jour))}>{label}</button>
  );
}

/* Contrôle du genou après la séance */
function FormGenou({ semaine, jour, initial, onFin }: { semaine: number; jour: number; initial?: ReathSeance; onFin: () => void }) {
  const { T } = useLang();
  const R = T.reath;
  const [douleur, setDouleur] = useState(initial?.douleur ?? 0);
  const [gonflement, setGonflement] = useState(initial?.gonflement ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const alerte = alerteGenou(douleur, gonflement);

  const valider = () =>
    start(async () => {
      const r = await noterSeanceReath(semaine, jour, douleur, gonflement, note);
      if (r.erreur) setErreur(r.erreur);
      else onFin();
    });

  return (
    <div className="reath-form">
      <label className="field" style={{ marginTop: 0 }}>
        <span>{R.douleurQ}</span>
        <div className="reath-douleur">
          <input type="range" min={0} max={10} step={1} value={douleur} onChange={(e) => setDouleur(Number(e.target.value))} aria-valuetext={`${douleur}/10`} />
          <span className={`num ${douleur > 3 ? "ko" : douleur > 0 ? "gold" : "ok"}`}>{douleur}/10</span>
        </div>
      </label>
      <label className="accord-case" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={gonflement} onChange={(e) => setGonflement(e.target.checked)} />
        <span>{R.gonflementQ}</span>
      </label>
      <label className="field">
        <span>{R.noteQ}</span>
        <input className="input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </label>
      {alerte && <p className="ko" style={{ fontSize: 13.5, marginTop: 10 }}>{R.alerte}</p>}
      {erreur && <p className="form-err" style={{ marginTop: 10 }}>{erreur}</p>}
      <div className="btn-row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={valider}>{R.valider}</button>
        <button type="button" className="btn btn-sm link" onClick={onFin}>{R.annuler}</button>
      </div>
    </div>
  );
}
