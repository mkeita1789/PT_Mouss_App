import Link from "next/link";
import { Icon } from "@/components/Icon";
import { exigerCoach, getCheckinsRecents, getClients, getSeancesTousClients } from "@/lib/data";
import { alertesCoach, joursDepuis } from "@/lib/coaching/alertes";
import { lundiCourant, phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Mes clients — PT Mouss IA" };

const PILL = { ko: "pill-ko", gold: "pill-gold", ok: "pill-ok" } as const;

export default async function Page() {
  const coach = await exigerCoach();
  const [clients, seances, checkins] = await Promise.all([getClients(coach.id), getSeancesTousClients(), getCheckinsRecents(7)]);
  const lundi = lundiCourant();

  const lignes = clients.map((c) => {
    const hist = seances[c.id] ?? [];
    const alertes = alertesCoach(hist, checkins.filter((x) => x.user_id === c.id));
    return {
      ...c,
      hist,
      alertes,
      semaine: hist.filter((h) => new Date(h.realisee_le) >= lundi).length,
      jours: joursDepuis(hist[0]?.realisee_le),
      phase: c.bilan ? phaseFor(c.bilan.reponses, c.bilan.debut) : null,
      gravite: alertes.some((a) => a.niveau === "ko") ? 2 : alertes.length ? 1 : 0,
    };
  });
  lignes.sort((a, b) => b.gravite - a.gravite || a.prenom.localeCompare(b.prenom));

  const seancesSemaine = lignes.reduce((a, l) => a + l.semaine, 0);
  const aSuivre = lignes.filter((l) => l.gravite > 0).length;
  const urgents = lignes.filter((l) => l.gravite === 2).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">Espace coach</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>Mes clients</h1>
        <p className="page-lede">Les clients qui ont besoin de toi apparaissent en premier.</p>
      </header>

      <div className="grid-3">
        <div className="stat"><div className="stat-value">{clients.length}</div><div className="stat-label">Clients</div></div>
        <div className="stat"><div className="stat-value">{seancesSemaine}</div><div className="stat-label">Séances cette semaine</div></div>
        <div className="stat"><div className={`stat-value ${urgents ? "ko" : aSuivre ? "gold" : "ok"}`}>{aSuivre}</div><div className="stat-label">{urgents ? `À suivre, dont ${urgents} urgent${urgents > 1 ? "s" : ""}` : "À suivre"}</div></div>
      </div>

      <section className="section">
        {!clients.length ? (
          <div className="panel">
            <div className="section-title">Aucun client pour l'instant</div>
            <p className="meta" style={{ marginTop: 6 }}>
              Envoie le lien d'inscription à tes clients. Après leur bilan, ils apparaissent ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="stack">
            {lignes.map((l) => (
              <Link key={l.id} href={`/coach/${l.id}`} className="panel client-row" style={l.gravite === 2 ? { borderColor: "rgba(240,96,93,.4)" } : undefined}>
                <span className="avatar" style={l.gravite === 2 ? { borderColor: "var(--ko)", color: "var(--ko)" } : undefined}>{(l.prenom[0] ?? "?").toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="row-title" style={{ fontSize: 16 }}>{l.prenom || "Sans prénom"}</div>
                  <div className="row-sub">
                    {l.bilan ? l.bilan.reponses.objectif.replace(/ [🍑⚽]/u, "") : "Bilan non fait"}
                    {l.phase && ` · S${l.phase.week} ${l.phase.n}`}
                  </div>
                  <div className="row-sub">
                    <span className="num" style={{ color: "var(--ink-2)" }}>{l.semaine}/{parseInt(l.bilan?.reponses.freq ?? "") || "–"}</span> cette semaine
                    {l.jours !== null ? ` · dernière séance ${l.jours === 0 ? "aujourd'hui" : l.jours === 1 ? "hier" : `il y a ${l.jours} j`}` : ""}
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
                    <span className="pill pill-ok" style={{ fontSize: 12, padding: "3px 9px" }}><span className="dot" />Tout va bien</span>
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
