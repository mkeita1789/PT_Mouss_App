import Link from "next/link";
import { redirect } from "next/navigation";
import { FicheExercice } from "@/components/FicheExercice";
import { getBilan, getUtilisateur } from "@/lib/data";
import { buildProgram, nutri, SRA, volumeUF } from "@/lib/coaching/programme";

export const metadata = { title: "Programme — PT Mouss IA" };

const CAT_COL: Record<string, string> = { S: "var(--ko)", A: "var(--gold)", P: "var(--ok)" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");

  const P = buildProgram(bilan.reponses, bilan.debut);
  const N = nutri(bilan.reponses);

  if (P.repos)
    return (
      <>
        <div className="card anim-item" style={{ borderColor: "rgba(229,72,77,.4)", textAlign: "center", padding: "26px 16px", marginTop: 18 }}>
          <div style={{ fontSize: 44 }}>🛑</div>
          <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 23, textTransform: "uppercase", marginTop: 10 }}>{P.phase}</div>
          <div style={{ fontFamily: "var(--font-oswald)", fontSize: 15, color: "var(--gold)", marginTop: 8 }}>{P.stats}</div>
        </div>
        <div className="card gold anim-item">
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{P.cle}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", borderLeft: "2px solid var(--gold)", paddingLeft: 11, marginTop: 11, lineHeight: 1.6 }}>{P.citation}</div>
        </div>
        <div className="card anim-item">
          <div className="eyebrow" style={{ marginTop: 0 }}>Ce que tu peux faire</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.9 }}>
            🚶 Marche · randonnée<br />🚴 Vélo (45-90 min)<br />🏊 Natation<br />🎾 Raquettes<br />😴 <b style={{ color: "var(--ink)" }}>Et surtout : dormir.</b>
          </div>
        </div>
      </>
    );

  const uf = volumeUF(P);
  const col = uf > P.zone[1] + 10 ? "var(--ko)" : uf >= P.zone[0] ? "var(--ok)" : "var(--gold)";

  return (
    <>
      <div className="card gold glow anim-item" style={{ textAlign: "center", marginTop: 18 }}>
        <div style={{ fontSize: 28 }}>{P.icon}</div>
        <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 17, color: "var(--gold)", textTransform: "uppercase", marginTop: 5 }}>Protocole {P.proto}</div>
        {P.phase && <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 21, textTransform: "uppercase", marginTop: 9 }}>{P.phase}</div>}
        {P.stats && <div style={{ fontFamily: "var(--font-oswald)", fontSize: 13.5, color: "var(--gold)", marginTop: 5 }}>{P.stats}</div>}
        {P.deload && <div className="badge" style={{ background: "rgba(78,208,122,.12)", color: "var(--ok)", border: "1px solid var(--ok)", marginTop: 9 }}>Semaine légère</div>}
        {!P.officiel && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 7 }}>🔶 À valider par le coach</div>}
      </div>

      {P.phaseTip && (
        <div className="card anim-item" style={{ borderLeft: "3px solid var(--gold)" }}>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>📅 <b>Cette semaine :</b> {P.phaseTip}</div>
        </div>
      )}
      <div className="card anim-item" style={{ borderLeft: "3px solid var(--gold)" }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{P.cle}</div>
      </div>
      {P.neat && <div className="card anim-item" style={{ borderLeft: "3px solid var(--ok)", fontSize: 13.5 }}>{P.neat}</div>}

      {P.days.map((d) => (
        <div key={d.d} className={`card ${d.crit ? "" : "gold"} anim-item`} style={d.crit ? { borderColor: "rgba(229,72,77,.45)" } : undefined}>
          <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 18, color: d.crit ? "var(--ko)" : undefined }}>{d.d}</div>
          <div style={{ fontFamily: "var(--font-oswald)", fontSize: 10.5, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{d.f}</div>
          {d.ex.map((e, i) => (
            <div key={i} className="exline">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <FicheExercice nom={e.n} />
                  {SRA[e.c] ? (
                    <span className="badge" style={{ color: CAT_COL[e.c], border: "1px solid currentColor", marginLeft: 5, fontSize: 8, padding: "2px 5px" }}>{e.c}</span>
                  ) : null}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
                  {e.note}
                  {e.drop && <> · <span style={{ color: "var(--gold)" }}>DROP SET</span></>}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-oswald)", fontSize: 12.5, color: "var(--gold)", whiteSpace: "nowrap" }}>{e.s}×{e.r}</div>
              {e.rir !== "-" && <div style={{ fontSize: 10, color: "var(--muted)", minWidth: 40, textAlign: "right" }}>RIR {e.rir}</div>}
            </div>
          ))}
        </div>
      ))}

      {uf > 0 && (
        <div className="card gold anim-item">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 9 }}>
            <span className="muted">Volume hebdo</span>
            <b style={{ color: "var(--gold)" }}>{uf.toFixed(1)} UF</b>
          </div>
          <div style={{ height: 7, background: "var(--panel2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min((uf / 50) * 100, 100)}%`, background: col, borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
            <span>0</span><span>Zone {P.zone[0]}-{P.zone[1]}</span><span>50</span>
          </div>
        </div>
      )}

      <div className="card anim-item">
        <div className="eyebrow" style={{ marginTop: 0 }}>🍽️ {N.t}</div>
        {N.pts.map((x) => <div key={x} style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--muted)", padding: "4px 0" }}>{x}</div>)}
        <div style={{ fontSize: 10.5, color: "#4c4c52", marginTop: 8 }}>Repères généraux — pour un plan personnalisé, vois avec Moustapha.</div>
      </div>

      <Link href="/seance" className="btn p anim-item" style={{ textAlign: "center" }}>Lancer la séance</Link>
    </>
  );
}
