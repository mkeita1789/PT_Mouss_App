import { chargesParExercice, type SeanceFaite } from "@/lib/data";
import { amrapNext } from "@/lib/coaching/amrap";
import { Icon } from "./Icon";

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

/** Courbe des charges : aire dégradée, points, échelle min/max */
function Courbe({ pts }: { pts: { kg: number; date: string }[] }) {
  const W = 320, H = 96, px = 6, py = 10;
  const vals = pts.map((p) => p.kg);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xy = vals.map((v, i) => [
    pts.length === 1 ? W / 2 : px + (i * (W - 2 * px)) / (pts.length - 1),
    H - py - ((v - min) / span) * (H - 2 * py),
  ]);
  const ligne = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const aire = `${ligne} L${xy[xy.length - 1][0].toFixed(1)},${H} L${xy[0][0].toFixed(1)},${H} Z`;
  const monte = vals[vals.length - 1] >= vals[0];
  const col = monte ? "var(--gold)" : "var(--ko)";
  const id = `g${Math.round(min * 100)}${pts.length}${Math.round(max)}`;
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Charges successives : ${vals.map(fmt).join(", ")} kg`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={col} stopOpacity="0.28" />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={W} y1={py} y2={py} stroke="rgba(255,255,255,.06)" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2={W} y1={H - py} y2={H - py} stroke="rgba(255,255,255,.06)" vectorEffect="non-scaling-stroke" />
        {pts.length > 1 && <path d={aire} fill={`url(#${id})`} />}
        {pts.length > 1 && <path d={ligne} fill="none" stroke={col} strokeWidth="2.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.5} fill={i === xy.length - 1 ? col : "var(--surface)"} stroke={col} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="chart-axis">
        <span>{dateCourte(pts[0].date)}</span>
        <span>{fmt(min)} à {fmt(max)} kg</span>
        <span>{dateCourte(pts[pts.length - 1].date)}</span>
      </div>
    </>
  );
}

/** Progression des charges par exercice — partagée entre le client et le coach */
export function ProgressionCharges({ historique }: { historique: SeanceFaite[] }) {
  const parEx = Object.entries(chargesParExercice(historique)).sort((a, b) => b[1].length - a[1].length);
  if (!parEx.length)
    return <div className="panel meta">Aucune charge enregistrée pour l'instant. Elles apparaîtront ici après la première séance.</div>;

  return (
    <div className="grid-2">
      {parEx.map(([nom, pts]) => {
        const last = pts[pts.length - 1];
        const gain = last.kg - pts[0].kg;
        const rpe = last.amrap && last.cible ? amrapNext(last.amrap, last.cible, last.kg, "A")?.rpe : null;
        return (
          <article key={nom} className="panel chart-card">
            <div className="section-head" style={{ marginBottom: 0, alignItems: "flex-start" }}>
              <div>
                <div className="row-title">{nom}</div>
                <div className="row-sub">
                  {pts.length} séance{pts.length > 1 ? "s" : ""}
                  {last.amrap && last.cible ? ` · dernière série ${last.amrap}/${last.cible}${rpe ? `, RPE ~${fmt(rpe)}` : ""}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="num" style={{ fontSize: 24, lineHeight: 1 }}>{fmt(last.kg)}<small className="muted" style={{ fontSize: 13, marginLeft: 3 }}>kg</small></div>
                {pts.length > 1 && (
                  <div className={`delta ${gain > 0 ? "ok" : gain < 0 ? "ko" : "muted"}`}>{gain > 0 ? "+" : ""}{fmt(gain)} kg</div>
                )}
              </div>
            </div>
            <Courbe pts={pts} />
          </article>
        );
      })}
    </div>
  );
}

/** Historique détaillé des séances */
export function HistoriqueSeances({ historique, limite = 20 }: { historique: SeanceFaite[]; limite?: number }) {
  if (!historique.length) return <div className="panel meta">Aucune séance enregistrée pour l'instant.</div>;
  return (
    <div className="panel" style={{ padding: "6px 18px" }}>
      <div className="rows">
        {historique.slice(0, limite).map((s) => {
          const d = new Date(s.realisee_le);
          const charges = s.seance_exercices.filter((e) => e.charge_kg !== null).length;
          return (
            <details key={s.id} className="session row-item" style={{ display: "block" }}>
              <summary>
                <span className="date-tile">
                  <span className="num">{d.toLocaleDateString("fr-FR", { day: "numeric", timeZone: "Europe/Paris" })}</span>
                  <span>{d.toLocaleDateString("fr-FR", { month: "short", timeZone: "Europe/Paris" }).replace(".", "")}</span>
                </span>
                <span className="row-main">
                  <span className="row-title" style={{ display: "block" }}>
                    <span className="num" style={{ fontSize: 16, letterSpacing: ".02em" }}>{s.jour_code}</span>
                    <span className="ink-2" style={{ fontWeight: 400 }}> · {s.focus}</span>
                  </span>
                  <span className="row-sub" style={{ display: "block" }}>
                    {s.phase ? `${s.phase} · ` : ""}{s.seance_exercices.length} exercices{charges ? `, ${charges} chargés` : ""}{s.allegee ? " · allégée" : ""}
                  </span>
                </span>
                <span className="chev"><Icon nom="fleche" taille={18} /></span>
              </summary>
              <table className="tbl" style={{ margin: "12px 0 6px" }}>
                <thead>
                  <tr><th>Exercice</th><th>Séries</th><th>Charge</th><th>Dern. série</th></tr>
                </thead>
                <tbody>
                  {s.seance_exercices.map((e) => {
                    const rate = e.amrap !== null && e.cible !== null && e.amrap < e.cible;
                    return (
                      <tr key={e.position}>
                        <td>{e.nom}{e.note && <div className="row-sub">« {e.note} »</div>}</td>
                        <td>{e.series}</td>
                        <td className="num">{e.charge_kg !== null ? `${fmt(e.charge_kg)} kg` : "—"}</td>
                        <td className={rate ? "ko" : undefined}>{e.amrap !== null ? `${e.amrap}${e.cible ? `/${e.cible}` : ""}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>
    </div>
  );
}
