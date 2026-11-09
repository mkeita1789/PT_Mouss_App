"use client";

import { useState, useTransition } from "react";
import { noterSeanceReath, retirerSeanceReath } from "@/app/(app)/reathletisation/actions";
import type { ReathSeance } from "@/lib/data";
import { alerteGenou, avecVma, cle, JOURS_EN, JOURS_FR, joursActifs, txt, type SeanceReath, type Txt } from "@/lib/coaching/reath-lca";
import { consigne, lireProgramme } from "@/lib/coaching/programmes-speciaux";
import { Icon, type NomIcone } from "./Icon";
import { useLang } from "./Langue";

const ICONE: Record<SeanceReath["type"], NomIcone> = { course: "suivi", renfo: "seance", terrain: "drapeau", repos: "feuille" };

/** Parcours d'un programme spécial : semaines, séances, suivi (genou ou effort) */
export function ReathParcours({ programme, semaineOuverte, termine, seances, vma }: { programme: string; semaineOuverte: number; termine: boolean; seances: ReathSeance[]; vma: number | null }) {
  const { lang, T } = useLang();
  const R = T.reath;
  const prog = lireProgramme(programme);
  const total = prog.semaines.length;
  const [vue, setVue] = useState(semaineOuverte);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [fiche, setFiche] = useState<Txt | null>(null);
  const semaine = prog.semaines[vue - 1];
  const jours = lang === "en" ? JOURS_EN : JOURS_FR;
  const faite = (j: number) => seances.find((x) => x.semaine === vue && x.jour === j);
  const actifs = joursActifs(semaine);
  const nbFaites = actifs.filter(({ i }) => faite(i)).length;
  const alertesSemaine = prog.genou ? seances.filter((x) => x.semaine === vue && alerteGenou(x.douleur, x.gonflement)) : [];
  const ligne = (l: Txt) => avecVma(lang, txt(lang, l), vma);

  return (
    <>
      {prog.genou ? (
        <div className="note note-gold">
          <span className="note-icon"><Icon nom="info" taille={17} /></span>
          <div><b>{R.regleTitre}.</b> {R.regle}</div>
        </div>
      ) : prog.conseils ? (
        <div className="note note-gold">
          <span className="note-icon"><Icon nom="info" taille={17} /></span>
          <div><b>{R.consignes}.</b><ul className="reath-lignes" style={{ paddingLeft: 0, marginTop: 6 }}>{prog.conseils[lang].map((c) => <li key={c}>{c}</li>)}</ul></div>
        </div>
      ) : null}
      {prog.genou && <p className="meta" style={{ marginTop: 12, fontSize: 13 }}>{vma ? R.vmaConnue(String(vma).replace(".", lang === "en" ? "." : ",")) : R.vmaInconnue}</p>}

      <div className="reath-semaines" role="tablist" aria-label={prog.titre[lang]} style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
        {prog.semaines.map((s) => {
          const ouv = s.n <= semaineOuverte;
          const a = joursActifs(s);
          const complete = a.length > 0 && a.every(({ i }) => seances.some((x) => x.semaine === s.n && x.jour === i));
          return (
            <button key={s.n} type="button" role="tab" aria-selected={vue === s.n} disabled={!ouv} className={`reath-sem${vue === s.n ? " on" : ""}${complete ? " ok" : ""}`} onClick={() => { setVue(s.n); setOuverte(null); }}>
              <span className="num">S{s.n}</span>
              {complete ? <Icon nom="check" taille={13} /> : !ouv ? <span aria-hidden>🔒</span> : null}
            </button>
          );
        })}
      </div>

      <section className="panel panel-hero section" style={{ marginTop: 14 }}>
        <div className="today-kicker">{R.semaineSur(vue, total)}</div>
        <div className="today-title" style={{ fontSize: 28 }}>{txt(lang, semaine.theme)}</div>
        <div className="today-sub">{R.seances(nbFaites, actifs.length)}</div>
        <div className="reath-barre"><span style={{ width: `${actifs.length ? (nbFaites / actifs.length) * 100 : 0}%` }} /></div>
      </section>

      {alertesSemaine.length > 0 && (
        <div className="note note-ko section">
          <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
          <div>{R.alerte}</div>
        </div>
      )}
      {termine && vue === total ? (
        <div className="note note-ok section"><span className="note-icon"><Icon nom="check" taille={17} /></span><div>{prog.genou ? R.termine : R.fini}</div></div>
      ) : actifs.length > 0 && nbFaites === actifs.length && vue === semaineOuverte && vue < total ? (
        <div className="note note-ok section"><span className="note-icon"><Icon nom="check" taille={17} /></span><div>{R.semaineFinie}</div></div>
      ) : null}

      <div className="stack section">
        {semaine.jours.map((sc, j) => {
          const f = faite(j);
          const alerte = f && prog.genou && alerteGenou(f.douleur, f.gonflement);
          if (sc.type === "repos")
            return (
              <div key={j} className={`reath-jour repos${sc.info ? " info" : ""}`}>
                <span className="reath-ico"><Icon nom={sc.info ? "drapeau" : "feuille"} taille={18} /></span>
                <span><b>{jours[j]}</b> · <span className={sc.info ? "gold" : "muted"}>{txt(lang, sc.titre)}</span></span>
              </div>
            );
          const pastille = f ? (prog.genou ? (f.douleur !== null ? R.douleurCourt(f.douleur) : R.fait) + (f.gonflement ? ` · ${R.gonfle}` : "") : f.rpe !== null ? R.rpeCourt(f.rpe) : R.fait) : null;
          return (
            <article key={j} className={`panel reath-jour${f ? " fait" : ""}`}>
              <div className="reath-tete">
                <span className="reath-ico"><Icon nom={ICONE[sc.type]} taille={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="meta">{jours[j]}</div>
                  <div className="row-title" style={{ fontSize: 16 }}>{txt(lang, sc.titre)}</div>
                </div>
                {f ? (
                  <span className={`pill ${alerte ? "pill-ko" : "pill-ok"}`} style={{ fontSize: 12 }}><span className="dot" />{pastille}</span>
                ) : (
                  <span className="pill" style={{ fontSize: 12 }}>{R.aFaire}</span>
                )}
              </div>
              {sc.lignes.length > 0 && <ul className="reath-lignes">{sc.lignes.map((l) => <li key={cle(l)}>{ligne(l)}</li>)}</ul>}
              {sc.circuit && (
                <div className="reath-circuit">
                  {sc.circuit.format && <div className="meta">{R.circuit} · {txt(lang, sc.circuit.format)}</div>}
                  <ul className="reath-lignes">
                    {sc.circuit.exos.map((e) =>
                      consigne(e) ? (
                        <li key={cle(e)}><button type="button" className="ex-link" onClick={() => setFiche(e)}>{txt(lang, e)}</button></li>
                      ) : (
                        <li key={cle(e)}>{txt(lang, e)}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
              {f?.note && <p className="meta" style={{ marginTop: 8 }}>« {f.note} »</p>}
              {vue <= semaineOuverte && (ouverte === j ? (
                <FormSuivi genou={prog.genou} semaine={vue} jour={j} initial={f} onFin={() => setOuverte(null)} />
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

      {prog.lexique && (
        <details className="panel section">
          <summary className="link" style={{ cursor: "pointer", fontSize: 14 }}>{R.lexique}</summary>
          <dl className="reath-lexique">
            {prog.lexique[lang].map(([m, d]) => (
              <div key={m}><dt>{m}</dt><dd>{d}</dd></div>
            ))}
          </dl>
        </details>
      )}

      {fiche && (
        <div className="sheet-back" onClick={(e) => e.target === e.currentTarget && setFiche(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={txt(lang, fiche)}>
            <button className="sheet-close" type="button" onClick={() => setFiche(null)} aria-label={T.fiche.fermer} autoFocus><Icon nom="plus" taille={18} /></button>
            <h2 style={{ paddingRight: 44 }}>{txt(lang, fiche)}</h2>
            <p style={{ marginTop: 12, fontSize: 15 }}>{consigne(fiche)?.[lang]}</p>
          </div>
        </div>
      )}
    </>
  );
}

function Retirer({ semaine, jour, label }: { semaine: number; jour: number; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-sm link" style={{ color: "var(--muted)" }} disabled={pending} onClick={() => start(() => retirerSeanceReath(semaine, jour))}>{label}</button>
  );
}

/* Après la séance : douleur + gonflement (genou) ou ressenti d'effort */
function FormSuivi({ genou, semaine, jour, initial, onFin }: { genou: boolean; semaine: number; jour: number; initial?: ReathSeance; onFin: () => void }) {
  const { T } = useLang();
  const R = T.reath;
  const [valeur, setValeur] = useState((genou ? initial?.douleur : initial?.rpe) ?? (genou ? 0 : 5));
  const [gonflement, setGonflement] = useState(initial?.gonflement ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const alerte = genou && alerteGenou(valeur, gonflement);
  const couleur = genou ? (valeur > 3 ? "ko" : valeur > 0 ? "gold" : "ok") : valeur >= 9 ? "ko" : valeur >= 6 ? "gold" : "ok";

  const valider = () =>
    start(async () => {
      const r = await noterSeanceReath(semaine, jour, valeur, gonflement, note);
      if (r.erreur) setErreur(r.erreur);
      else onFin();
    });

  return (
    <div className="reath-form">
      <label className="field" style={{ marginTop: 0 }}>
        <span>{genou ? R.douleurQ : R.rpeQ}</span>
        <div className="reath-douleur">
          <input type="range" min={0} max={10} step={1} value={valeur} onChange={(e) => setValeur(Number(e.target.value))} aria-valuetext={`${valeur}/10`} />
          <span className={`num ${couleur}`}>{valeur}/10</span>
        </div>
      </label>
      {genou && (
        <label className="accord-case" style={{ marginTop: 10 }}>
          <input type="checkbox" checked={gonflement} onChange={(e) => setGonflement(e.target.checked)} />
          <span>{R.gonflementQ}</span>
        </label>
      )}
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
