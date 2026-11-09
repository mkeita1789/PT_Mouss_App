import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { exigerCoach, getActivites, getCheckinsRecents, getClients, getDefis, getReathDatesTous, getSeancesTousClients } from "@/lib/data";
import { DefisCoach } from "@/components/DefisCoach";
import { serieSemaines } from "@/lib/coaching/motivation";
import { FilActivite } from "@/components/FilActivite";
import { Inviter } from "@/components/Inviter";
import { alertesCoach, joursDepuis } from "@/lib/coaching/alertes";
import { lundiCourant, phaseFor } from "@/lib/coaching/programme";
import { tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Coach — Baara" };

const PILL = { ko: "pill-ko", gold: "pill-gold", ok: "pill-ok" } as const;

export default async function Page() {
  const coach = await exigerCoach();
  const lang = await getLang();
  const T = ui(lang);
  const [clients, seances, checkins, activites, defis, reathDates, checkins120] = await Promise.all([getClients(coach.id), getSeancesTousClients(), getCheckinsRecents(7), getActivites(6), getDefis(), getReathDatesTous(), getCheckinsRecents(120)]);
  const lundi = lundiCourant();

  const lignes = clients.map((c) => {
    const hist = seances[c.id] ?? [];
    const alertes = alertesCoach(hist, checkins.filter((x) => x.user_id === c.id), new Date(), lang, (n) => tc(lang, n));
    return {
      ...c,
      hist,
      alertes,
      semaine: hist.filter((h) => new Date(h.realisee_le) >= lundi).length,
      jours: joursDepuis(hist[0]?.realisee_le),
      phase: c.bilan ? phaseFor(c.bilan.reponses, c.bilan.debut) : null,
      gravite: alertes.some((a) => a.niveau === "ko") ? 2 : alertes.length ? 1 : 0,
      serie: serieSemaines(
        [...hist.map((h) => h.realisee_le), ...(reathDates[c.id] ?? [])],
        parseInt(c.bilan?.reponses.freq ?? "") || 3,
        checkins120.filter((x) => x.user_id === c.id && /douleur/i.test(x.corps)).map((x) => x.jour + "T12:00:00Z"),
      ).semaines,
    };
  });
  lignes.sort((a, b) => b.gravite - a.gravite || a.prenom.localeCompare(b.prenom));

  const seancesSemaine = lignes.reduce((a, l) => a + l.semaine, 0);
  const aSuivre = lignes.filter((l) => l.gravite > 0).length;
  const urgents = lignes.filter((l) => l.gravite === 2).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{T.coach.espace}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{T.coach.titre}</h1>
        <p className="page-lede">{T.coach.lede}</p>
        <div style={{ marginTop: 14 }}><Inviter coach={coach.prenom} /></div>
      </header>

      <div className="grid-3">
        <div className="stat"><div className="stat-value">{clients.length}</div><div className="stat-label">{T.coach.clients}</div></div>
        <div className="stat"><div className="stat-value">{seancesSemaine}</div><div className="stat-label">{T.coach.seancesSemaine}</div></div>
        <div className="stat"><div className={`stat-value ${urgents ? "ko" : aSuivre ? "gold" : "ok"}`}>{aSuivre}</div><div className="stat-label">{urgents ? T.coach.dontUrgents(urgents) : T.coach.aSuivre}</div></div>
      </div>

      {clients.length > 0 && <FilActivite activites={activites} lang={lang} />}

      {clients.length > 0 && (
        <DefisCoach defis={defis} clients={lignes.map((l) => ({ id: l.id, prenom: l.prenom, hist: l.hist, autres: reathDates[l.id] ?? [] }))} lang={lang} limite={new Date(lundi.getTime() - 14 * 864e5).toISOString().slice(0, 10)} />
      )}

      <section className="section">
        {!clients.length ? (
          <div className="panel">
            <div className="section-title">{T.coach.aucun}</div>
            <p className="meta" style={{ marginTop: 6 }}>{T.coach.aucunTexte}</p>
          </div>
        ) : (
          <div className="stack">
            {lignes.map((l) => (
              <Link key={l.id} href={`/coach/${l.id}`} className="panel client-row" style={l.gravite === 2 ? { borderColor: "color-mix(in srgb, var(--ko) 40%, transparent)" } : undefined}>
                <Avatar url={l.avatar} nom={l.prenom} style={l.gravite === 2 ? { borderColor: "var(--ko)", color: "var(--ko)", boxShadow: "0 0 0 2px var(--ko)" } : undefined} />
                <div style={{ minWidth: 0 }}>
                  <div className="row-title" style={{ fontSize: 16 }}>{l.prenom || T.coach.sansPrenom}</div>
                  <div className="row-sub">
                    {l.bilan ? tc(lang, l.bilan.reponses.objectif).replace(/ [🍑⚽]/u, "") : T.coach.bilanNonFait}
                    {l.phase && ` · ${lang === "en" ? "W" : "S"}${l.phase.week} ${tc(lang, l.phase.n)}`}
                  </div>
                  <div className="row-sub">
                    <span className="num" style={{ color: "var(--ink-2)" }}>{l.semaine}/{parseInt(l.bilan?.reponses.freq ?? "") || "–"}</span> {T.coach.cetteSemaine}
                    {l.jours !== null ? T.coach.derniere(l.jours) : ""}
                    {l.serie > 0 && <> · <span className="gold">🔥 {T.motiv.serieClient(l.serie)}</span></>}
                  </div>
                </div>
                <div className="client-alerts">
                  {l.alertes.length ? (
                    <>
                      {l.alertes.slice(0, 3).map((a, i) => (
                        <span key={i} className={`pill ${PILL[a.niveau]}`} style={{ fontSize: 12, padding: "3px 9px" }}><span className="dot" />{a.titre}</span>
                      ))}
                      {l.alertes.length > 3 && <span className="pill" style={{ fontSize: 12, padding: "3px 9px" }}>+{l.alertes.length - 3}</span>}
                    </>
                  ) : (
                    <span className="pill pill-ok" style={{ fontSize: 12, padding: "3px 9px" }}><span className="dot" />{T.coach.toutVaBien}</span>
                  )}
                </div>
                <span className="muted" style={{ gridRow: 1, gridColumn: -1 }}><Icon nom="fleche" taille={18} /></span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
