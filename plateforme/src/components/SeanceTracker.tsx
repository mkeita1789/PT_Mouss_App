"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { enregistrerSeance, signalerDebut } from "@/app/(app)/actions";
import { FicheExercice } from "./FicheExercice";
import { Icon } from "./Icon";
import { amrapNext, amrapTexte, parseKg, raisonTexte } from "@/lib/coaching/amrap";
import { tc } from "@/lib/i18n";
import { useLang } from "./Langue";
import type { LigneSeance } from "@/lib/coaching/seance";

export type JourPrepare = { d: string; f: string; crit: boolean; lignes: LigneSeance[] };

type Etat = { done: number; charge: string; amrap: number | null; note: string };

const REPOS_S = 60;
const cleBrouillon = (jour: string) => `ptmouss.seance.${jour}`;

/* Brouillon local : une séance en cours survit à un rechargement de page.
   Navigation privée / stockage bloqué → on continue sans. */
function lireBrouillon(jour: string): Etat[] | null {
  try {
    const raw = localStorage.getItem(cleBrouillon(jour));
    return raw ? (JSON.parse(raw) as Etat[]) : null;
  } catch {
    return null;
  }
}
function ecrireBrouillon(jour: string, etats: Etat[]) {
  try {
    localStorage.setItem(cleBrouillon(jour), JSON.stringify(etats));
  } catch {}
}
function effacerBrouillon(jour: string) {
  try {
    localStorage.removeItem(cleBrouillon(jour));
  } catch {}
}

const etatsInitiaux = (j: JourPrepare): Etat[] => j.lignes.map((l) => ({ done: 0, charge: l.charge, amrap: null, note: "" }));

