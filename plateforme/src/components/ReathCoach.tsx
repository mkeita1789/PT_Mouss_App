import { arreterReath, changerSemaineReath, inscrireReath } from "@/app/(app)/reathletisation/actions";
import type { Reath, ReathSeance } from "@/lib/data";
import { alerteGenou, CRITERES_ENTREE, CRITERES_SORTIE, JOURS_EN, JOURS_FR, joursActifs, NB_SEMAINES, REATH_LCA } from "@/lib/coaching/reath-lca";
import { locale, ui, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";

/** Fiche client, côté coach : inscription, avancement, alertes genou, passage des semaines */
export function ReathCoach({ clientId, reath, seances, lang }: { clientId: string; reath: Reath | null; seances: ReathSeance[]; lang: Lang }) {
  const R = ui(lang).reath;
  const jours = lang === "en" ? JOURS_EN : JOURS_FR;

  if (!reath)
    return (
      <details className="panel">
        <summary className="link" style={{ cursor: "pointer", fontSize: 14.5 }}><Icon nom="plus" taille={15} /> {R.inscrire}</summary>
        <form action={inscrireReath.bind(null, clientId)} style={{ marginTop: 12 }}>
          <div className="meta">{R.criteresEntree}</div>
          <div className="criteres">
            {CRITERES_ENTREE[lang].map((c) => (
              <label key={c} className="accord-case"><input type="checkbox" name="critere" value={c} required /><span>{c}</span></label>
            ))}
          </div>
          <label className="field" style={{ maxWidth: 220 }}>
            <span>{R.debut}</span>
            <input type="date" name="debut" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>{R.inscrire}</button>
          <p className="meta" style={{ marginTop: 8, fontSize: 12.5 }}>{R.criteresAide}</p>
        </form>
      </details>
    );

  const fini = reath.semaine > NB_SEMAINES;
  const courante = Math.min(reath.semaine, NB_SEMAINES);
  const stats = REATH_LCA.map((s) => {
    const a = joursActifs(s);
    const faites = a.filter(({ i }) => seances.some((x) => x.semaine === s.n && x.jour === i)).length;
    const alertes = seances.filter((x) => x.semaine === s.n && alerteGenou(x.douleur, x.gonflement)).length;
    return { n: s.n, faites, total: a.length, alertes };
  });
  const cur = stats[courante - 1];
  const prete = !fini && cur.faites === cur.total && cur.alertes === 0;
  const alertes = seances.filter((x) => alerteGenou(x.douleur, x.gonflement)).slice(0, 6);

  return (
    <div className="panel">
      <div className="section-head" style={{ marginBottom: 12 }}>
        <span className={`pill ${fini ? "pill-ok" : "pill-gold"}`}><span className="dot" />{fini ? R.fini : R.enCours(courante)}</span>
        <span className="meta" style={{ fontSize: 12.5 }}>{R.debut} : {new Date(reath.debut + "T12:00:00").toLocaleDateString(locale(lang), { day: "numeric", month: "long" })}</span>
      </div>

      <div className="reath-semaines" style={{ marginTop: 0 }}>
        {stats.map((s) => (
          <div key={s.n} className={`reath-sem${s.n === courante && !fini ? " on" : ""}${s.faites === s.total ? " ok" : ""}`} style={{ flexDirection: "column", height: 54, gap: 0, opacity: s.n > reath.semaine ? 0.45 : 1 }}>
            <span className="num" style={{ fontSize: 14 }}>S{s.n}</span>
            <span style={{ fontSize: 11.5 }}>{s.faites}/{s.total}{s.alertes ? " ⚠️" : ""}</span>
          </div>
        ))}
      </div>

      {prete && <p className="ok" style={{ fontSize: 13.5, marginTop: 12 }}><Icon nom="check" taille={15} /> {R.pret}</p>}

      <div className="meta" style={{ margin: "16px 0 6px" }}>{R.alertesGenou}</div>
      {alertes.length ? (
        <div className="rows">
          {alertes.map((a) => (
            <div key={`${a.semaine}-${a.jour}`} className="row-item" style={{ alignItems: "flex-start" }}>
              <div className="row-main">
                <div style={{ fontSize: 14 }}><span className="ko">⚠️ {a.douleur !== null ? R.douleurCourt(a.douleur) : ""}{a.gonflement ? ` · ${R.gonfle}` : ""}</span></div>
                <div className="row-sub">{R.semaine(a.semaine)} · {jours[a.jour]} · {new Date(a.fait_le).toLocaleDateString(locale(lang), { day: "numeric", month: "short", timeZone: "Europe/Paris" })}{a.note ? ` · « ${a.note} »` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="meta" style={{ fontSize: 13.5 }}>{R.aucuneAlerte}</p>
      )}

      {reath.semaine >= NB_SEMAINES && (
        <>
          <div className="meta" style={{ margin: "16px 0 6px" }}>{R.criteresSortie}</div>
          <ul className="accord-liste" style={{ margin: "6px 0 0" }}>
            {CRITERES_SORTIE[lang].map((c) => <li key={c}><Icon nom="check" taille={16} className="gold" /> <span>{c}</span></li>)}
          </ul>
        </>
      )}

      <div className="btn-row" style={{ marginTop: 18, flexWrap: "wrap" }}>
        {!fini && (
          <form action={changerSemaineReath.bind(null, clientId, reath.semaine + 1)}>
            <button type="submit" className={`btn btn-sm ${prete ? "btn-primary" : "btn-ghost"}`}>
              {reath.semaine >= NB_SEMAINES ? R.terminer : R.passer(reath.semaine + 1)}
            </button>
          </form>
        )}
        {reath.semaine > 1 && (
          <form action={changerSemaineReath.bind(null, clientId, Math.min(reath.semaine, NB_SEMAINES + 1) - 1)}>
            <button type="submit" className="btn btn-sm btn-ghost">{R.revenir(Math.min(reath.semaine, NB_SEMAINES + 1) - 1)}</button>
          </form>
        )}
        <details>
          <summary className="btn btn-sm link" style={{ color: "var(--muted)", listStyle: "none" }}>{R.arreter}</summary>
          <form action={arreterReath.bind(null, clientId)} style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-sm btn-ghost" style={{ color: "var(--ko)" }}>{R.confirmerArret}</button>
          </form>
        </details>
      </div>
    </div>
  );
}
