"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enregistrerBilan } from "@/app/(app)/actions";
import { questionsBilan } from "@/lib/coaching/programme";
import type { Bilan } from "@/lib/coaching/types";

export function BilanWizard({ initial, existe }: { initial: Partial<Bilan>; existe: boolean }) {
  const router = useRouter();
  const [rep, setRep] = useState<Partial<Bilan>>(initial);
  const [idx, setIdx] = useState(0);
  const [recommencer, setRecommencer] = useState(!existe);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();

  const QS = questionsBilan(rep);
  const q = QS[Math.min(idx, QS.length - 1)];
  const val = rep[q.k];
  const ok = q.type === "text" ? String(val ?? "").trim().length > 0 : !!val;
  const dernier = idx >= QS.length - 1;

  const suivant = () => {
    if (!dernier) return setIdx(idx + 1);
    start(async () => {
      const r = await enregistrerBilan(rep, recommencer);
      if (r.erreur) return setErreur(r.erreur);
      router.push("/programme");
    });
  };

  return (
    <>
      <div className="h1">Ton bilan</div>
      <div className="sub">Question {idx + 1} / {QS.length}</div>
      <div className="progress-dots">
        {QS.map((_, i) => (
          <div key={i} className={`pdot ${i <= idx ? "on" : ""}`} />
        ))}
      </div>

      <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 600, fontSize: 19, textTransform: "uppercase", margin: "6px 0 14px" }}>{q.q}</div>

      {q.type === "text" ? (
        <input
          className="input"
          placeholder={q.ph}
          value={String(val ?? "")}
          maxLength={40}
          autoFocus
          onChange={(e) => setRep({ ...rep, [q.k]: e.target.value })}
        />
      ) : (
        q.o!.map((o) => (
          <button
            key={o}
            type="button"
            className={`choice ${val === o ? "sel" : ""}`}
            style={{ width: "100%", textAlign: "left", color: "inherit", font: "inherit" }}
            onClick={() => setRep({ ...rep, [q.k]: o })}
          >
            {o}
            <span className="chk">✓</span>
          </button>
        ))
      )}

      {dernier && existe && (
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, marginTop: 16, color: "var(--muted)" }}>
          <input type="checkbox" checked={recommencer} onChange={(e) => setRecommencer(e.target.checked)} />
          Recommencer le cycle à la semaine 1
        </label>
      )}

      {erreur && <p className="form-err" style={{ marginTop: 12 }}>{erreur}</p>}

      <div className="row" style={{ marginTop: 20 }}>
        {idx > 0 && (
          <button type="button" className="btn s" onClick={() => setIdx(idx - 1)}>Retour</button>
        )}
        <button type="button" className="btn p" disabled={!ok || pending} onClick={suivant}>
          {pending ? "…" : dernier ? "Voir mon programme" : "Suivant"}
        </button>
      </div>
    </>
  );
}
