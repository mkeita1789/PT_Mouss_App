"use client";

import { useState, useTransition } from "react";
import { enregistrerCheckin } from "@/app/(app)/actions";
import { CHECKIN_Q } from "@/lib/coaching/programme";
import type { Checkin } from "@/lib/coaching/types";
import { Icon } from "./Icon";

export function CheckinCard() {
  const [step, setStep] = useState(0);
  const [rep, setRep] = useState<Partial<Checkin>>({});
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();
  const q = CHECKIN_Q[step];

  const choisir = (o: string) => {
    const next = { ...rep, [q.k]: o };
    setRep(next);
    if (step < CHECKIN_Q.length - 1) return setStep(step + 1);
    start(async () => {
      const r = await enregistrerCheckin(next as Checkin);
      if (r.erreur) setErreur(r.erreur);
      else if (navigator.vibrate) navigator.vibrate(40);
    });
  };

  return (
    <section className="panel" aria-label="Check-in du jour">
      <div className="section-head" style={{ marginBottom: 4 }}>
        <span className="section-title">Check-in du jour</span>
        <span className="meta">{step + 1} / {CHECKIN_Q.length}</span>
      </div>
      <div className="steps" style={{ margin: "10px 0 16px" }}>
        {CHECKIN_Q.map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}
      </div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{q.q}</div>
      {q.o.map((o) => (
        <button key={o} type="button" className={`choice ${rep[q.k] === o ? "sel" : ""}`} disabled={pending} onClick={() => choisir(o)}>
          {o}
          <span className="tick"><Icon nom="check" taille={14} /></span>
        </button>
      ))}
      {erreur && <p className="form-err">{erreur}</p>}
    </section>
  );
}
