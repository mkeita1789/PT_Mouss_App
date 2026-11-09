import Link from "next/link";
import { redirect } from "next/navigation";
import { FicheExercice } from "@/components/FicheExercice";
import { Icon } from "@/components/Icon";
import { getBilan, getUtilisateur } from "@/lib/data";
import { buildProgram, cycleFor, nutri, phaseFor, SRA, volumeUF } from "@/lib/coaching/programme";
import { tc, traduireProgramme, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Programme — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");

  const lang = await getLang();
  const T = ui(lang);
  const brut = buildProgram(bilan.reponses, bilan.debut);
  const P = traduireProgramme(brut, lang);
  const N = nutri(bilan.reponses);
  const cycle = cycleFor(bilan.reponses);
  const ph = phaseFor(bilan.reponses, bilan.debut);
  const titre = P.proto.charAt(0) + P.proto.slice(1).toLowerCase();

  if (P.repos)
    return (
      <div className="reveal">
        <header className="page-head">
          <div className="meta">{P.icon} {titre}</div>
          <h1 className="page-title" style={{ marginTop: 6 }}>{P.phase}</h1>
          <p className="page-lede">{P.stats}</p>
        </header>
        <section className="panel panel-hero">
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>{P.cle}</p>
          <p className="meta" style={{ marginTop: 14, fontStyle: "italic" }}>{P.citation}</p>
        </section>
        <section className="section">
          <div className="section-head"><h2 className="section-title">{T.programme.cePeuxFaire}</h2></div>
          <div className="panel rows">
            {T.programme.reposActivites.map((t) => (
              <div key={t} className="row-item"><Icon nom="feuille" taille={18} className="ok" /><div className="row-main">{t}</div></div>
            ))}
          </div>
        </section>
      </div>
    );

  const uf = volumeUF(brut);
  const gaugeCol = uf > P.zone[1] + 10 ? "var(--ko)" : uf >= P.zone[0] ? "var(--ok)" : "var(--gold)";
  const titreAssiette = tc(lang, N.t).replace(/^(Côté assiette — |On your plate — )/, "");

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{P.icon} {T.programme.protocole} {titre}{!P.officiel && T.programme.aValider}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{ph ? tc(lang, ph.n) : T.programme.tonProgramme}</h1>
        <p className="page-lede">{P.phaseTip ?? P.cle}</p>
      </header>

      {cycle && ph && (
        <section className="panel" aria-label="Cycle">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="section-title">{T.programme.semaineSur(ph.week, ph.len, ph.cycle)}</span>
            <span className="meta num" style={{ fontSize: 14 }}>{P.stats}</span>
          </div>
          <div className="cycle">
            {cycle.map((c, i) => (
              <div key={c.n} className={`cycle-step ${i + 1 < ph.week ? "past" : ""} ${i + 1 === ph.week ? "now" : ""} ${c.mult < 1 ? "light" : ""}`} title={T.programme.semaineN(i + 1, tc(lang, c.n))}>
                <div className="cycle-bar" />
                <div className="cycle-name">{tc(lang, c.n)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {P.phaseTip && (
        <div className="note note-gold" style={{ marginTop: 12 }}>
          <span className="note-icon"><Icon nom="info" taille={17} /></span>
          <div>{P.cle}</div>
        </div>
      )}
      {P.neat && (
        <div className="note note-ok" style={{ marginTop: 12 }}>
          <span className="note-icon"><Icon nom="feuille" taille={17} /></span>
          <div>{P.neat.replace("🚶 ", "")}</div>
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{T.programme.tesSeances}</h2>
          <span className="section-note">{T.programme.parSemaine(P.days.length)}</span>
        </div>
        <div className="grid-2">
          {P.days.map((d, di) => (
            <article key={d.d} className="panel day-card" style={d.crit ? { borderColor: "rgba(240,96,93,.35)" } : undefined}>
              <div className="day-head">
                <span className="day-code" style={d.crit ? { color: "var(--ko)" } : undefined}>{d.d}</span>
                <span className="day-focus">{d.f}</span>
              </div>
              {d.ex.map((e, i) => (
                <div key={i} className="ex-line">
                  {SRA[e.c] ? <span className={`cat cat-${e.c}`}>{e.c}</span> : <span />}
                  <div>
                    <FicheExercice nom={brut.days[di].ex[i].n} />
                    <div className="ex-note">{e.note}{e.drop && <span className="gold"> · {T.programme.dropSet}</span>}</div>
                  </div>
                  <div className="ex-presc">
                    <div className="num">{e.s} × {e.r}</div>
                    {e.rir !== "-" && <div>RIR {e.rir}</div>}
                  </div>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <div className="grid-2 section">
        {uf > 0 && (
          <section className="panel">
            <div className="section-head">
              <h2 className="section-title">{T.programme.volume}</h2>
              <span className="num gold" style={{ fontSize: 18 }}>{uf.toFixed(1)} <small className="muted" style={{ fontSize: 12 }}>UF</small></span>
            </div>
            <div className="gauge" role="img" aria-label={`${uf.toFixed(1)} UF · ${T.programme.zone(P.zone[0], P.zone[1])}`}>
              <span className="gauge-zone" style={{ left: `${(P.zone[0] / 50) * 100}%`, width: `${((P.zone[1] - P.zone[0]) / 50) * 100}%` }} />
              <i style={{ width: `${Math.min((uf / 50) * 100, 100)}%`, background: gaugeCol }} />
            </div>
            <div className="chart-axis"><span>0</span><span>{T.programme.zone(P.zone[0], P.zone[1])}</span><span>50</span></div>
            <p className="meta" style={{ marginTop: 14 }}>
              {T.programme.categories[0]}<span className="cat cat-S">S</span>{T.programme.categories[1]}<span className="cat cat-A">A</span>{T.programme.categories[2]}<span className="cat cat-P">P</span>{T.programme.categories[3]}
            </p>
          </section>
        )}
        <section className="panel">
          <h2 className="section-title">{T.programme.assiette} : {titreAssiette.toLowerCase()}</h2>
          <ul className="rows" style={{ listStyle: "none", marginTop: 6 }}>
            {N.pts.map((x) => <li key={x} className="row-item" style={{ fontSize: 13.5, color: "var(--ink-2)", alignItems: "flex-start" }}>{tc(lang, x)}</li>)}
          </ul>
          <p className="meta" style={{ marginTop: 10 }}>{T.programme.reperes}</p>
        </section>
      </div>

      <Link href="/seance" className="btn btn-primary btn-block section">
        {T.programme.commencer} <Icon nom="fleche" taille={18} />
      </Link>
    </div>
  );
}
