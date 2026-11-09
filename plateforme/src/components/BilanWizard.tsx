"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enregistrerBilan } from "@/app/(app)/actions";
import { questionsBilan } from "@/lib/coaching/programme";
import type { Bilan } from "@/lib/coaching/types";
import { Icon } from "./Icon";

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
    <div className="reveal" style={{ maxWidth: 620 }}>
      <header className="page-head" style={{ paddingBottom: 0 }}>
        <div className="meta">Bilan · question {idx + 1} sur {QS.length}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{q.q}</h1>
      </header>
      <div className="steps" aria-hidden>
        {QS.map((_, i) => <i key={i} className={i <= idx ? "on" : ""} />)}
      </div>

      {q.type === "text" ? (
        <input className="input" placeholder={q.ph} value={String(val ?? "")} maxLength={40} autoFocus aria-label={q.q}
          onChange={(e) => setRep({ ...rep, [q.k]: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && ok && suivant()} />
      ) : (
        <div role="radiogroup" aria-label={q.q}>
          {q.o!.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={val === o} className={`choice ${val === o ? "sel" : ""}`} onClick={() => setRep({ ...rep, [q.k]: o })}>
              {o}
              <span className="tick"><Icon nom="check" taille={14} /></span>
            </button>
          ))}
        </div>
      )}

      {dernier && existe && (
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, marginTop: 18, color: "var(--ink-2)" }}>
          <input type="checkbox" checked={recommencer} onChange={(e) => setRecommencer(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--gold)" }} />
          Recommencer le cycle à la semaine 1
        </label>
      )}

      {erreur && <p className="form-err">{erreur}</p>}

      <div className="btn-row" style={{ marginTop: 26 }}>
        {idx > 0 && (
          <button type="button" className="btn btn-ghost" style={{ flex: "0 0 auto" }} onClick={() => setIdx(idx - 1)} aria-label="Question précédente">
            <Icon nom="retour" taille={18} />
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={!ok || pending} onClick={suivant}>
          {pending ? "Enregistrement…" : dernier ? "Voir mon programme" : "Continuer"}
        </button>
      </div>
    </div>
  );
}
