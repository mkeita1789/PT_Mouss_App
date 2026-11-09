import { chargesParExercice, type SeanceFaite } from "@/lib/data";
import { amrapNext } from "@/lib/coaching/amrap";

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" });

/** Mini-courbe SVG des charges successives */
function Courbe({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const W = 300, H = 46, pad = 5;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const xy = pts.map((v, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - ((v - min) / span) * (H - 2 * pad)]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const monte = pts[pts.length - 1] >= pts[0];
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Charges : ${pts.map(fmt).join(", ")} kg`}>
      <path d={d} fill="none" stroke={monte ? "var(--ok)" : "var(--ko)"} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={i === xy.length - 1 ? "var(--gold)" : "var(--panel2)"} stroke="var(--gold)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Progression des charges par exercice — partagé entre le client et le coach */
export function ProgressionCharges({ historique }: { historique: SeanceFaite[] }) {
  const parEx = Object.entries(chargesParExercice(historique)).sort((a, b) => b[1].length - a[1].length);
  if (!parEx.length)
    return <div className="card muted" style={{ fontSize: 13 }}>Aucune charge enregistrée pour l'instant.</div>;

  return (
    <div className="coach-grid">
      {parEx.map(([nom, pts]) => {
        const first = pts[0].kg, last = pts[pts.length - 1];
        const gain = last.kg - first;
        const rpe = last.amrap && last.cible ? amrapNext(last.amrap, last.cible, last.kg, "A")?.rpe : null;
        return (
          <div key={nom} className="card anim-item" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{nom}</div>
              <div style={{ fontFamily: "var(--font-oswald)", color: "var(--gold)", fontSize: 15, whiteSpace: "nowrap" }}>{fmt(last.kg)} kg</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 6px" }}>
              {pts.length} séance{pts.length > 1 ? "s" : ""}
              {pts.length > 1 && (
                <> · <span style={{ color: gain > 0 ? "var(--ok)" : gain < 0 ? "var(--ko)" : "var(--muted)" }}>{gain > 0 ? "+" : ""}{fmt(gain)} kg</span> depuis le {dateCourte(pts[0].date)}</>
              )}
              {last.amrap && last.cible ? <> · dernière série {last.amrap}/{last.cible} reps{rpe ? ` (RPE ~${fmt(rpe)})` : ""}</> : null}
            </div>
            <Courbe pts={pts.map((p) => p.kg)} />
          </div>
        );
      })}
    </div>
  );
}

/** Historique détaillé des séances */
export function HistoriqueSeances({ historique, limite = 20 }: { historique: SeanceFaite[]; limite?: number }) {
  if (!historique.length) return <div className="card muted" style={{ fontSize: 13 }}>Aucune séance enregistrée.</div>;
  return (
    <>
      {historique.slice(0, limite).map((s) => (
        <details key={s.id} className="card anim-item">
          <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>
              <b style={{ fontFamily: "var(--font-oswald)", letterSpacing: ".04em" }}>{s.jour_code}</b>
              <span className="muted" style={{ fontSize: 12 }}> · {s.focus}{s.allegee ? " · allégée" : ""}</span>
            </span>
            <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {new Date(s.realisee_le).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" })}
            </span>
          </summary>
          {s.phase && <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Phase : {s.phase}</div>}
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead>
              <tr><th>Exercice</th><th>Séries</th><th>Charge</th><th>Dern. série</th></tr>
            </thead>
            <tbody>
              {s.seance_exercices.map((e) => {
                const rate = e.amrap !== null && e.cible !== null && e.amrap < e.cible;
                return (
                  <tr key={e.position}>
                    <td>
                      {e.nom}
                      {e.note && <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>« {e.note} »</div>}
                    </td>
                    <td>{e.series}</td>
                    <td className="num">{e.charge_kg !== null ? `${fmt(e.charge_kg)} kg` : "—"}</td>
                    <td style={{ color: rate ? "var(--ko)" : undefined }}>{e.amrap !== null ? `${e.amrap}${e.cible ? `/${e.cible}` : ""}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      ))}
    </>
  );
}
