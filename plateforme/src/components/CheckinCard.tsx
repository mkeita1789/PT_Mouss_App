"use client";

import { useState, useTransition } from "react";
import { enregistrerCheckin } from "@/app/(app)/actions";
import { CHECKIN_Q } from "@/lib/coaching/programme";
import type { Checkin } from "@/lib/coaching/types";

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
    <div className="card gold glow anim-item">
      <div className="eyebrow" style={{ marginTop: 0 }}>
        Check-in du jour ({step + 1}/3) — 20 secondes
      </div>
      <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 600, fontSize: 17, textTransform: "uppercase", marginBottom: 11 }}>{q.q}</div>
      {q.o.map((o) => (
        <button
          key={o}
          type="button"
          className={`choice ${rep[q.k] === o ? "sel" : ""}`}
          style={{ padding: "12px 14px", fontSize: 14, width: "100%", textAlign: "left", color: "inherit", font: "inherit" }}
          disabled={pending}
          onClick={() => choisir(o)}
        >
          {o}
          <span className="chk">✓</span>
        </button>
      ))}
      {erreur && <p className="form-err">{erreur}</p>}
    </div>
  );
}
