import { arreterReath, changerSemaineReath, enregistrerVma } from "@/app/(app)/reathletisation/actions";
import type { Reath, ReathSeance } from "@/lib/data";
import { alerteGenou, JOURS_EN, JOURS_FR, joursActifs } from "@/lib/coaching/reath-lca";
import { lireProgramme } from "@/lib/coaching/programmes-speciaux";
import { locale, nombre, ui, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";
import { InscriptionProgramme } from "./InscriptionProgramme";

/** Fiche client, côté coach : attribution, avancement, alertes ou effort, passage des semaines */
export function ReathCoach({ clientId, reath, seances, lang, ouvert = false }: { clientId: string; reath: Reath | null; seances: ReathSeance[]; lang: Lang; ouvert?: boolean }) {
  const R = ui(lang).reath;
  const jours = lang === "en" ? JOURS_EN : JOURS_FR;
  if (!reath) return <InscriptionProgramme clientId={clientId} ouvert={ouvert} />;

  const prog = lireProgramme(reath.programme);
  const total = prog.semaines.length;
  const fini = reath.semaine > total;
  const courante = Math.min(reath.semaine, total);
  const stats = prog.semaines.map((s) => {
    const a = joursActifs(s);
    const notes = seances.filter((x) => x.semaine === s.n);
    const faites = a.filter(({ i }) => notes.some((x) => x.jour === i)).length;
    const alertes = prog.genou ? notes.filter((x) => alerteGenou(x.douleur, x.gonflement)).length : 0;
    const rpes = notes.map((x) => x.rpe).filter((x): x is number => x !== null);
    return { n: s.n, faites, total: a.length, alertes, rpe: rpes.length ? rpes.reduce((p, c) => p + c, 0) / rpes.length : null };
  });
  const cur = stats[courante - 1];
  const prete = !fini && cur.faites === cur.total && cur.alertes === 0;
  const alertes = prog.genou ? seances.filter((x) => alerteGenou(x.douleur, x.gonflement)).slice(0, 6) : [];

  return (
    <div className="panel">
      <div className="section-head" style={{ marginBottom: 6 }}>
        <b style={{ fontSize: 15.5 }}>{prog.titre[lang]}</b>
        <span className="meta" style={{ fontSize: 12.5 }}>{R.debut} : {new Date(reath.debut + "T12:00:00").toLocaleDateString(locale(lang), { day: "numeric", month: "long" })}</span>
      </div>
      <span className={`pill ${fini ? "pill-ok" : "pill-gold"}`} style={{ marginBottom: 12 }}><span className="dot" />{fini ? R.fini : R.enCoursSur(courante, total)}</span>

      <div className="reath-semaines" style={{ marginTop: 12, gridTemplateColumns: `repeat(${total}, 1fr)` }}>
        {stats.map((s) => (
          <div key={s.n} className={`reath-sem${s.n === courante && !fini ? " on" : ""}${s.total && s.faites === s.total ? " ok" : ""}`} style={{ flexDirection: "column", height: 54, gap: 0, opacity: s.n > reath.semaine ? 0.45 : 1 }}>
            <span className="num" style={{ fontSize: 14 }}>S{s.n}</span>
            <span style={{ fontSize: 11.5 }}>{s.faites}/{s.total}{s.alertes ? " ⚠️" : ""}</span>
          </div>
        ))}
      </div>

      {!prog.genou && cur.rpe !== null && <p className="meta" style={{ fontSize: 13, marginTop: 10 }}>{R.semaine(courante)} · {R.effortMoyen(nombre(lang, Math.round(cur.rpe * 10) / 10))}</p>}

      {prog.genou && (
        <form action={enregistrerVma.bind(null, clientId)} className="vma-form">
          <label className="field" style={{ margin: 0 }}>
            <span>{R.vma}</span>
            <input name="vma" className="input num" inputMode="decimal" placeholder="ex. 14" defaultValue={reath.vma ?? ""} style={{ width: 110 }} />
          </label>
          <button type="submit" className="btn btn-ghost btn-sm">{R.vmaEnregistrer}</button>
          <span className="meta" style={{ fontSize: 12.5 }}>{R.vmaAide}</span>
        </form>
      )}

      {prete && <p className="ok" style={{ fontSize: 13.5, marginTop: 12 }}><Icon nom="check" taille={15} /> {R.pret}</p>}

      {prog.genou && (
        <>
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
        </>
      )}

      {prog.criteresSortie && reath.semaine >= total && (
        <>
          <div className="meta" style={{ margin: "16px 0 6px" }}>{R.criteresSortie}</div>
          <ul className="accord-liste" style={{ margin: "6px 0 0" }}>
            {prog.criteresSortie[lang].map((c) => <li key={c}><Icon nom="check" taille={16} className="gold" /> <span>{c}</span></li>)}
          </ul>
        </>
      )}

      <div className="btn-row" style={{ marginTop: 18, flexWrap: "wrap" }}>
        {!fini && (
          <form action={changerSemaineReath.bind(null, clientId, reath.semaine + 1)}>
            <button type="submit" className={`btn btn-sm ${prete ? "btn-primary" : "btn-ghost"}`}>{reath.semaine >= total ? R.terminer : R.passer(reath.semaine + 1)}</button>
          </form>
        )}
        {reath.semaine > 1 && (
          <form action={changerSemaineReath.bind(null, clientId, Math.min(reath.semaine, total + 1) - 1)}>
            <button type="submit" className="btn btn-sm btn-ghost">{R.revenir(Math.min(reath.semaine, total + 1) - 1)}</button>
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
