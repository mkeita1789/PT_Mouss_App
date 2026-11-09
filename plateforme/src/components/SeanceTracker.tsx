"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { enregistrerSeance } from "@/app/(app)/actions";
import { FicheExercice } from "./FicheExercice";
import { amrapNext, amrapTexte, parseKg, RAISON_TXT } from "@/lib/coaching/amrap";
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
    <>
      <div style={{ display: "flex", gap: 6, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
        {props.jours.map((d, i) => (
          <button key={d.d} type="button" className={`btn ${i === jourIdx ? "p" : "s"}`} style={{ padding: "10px 6px", fontSize: 10.5, minWidth: 78, flex: 1 }} onClick={() => changerJour(i)}>
            {d.d}
          </button>
        ))}
      </div>

      {props.verdict && (
        <div className="card anim-item" style={{ marginTop: 12, border: `1.5px solid ${props.verdict.col}` }}>
          <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, color: props.verdict.col, textTransform: "uppercase", fontSize: 14 }}>
            {props.verdict.v === "REPORTER" ? "Séance à reporter" : "Séance allégée"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5, lineHeight: 1.55 }}>{props.verdict.msg}</div>
        </div>
      )}

      <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 19, textTransform: "uppercase", marginTop: 14, color: jour.crit ? "var(--ko)" : undefined }}>
        {jour.d} — {jour.f}
      </div>

      <button type="button" className="card anim-item" style={{ marginTop: 11, width: "100%", textAlign: "left", color: "inherit", font: "inherit", cursor: "pointer" }} onClick={() => setWarmOpen(!warmOpen)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>🔶 {props.echauffement.t}</div>
          <div style={{ color: "var(--gold)", fontFamily: "var(--font-oswald)" }}>{warmOpen ? "−" : "+"}</div>
        </div>
        {warmOpen && (
          <div style={{ marginTop: 9 }}>
            {props.echauffement.ex.map((x) => (
              <div key={x} style={{ fontSize: 12.5, color: "var(--muted)", padding: "4px 0", borderBottom: "1px solid var(--line)" }}>› {x}</div>
            ))}
          </div>
        )}
      </button>

      <div style={{ height: 6, background: "var(--panel2)", borderRadius: 4, marginTop: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(faites / total) * 100}%`, background: "var(--gold)", borderRadius: 4, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>{faites}/{total} séries</div>

      {jour.lignes.map((l, i) => {
        const st = etats[i] ?? { done: 0, charge: "", amrap: null, note: "" };
        const exFini = st.done >= l.sets;
        const lv = parseKg(st.charge);
        const r = st.amrap && l.cible && lv !== null ? amrapNext(st.amrap, l.cible, lv, l.c, props.deload) : null;
        const rCol = r ? (r.verdict === "MONTER" ? "var(--ok)" : r.verdict === "BAISSER" ? "var(--ko)" : "var(--gold)") : "";

        return (
          <div key={`${jour.d}-${i}`} className="card anim-item" style={exFini ? { borderColor: "rgba(78,208,122,.4)" } : undefined}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                  {exFini ? "✅ " : ""}
                  <FicheExercice nom={l.n} />
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {l.sets} × {l.r}
                  {l.rir !== "-" && ` · RIR ${l.rir}`}
                  {l.drop && <> · <span style={{ color: "var(--gold)" }}>DROP SET</span></>}
                </div>
              </div>
              {l.suivi && (
                <input className="kg-input" placeholder="kg" inputMode="decimal" aria-label={`Charge ${l.n} (kg)`} value={st.charge} onChange={(e) => maj(i, { charge: e.target.value })} />
              )}
            </div>

            {l.suggestion !== null ? (
              l.changementPhase ? (
                <div style={{ fontSize: 11.5, color: "var(--gold)", background: "rgba(245,184,65,.08)", borderLeft: "3px solid var(--gold)", borderRadius: 8, padding: "9px 11px", marginBottom: 8 }}>
                  <div>🔄 {l.suggestionTxt}</div>
                  <div style={{ color: "var(--muted)", fontSize: 10.5, marginTop: 4, lineHeight: 1.5 }}>Charge recalculée depuis ta performance du cycle. Vérifie à l'échauffement et ajuste si besoin.</div>
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: "var(--ok)", background: "rgba(70,213,131,.07)", borderRadius: 8, padding: "7px 10px", marginBottom: 8 }}>
                  💡 La dernière fois : {String(l.derniereCharge).replace(".", ",")} kg, {l.suggestionTxt}
                </div>
              )
            ) : l.derniereCharge !== null ? (
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>La dernière fois : {String(l.derniereCharge).replace(".", ",")} kg</div>
            ) : null}

            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>💡 {l.note}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {Array.from({ length: l.sets }, (_, k) => (
                <button key={k} type="button" className={`setbtn ${k < st.done ? "done" : ""}`} aria-label={`Série ${k + 1}`} onClick={() => cocher(i, k)}>
                  {k + 1}
                </button>
              ))}
            </div>

            {exFini && l.rir !== "-" && l.cible && (
              <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Dernière série : combien de reps ?</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 8 }}>Uniquement les reps propres. Une rep moche ne compte pas.</div>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <button type="button" className="rpechip" style={{ flex: "none", width: 44 }} onClick={() => maj(i, { amrap: Math.max(0, (st.amrap ?? l.cible ?? 0) - 1) })}>−</button>
                  <input className="kg-input" style={{ flex: 1, width: "auto" }} inputMode="numeric" placeholder={String(l.cible)} aria-label="Reps de la dernière série"
                    value={st.amrap ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); maj(i, { amrap: isNaN(n) ? null : Math.max(0, Math.min(100, n)) }); }} />
                  <button type="button" className="rpechip" style={{ flex: "none", width: 44 }} onClick={() => maj(i, { amrap: Math.min(100, (st.amrap ?? l.cible ?? 0) + 1) })}>+</button>
                </div>
                {r && lv !== null && (
                  <div style={{ marginTop: 9, background: "var(--panel2)", borderLeft: `3px solid ${rCol}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12.5, color: rCol, fontWeight: 600 }}>Prochaine séance : {amrapTexte(r, lv)}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{RAISON_TXT[r.raison]}</div>
                  </div>
                )}
                <input className="input" placeholder="Une note ? (sensation, technique…)" value={st.note} maxLength={500}
                  style={{ padding: 10, fontSize: 12.5, marginTop: 9 }} onChange={(e) => maj(i, { note: e.target.value })} />
              </div>
            )}
          </div>
        );
      })}

      {fini && (
        <div className="card gold anim-item" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 20, textTransform: "uppercase" }}>Séance terminée 🔥</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "9px 0 14px", lineHeight: 1.55 }}>
            Bien joué. Enregistre-la : tes charges et ta progression seront visibles par ton coach.
          </div>
          {erreur && <p className="form-err">{erreur}</p>}
          <button type="button" className="btn p" disabled={pending} onClick={enregistrer}>{pending ? "Enregistrement…" : "Enregistrer la séance"}</button>
        </div>
      )}

      {repos !== null && (
        <div className="timer-wrap">
          <div className="timer-ring">
            <svg width="190" height="190" aria-hidden>
              <circle className="track" cx="95" cy="95" r="54" />
              <circle className="fill" cx="95" cy="95" r="54" style={{ strokeDashoffset: 339 * (1 - repos / REPOS_S) }} />
            </svg>
            <div className="timer-num">
              <div className="t">{repos}s</div>
              <div className="l">Repos</div>
            </div>
          </div>
          <button type="button" className="btn p" style={{ maxWidth: 200, marginTop: 26 }} onClick={stopRepos}>Passer</button>
        </div>
      )}
    </>
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