export function SeanceTracker(props: {
  jours: JourPrepare[];
  jourInitial: number;
  echauffement: { t: string; ex: string[] };
  verdict: { v: string; col: string; msg: string } | null;
  allegee: boolean;
  deload: boolean;
}) {
  const router = useRouter();
  const { lang, T } = useLang();
  const kg = (n: number | null) => String(n).replace(".", lang === "fr" ? "," : ".");
  const [jourIdx, setJourIdx] = useState(props.jourInitial);
  const jour = props.jours[jourIdx];
  const [etats, setEtats] = useState<Etat[]>(() => etatsInitiaux(jour));
  const [warmOpen, setWarmOpen] = useState(false);
  const [repos, setRepos] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const charge = useRef(false);

  /* Restaurer un brouillon au montage / changement de jour */
  useEffect(() => {
    const b = lireBrouillon(jour.d);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage navigateur, indisponible au rendu serveur
    setEtats(b && b.length === jour.lignes.length ? b : etatsInitiaux(jour));
    charge.current = true;
  }, [jour]);

  useEffect(() => {
    if (charge.current) ecrireBrouillon(jour.d, etats);
  }, [etats, jour.d]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const maj = (i: number, patch: Partial<Etat>) => setEtats((prev) => prev.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  const stopRepos = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRepos(null);
  };
  const lancerRepos = () => {
    stopRepos();
    setRepos(REPOS_S);
    timer.current = setInterval(() => {
      setRepos((r) => {
        if (r === null || r <= 1) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          if (navigator.vibrate) navigator.vibrate(180);
          return null;
        }
        return r - 1;
      });
    }, 1000);
  };

  const cocher = (i: number, k: number) => {
    const sets = jour.lignes[i].sets;
    const done = k < etats[i].done ? k : k + 1;
    maj(i, { done });
    if (done > 0 && done < sets) lancerRepos();
  };

  const changerJour = (i: number) => {
    stopRepos();
    charge.current = false;
    setJourIdx(i);
  };

  const total = jour.lignes.reduce((a, l) => a + l.sets, 0);
  const faites = etats.reduce((a, e) => a + e.done, 0);
  const fini = faites >= total;

  /* Première série cochée : le coach est prévenu que la séance commence (une seule fois par jour) */
  useEffect(() => {
    if (!charge.current || faites === 0) return;
    const cle = `ptmouss.debut.${jour.d}`;
    const aujourdhui = new Date().toDateString();
    try {
      if (localStorage.getItem(cle) === aujourdhui) return;
      localStorage.setItem(cle, aujourdhui);
    } catch {}
    void signalerDebut(jour.d, jour.f).catch(() => {});
  }, [faites, jour.d, jour.f]);

  const enregistrer = () => {
    setErreur("");
    start(async () => {
      const r = await enregistrerSeance({
        jour_code: jour.d,
        focus: jour.f,
        allegee: props.allegee,
        exercices: jour.lignes.map((l, i) => ({
          nom: l.n,
          categorie: l.c,
          charge: l.suivi ? etats[i].charge : "",
          series: etats[i].done,
          amrap: etats[i].amrap,
          cible: l.cible,
          note: etats[i].note,
        })),
      });
      if (r.erreur) return setErreur(r.erreur);
      effacerBrouillon(jour.d);
      celebrer();
      setTimeout(() => router.push("/suivi"), 1200);
    });
  };

  return (
    <div className="reveal">
      <header className="page-head" style={{ paddingBottom: 16 }}>
        <div className="meta">{T.seance.duJour}</div>
        <h1 className="page-title" style={{ marginTop: 6, color: jour.crit ? "var(--ko)" : undefined }}>{tc(lang, jour.d)}</h1>
        <p className="page-lede">{tc(lang, jour.f)}</p>
      </header>

      {props.jours.length > 1 && (
        <div className="days-switch" role="tablist" aria-label={T.seance.choisir}>
          {props.jours.map((d, i) => (
            <button key={d.d} type="button" role="tab" aria-selected={i === jourIdx} className={i === jourIdx ? "on" : ""} onClick={() => changerJour(i)}>
              {tc(lang, d.d)}
            </button>
          ))}
        </div>
      )}

      {props.verdict && (
        <div className={`note ${props.verdict.v === "REPORTER" ? "note-ko" : "note-gold"}`} style={{ marginBottom: 12 }}>
          <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
          <div><b>{props.verdict.v === "REPORTER" ? T.seance.reporter : T.seance.allegee}</b> {props.verdict.msg}</div>
        </div>
      )}

      <details className="panel panel-tight" style={{ marginBottom: 12 }} open={warmOpen} onToggle={(e) => setWarmOpen((e.target as HTMLDetailsElement).open)}>
        <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="note-icon" style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--gold-soft)", color: "var(--gold)" }}><Icon nom="chrono" taille={17} /></span>
          <span className="row-main"><span className="row-title">{T.seance.echauffement}</span><span className="row-sub" style={{ display: "block" }}>{props.echauffement.t}</span></span>
          <span className="muted" style={{ transform: warmOpen ? "rotate(90deg)" : undefined, transition: "transform .2s" }}><Icon nom="fleche" taille={18} /></span>
        </summary>
        <div className="rows" style={{ marginTop: 8 }}>
          {props.echauffement.ex.map((x) => <div key={x} className="row-item" style={{ fontSize: 14, color: "var(--ink-2)", padding: "9px 0" }}>{x}</div>)}
        </div>
      </details>

      <div className="progress-sticky">
        <div className="progress-line" role="progressbar" aria-valuenow={faites} aria-valuemin={0} aria-valuemax={total} aria-label={T.seance.seriesFaites}><i style={{ width: `${(faites / total) * 100}%` }} /></div>
        <div className="progress-meta"><span><b className="num" style={{ color: "var(--ink)", fontSize: 14 }}>{faites}</b> / {total} {T.seance.series}</span><span>{fini ? T.seance.termine : T.seance.restantes(total - faites)}</span></div>
      </div>

      <div className="stack">
        {jour.lignes.map((l, i) => {
          const st = etats[i] ?? { done: 0, charge: "", amrap: null, note: "" };
          const exFini = st.done >= l.sets;
          const lv = parseKg(st.charge);
          const r = st.amrap && l.cible && lv !== null ? amrapNext(st.amrap, l.cible, lv, l.c, props.deload) : null;
          const rCol = r ? (r.verdict === "MONTER" ? "var(--ok)" : r.verdict === "BAISSER" ? "var(--ko)" : "var(--gold)") : "";

          return (
            <article key={`${jour.d}-${i}`} className={`panel ex-card ${exFini ? "done" : ""}`}>
              <div className="ex-top">
                <div className="row-main">
                  <FicheExercice nom={l.n} />
                  <div className="row-sub">
                    <span className="num" style={{ color: "var(--ink-2)", fontSize: 14 }}>{l.sets} × {tc(lang, l.r)}</span>
                    {l.rir !== "-" && ` · RIR ${l.rir}`}
                    {l.drop && <span className="gold"> · {T.programme.dropSet}</span>}
                  </div>
                  <div className="row-sub" style={{ marginTop: 4 }}>{tc(lang, l.note)}</div>
                </div>
                {l.suivi && (
                  <label className="kg-wrap">
                    <input className="kg" placeholder="—" inputMode="decimal" aria-label={T.seance.charge(tc(lang, l.n))} value={st.charge} onChange={(e) => maj(i, { charge: e.target.value })} />
                  </label>
                )}
              </div>

              {l.suggestion !== null ? (
                <div className={`hint ${l.changementPhase ? "hint-gold" : "hint-ok"}`}>
                  {l.changementPhase ? (
                    <>{l.suggestionTxt}. {T.seance.phase}</>
                  ) : (
                    <>{T.seance.derniereFois} {kg(l.derniereCharge)} kg · {l.suggestionTxt}</>
                  )}
                </div>
              ) : l.derniereCharge !== null ? (
                <div className="hint hint-plain">{T.seance.derniereFois} : {kg(l.derniereCharge)} kg</div>
              ) : null}

              <div className="sets" role="group" aria-label={T.seance.series}>
                {Array.from({ length: l.sets }, (_, k) => (
                  <button key={k} type="button" className={`set ${k < st.done ? "done" : ""}`} aria-pressed={k < st.done} aria-label={T.seance.serie(k + 1)} onClick={() => cocher(i, k)}>
                    {k < st.done ? <Icon nom="check" taille={20} /> : k + 1}
                  </button>
                ))}
              </div>

              {exFini && l.rir !== "-" && l.cible && (
                <div className="amrap">
                  <div className="row-title">{T.seance.combienReps}</div>
                  <div className="row-sub">{T.seance.repMoche}</div>
                  <div className="stepper">
                    <button type="button" aria-label={T.seance.moinsUne} onClick={() => maj(i, { amrap: Math.max(0, (st.amrap ?? l.cible ?? 0) - 1) })}><Icon nom="moins" taille={18} /></button>
                    <input className="kg" inputMode="numeric" placeholder={String(l.cible)} aria-label={T.seance.repsDerniere}
                      value={st.amrap ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); maj(i, { amrap: isNaN(n) ? null : Math.max(0, Math.min(100, n)) }); }} />
                    <button type="button" aria-label={T.seance.plusUne} onClick={() => maj(i, { amrap: Math.min(100, (st.amrap ?? l.cible ?? 0) + 1) })}><Icon nom="plus" taille={18} /></button>
                  </div>
                  {r && lv !== null && (
                    <div className="verdict" style={{ borderColor: rCol }}>
                      <div style={{ color: rCol, fontWeight: 600, fontSize: 14 }}>{T.seance.prochaine} : {amrapTexte(r, lv, lang)}</div>
                      <div className="row-sub">{raisonTexte(r.raison, lang)}</div>
                    </div>
                  )}
                  <input className="input" placeholder={T.seance.note} value={st.note} maxLength={500}
                    style={{ height: 44, fontSize: 14, marginTop: 12 }} onChange={(e) => maj(i, { note: e.target.value })} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {fini && (
        <section className="panel panel-hero section" style={{ textAlign: "center" }}>
          <h2 className="today-title" style={{ fontSize: 30 }}>{T.seance.terminee}</h2>
          <p className="today-sub" style={{ margin: "8px auto 18px", maxWidth: "42ch" }}>{T.seance.bienJoue}</p>
          {erreur && <p className="form-err" style={{ marginBottom: 12 }}>{erreur}</p>}
          <button type="button" className="btn btn-primary btn-block" disabled={pending} onClick={enregistrer}>{pending ? T.seance.enregistrement : T.seance.enregistrer}</button>
        </section>
      )}

      {repos !== null && (
        <div className="timer" role="dialog" aria-label={T.seance.repos}>
          <div className="meta">{T.seance.repos}</div>
          <div className="ring">
            <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden>
              <circle className="ring-track" cx="100" cy="100" r="86" />
              <circle className="ring-fill" cx="100" cy="100" r="86" stroke="var(--gold)" strokeDasharray={540.4} strokeDashoffset={540.4 * (1 - repos / REPOS_S)} />
            </svg>
            <div className="ring-center"><span className="num" aria-live="polite">{repos}</span><span>{T.seance.secondes}</span></div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={stopRepos}>{T.seance.passerRepos}</button>
        </div>
      )}
    </div>
  );
}

function celebrer() {
  const em = ["🔥", "💪", "⭐", "🏆", "✨"];
  for (let i = 0; i < 18; i++) {
    const e = document.createElement("div");
    e.className = "confetti";
    e.textContent = em[i % em.length];
    e.style.left = 8 + Math.random() * 84 + "%";
    e.style.top = 55 + Math.random() * 30 + "%";
    e.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 1800);
  }
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
}
