"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

/* ═══ Chronomètre et minuteur ═══
   L'état est gardé dans le téléphone (heure de départ + temps cumulé) :
   on peut changer de page ou verrouiller l'écran, le temps continue de compter. */

const CLE_CHRONO = "ptmouss.chrono";
const CLE_MINUTEUR = "ptmouss.minuteur";

type EtatChrono = { debut: number | null; cumul: number; tours: number[] };
type EtatMinuteur = { mode: "simple" | "intervalles"; duree: number; travail: number; repos: number; nb: number; debut: number | null; cumul: number };

const CHRONO0: EtatChrono = { debut: null, cumul: 0, tours: [] };
const MINUTEUR0: EtatMinuteur = { mode: "simple", duree: 60, travail: 40, repos: 20, nb: 8, debut: null, cumul: 0 };

const lire = <T,>(cle: string, defaut: T): T => {
  try { const v = localStorage.getItem(cle); return v ? { ...defaut, ...JSON.parse(v) } : defaut; } catch { return defaut; }
};
const ecrire = (cle: string, v: unknown) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch {} };

const ecoule = (e: { debut: number | null; cumul: number }, now: number) => e.cumul + (e.debut ? Math.max(0, now - e.debut) : 0);

/** 1:05.32 — minutes:secondes.centièmes (heures si besoin) */
function fmtChrono(ms: number) {
  const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
  const p = (n: number) => String(n).padStart(2, "0");
  return { principal: h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`, cs: p(cs) };
}
const fmtMinSec = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/* Rafraîchissement à l'écran tant que ça tourne */
function useHorloge(actif: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!actif) return;
    let id = 0;
    const boucle = () => { setNow(Date.now()); id = requestAnimationFrame(boucle); };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [actif]);
  return now;
}

/* Son court (Web Audio) + vibration */
function useBip() {
  const ctx = useRef<AudioContext | null>(null);
  const armer = useCallback(() => {
    try {
      ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      void ctx.current.resume();
    } catch {}
  }, []);
  const bip = useCallback((freq = 880, duree = 0.12, fort = false) => {
    const c = ctx.current;
    if (c) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(fort ? 0.5 : 0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duree);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + duree);
    }
    if (navigator.vibrate) navigator.vibrate(fort ? [120, 60, 120] : 60);
  }, []);
  return { armer, bip };
}

/* Garde l'écran allumé pendant le minuteur (si le téléphone le permet) */
function useEcranAllume(actif: boolean) {
  useEffect(() => {
    if (!actif || !("wakeLock" in navigator)) return;
    let verrou: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((v) => (verrou = v)).catch(() => {});
    return () => { void verrou?.release(); };
  }, [actif]);
}

export function Chrono({ initial }: { initial: "chrono" | "minuteur" }) {
  const { T } = useLang();
  const [onglet, setOnglet] = useState(initial);
  return (
    <>
      <div className="lang-switch" role="tablist" style={{ marginBottom: 18 }}>
        {(["chrono", "minuteur"] as const).map((o) => (
          <button key={o} type="button" role="tab" aria-selected={onglet === o} className={onglet === o ? "on" : ""} onClick={() => setOnglet(o)}>
            {o === "chrono" ? T.chrono.chrono : T.chrono.minuteur}
          </button>
        ))}
      </div>
      {onglet === "chrono" ? <Chronometre /> : <Minuteur />}
    </>
  );
}

/* ─── Chronomètre avec tours ─── */
function Chronometre() {
  const { T } = useLang();
  const C = T.chrono;
  const [e, setE] = useState<EtatChrono>(CHRONO0);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- état gardé dans le navigateur, absent au rendu serveur
  useEffect(() => setE(lire(CLE_CHRONO, CHRONO0)), []);
  const maj = (n: EtatChrono) => { setE(n); ecrire(CLE_CHRONO, n); };
  const now = useHorloge(!!e.debut);
  const t = ecoule(e, now);
  const { principal, cs } = fmtChrono(t);

  const demarrer = () => maj({ ...e, debut: Date.now() });
  const pause = () => maj({ ...e, debut: null, cumul: ecoule(e, Date.now()) });
  const tour = () => maj({ ...e, tours: [...e.tours, ecoule(e, Date.now())] });
  const raz = () => maj(CHRONO0);

  const splits = e.tours.map((x, i) => x - (e.tours[i - 1] ?? 0));
  const min = splits.length > 2 ? Math.min(...splits) : -1;
  const max = splits.length > 2 ? Math.max(...splits) : -1;

  return (
    <>
      <section className="panel chrono-cadran">
        <div className="chrono-temps num" aria-live="off">{principal}<span className="chrono-cs">.{cs}</span></div>
        {e.tours.length > 0 && <div className="meta num" style={{ marginTop: 6 }}>{C.tourN(e.tours.length + 1)} · {fmtChrono(t - e.tours[e.tours.length - 1]).principal}.{fmtChrono(t - e.tours[e.tours.length - 1]).cs}</div>}
      </section>

      <div className="chrono-boutons">
        {e.debut ? (
          <button type="button" className="btn btn-ghost" onClick={tour}><Icon nom="drapeau" taille={18} /> {C.tour}</button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={raz} disabled={!t}><Icon nom="reset" taille={18} /> {C.reinitialiser}</button>
        )}
        {e.debut ? (
          <button type="button" className="btn btn-primary" onClick={pause}><Icon nom="pause" taille={18} /> {C.pause}</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={demarrer}><Icon nom="play" taille={18} /> {t ? C.reprendre : C.demarrer}</button>
        )}
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{C.tours}</h2>
          {e.tours.length > 0 && <button type="button" className="link" style={{ fontSize: 13.5 }} onClick={() => maj({ ...e, tours: [] })}>{C.effacer}</button>}
        </div>
        {e.tours.length ? (
          <div className="panel" style={{ padding: "4px 18px" }}>
            <table className="tbl">
              <tbody>
                {splits.map((sp, i) => ({ sp, i })).reverse().map(({ sp, i }) => (
                  <tr key={i}>
                    <td>{C.tourN(i + 1)}{sp === min && <span className="ok" style={{ fontSize: 12 }}> · {C.meilleur}</span>}{sp === max && <span className="ko" style={{ fontSize: 12 }}> · {C.plusLent}</span>}</td>
                    <td className="num" style={{ textAlign: "right" }}>{fmtChrono(sp).principal}.{fmtChrono(sp).cs}</td>
                    <td className="num muted" style={{ textAlign: "right" }}>{fmtChrono(e.tours[i]).principal}.{fmtChrono(e.tours[i]).cs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="meta">{C.aucunTour}</p>
        )}
      </section>
    </>
  );
}

/* ─── Minuteur : simple ou en intervalles ─── */
type Phase = { type: "travail" | "repos"; tour: number; restant: number; duree: number };

function phaseActuelle(m: EtatMinuteur, ms: number): Phase | null {
  if (m.mode === "simple") {
    const restant = m.duree * 1000 - ms;
    return restant > 0 ? { type: "travail", tour: 1, restant, duree: m.duree } : null;
  }
  let t = ms;
  for (let i = 1; i <= m.nb; i++) {
    if (t < m.travail * 1000) return { type: "travail", tour: i, restant: m.travail * 1000 - t, duree: m.travail };
    t -= m.travail * 1000;
    if (i === m.nb) break;
    if (t < m.repos * 1000) return { type: "repos", tour: i, restant: m.repos * 1000 - t, duree: m.repos };
    t -= m.repos * 1000;
  }
  return null;
}
const totalSec = (m: EtatMinuteur) => (m.mode === "simple" ? m.duree : m.nb * m.travail + (m.nb - 1) * m.repos);

function Pas({ lb, val, set, pas, min, max, fmt }: { lb: string; val: number; set: (v: number) => void; pas: number; min: number; max: number; fmt?: (v: number) => string }) {
  return (
    <div className="pas">
      <span className="meta">{lb}</span>
      <div className="pas-ctl">
        <button type="button" className="btn btn-ghost btn-sm" aria-label={`${lb} −`} onClick={() => set(Math.max(min, val - pas))}><Icon nom="moins" taille={16} /></button>
        <span className="num">{fmt ? fmt(val) : val}</span>
        <button type="button" className="btn btn-ghost btn-sm" aria-label={`${lb} +`} onClick={() => set(Math.min(max, val + pas))}><Icon nom="plus" taille={16} /></button>
      </div>
    </div>
  );
}

function Minuteur() {
  const { T } = useLang();
  const C = T.chrono;
  const [m, setM] = useState<EtatMinuteur>(MINUTEUR0);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- état gardé dans le navigateur, absent au rendu serveur
  useEffect(() => setM(lire(CLE_MINUTEUR, MINUTEUR0)), []);
  const maj = useCallback((n: EtatMinuteur) => { setM(n); ecrire(CLE_MINUTEUR, n); }, []);
  const { armer, bip } = useBip();
  const tourne = !!m.debut;
  const now = useHorloge(tourne);
  useEcranAllume(tourne);

  const ms = ecoule(m, now);
  const ph = phaseActuelle(m, ms);
  const fini = ms > 0 && !ph;
  const enCours = ms > 0 && !fini;

  /* Bips : 3-2-1 avant chaque fin de phase, signal fort au changement et à la fin */
  const dernier = useRef("");
  useEffect(() => {
    if (!tourne) return;
    const sec = ph ? Math.ceil(ph.restant / 1000) : 0;
    const cle = ph ? `${ph.type}${ph.tour}:${sec}` : "fin";
    if (cle === dernier.current) return;
    const avant = dernier.current;
    dernier.current = cle;
    if (!ph) {
      bip(1046, 0.6, true);
      /* Arrêt en fin de minuteur (hors du rendu de l'effet) */
      setTimeout(() => maj({ ...m, debut: null, cumul: totalSec(m) * 1000 }), 0);
      return;
    }
    if (avant && !avant.startsWith(`${ph.type}${ph.tour}:`)) bip(ph.type === "travail" ? 988 : 660, 0.35, true);
    else if (sec <= 3 && sec >= 1 && ph.duree > 5) bip(740, 0.1);
  }, [tourne, ph, m, bip, maj]);

  const demarrer = () => { armer(); dernier.current = ""; maj({ ...m, debut: Date.now(), cumul: fini ? 0 : m.cumul }); };
  const pause = () => maj({ ...m, debut: null, cumul: ecoule(m, Date.now()) });
  const raz = () => { dernier.current = ""; maj({ ...m, debut: null, cumul: 0 }); };
  const regler = (p: Partial<EtatMinuteur>) => maj({ ...m, ...p, debut: null, cumul: 0 });

  const affiche = ph ? Math.ceil(ph.restant / 1000) : fini ? 0 : m.mode === "simple" ? m.duree : m.travail;
  const part = ph ? ph.restant / (ph.duree * 1000) : fini ? 0 : 1;
  const repos = ph?.type === "repos";

  return (
    <>
      <section className={`panel minuteur${repos ? " en-repos" : ""}`}>
        {m.mode === "intervalles" && (
          <div className="meta" style={{ textAlign: "center" }}>
            {fini ? C.termine : `${repos ? C.phaseRepos : C.phaseTravail} · ${C.tourSur(ph?.tour ?? 1, m.nb)}`}
          </div>
        )}
        <div className="ring minuteur-ring">
          <svg width="220" height="220" viewBox="0 0 200 200" aria-hidden>
            <circle className="ring-track" cx="100" cy="100" r="86" />
            <circle className="ring-fill" cx="100" cy="100" r="86" stroke={repos ? "var(--ok)" : "var(--gold)"} strokeDasharray={540.4} strokeDashoffset={540.4 * (1 - part)} style={{ transition: tourne ? "stroke-dashoffset .25s linear" : undefined }} />
          </svg>
          <div className="ring-center"><span className="num" aria-live="polite">{fmtMinSec(affiche)}</span></div>
        </div>
        {fini && m.mode === "simple" && <p className="ok" style={{ textAlign: "center", fontWeight: 600 }}>{C.termine}</p>}
        {tourne && <p className="meta" style={{ textAlign: "center", fontSize: 12.5 }}>{C.ecranAllume}</p>}
      </section>

      <div className="chrono-boutons">
        <button type="button" className="btn btn-ghost" onClick={raz} disabled={!ms}><Icon nom="reset" taille={18} /> {C.reinitialiser}</button>
        {tourne ? (
          <button type="button" className="btn btn-primary" onClick={pause}><Icon nom="pause" taille={18} /> {C.pause}</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={demarrer}><Icon nom="play" taille={18} /> {enCours ? C.reprendre : C.demarrer}</button>
        )}
      </div>

      {!enCours && (
        <section className="section panel">
          <div className="lang-switch" role="radiogroup" style={{ marginBottom: 16 }}>
            {(["simple", "intervalles"] as const).map((md) => (
              <button key={md} type="button" role="radio" aria-checked={m.mode === md} className={m.mode === md ? "on" : ""} onClick={() => regler({ mode: md })}>
                {md === "simple" ? C.simple : C.intervalles}
              </button>
            ))}
          </div>
          {m.mode === "simple" ? (
            <>
              <Pas lb={C.minuteur} val={m.duree} set={(v) => regler({ duree: v })} pas={15} min={5} max={3600} fmt={fmtMinSec} />
              <div className="meta" style={{ margin: "16px 0 8px" }}>{C.preset}</div>
              <div className="puces">
                {[30, 45, 60, 90, 120, 180, 300].map((s) => (
                  <button key={s} type="button" className={`puce${m.duree === s ? " on" : ""}`} onClick={() => regler({ duree: s })}>{s < 60 ? `${s} s` : fmtMinSec(s)}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Pas lb={C.travail} val={m.travail} set={(v) => regler({ travail: v })} pas={5} min={5} max={600} fmt={fmtMinSec} />
              <Pas lb={C.repos} val={m.repos} set={(v) => regler({ repos: v })} pas={5} min={0} max={600} fmt={fmtMinSec} />
              <Pas lb={C.nbTours} val={m.nb} set={(v) => regler({ nb: v })} pas={1} min={1} max={50} />
              <div className="pas" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <span className="meta">{C.total}</span><span className="num" style={{ fontSize: 18 }}>{fmtMinSec(totalSec(m))}</span>
              </div>
              <div className="puces" style={{ marginTop: 12 }}>
                <button type="button" className="puce" onClick={() => regler({ travail: 20, repos: 10, nb: 8 })}>{C.tabata}</button>
                <button type="button" className="puce" onClick={() => regler({ travail: 40, repos: 20, nb: 6 })}>40/20 × 6</button>
                <button type="button" className="puce" onClick={() => regler({ travail: 45, repos: 15, nb: 10 })}>45/15 × 10</button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
