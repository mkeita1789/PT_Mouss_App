import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { exigerCoach, getCheckinsRecents, getClient, getHistorique } from "@/lib/data";
import { alertesCoach } from "@/lib/coaching/alertes";
import { buildProgram, lundiCourant, phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Fiche client — PT Mouss IA" };

const NOTE = { ko: "note-ko", gold: "note-gold", ok: "note-ok" } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/coach/[id]">) {
  await exigerCoach();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const client = await getClient(id);
  if (!client) notFound();
  const [historique, checkins] = await Promise.all([getHistorique(id), getCheckinsRecents(14, id)]);

  const alertes = alertesCoach(historique, checkins.slice(0, 7));
  const b = client.bilan?.reponses;
  const phase = client.bilan ? phaseFor(client.bilan.reponses, client.bilan.debut) : null;
  const P = client.bilan ? buildProgram(client.bilan.reponses, client.bilan.debut) : null;
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <Link href="/coach" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> Mes clients
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{client.prenom || "Client"}</h1>
        {b ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span className="pill pill-gold">{b.objectif}</span>
            <span className="pill">{b.niveau}</span>
            <span className="pill">{b.freq} séances / sem.</span>
            {b.sante !== "Aucun" && <span className="pill pill-ko">Vigilance : {b.sante}</span>}
          </div>
        ) : (
          <p className="page-lede">Bilan pas encore fait.</p>
        )}
      </header>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          {P && (
            <section className="panel panel-hero">
              <div className="today-kicker">{P.icon} Protocole {P.proto.charAt(0) + P.proto.slice(1).toLowerCase()}</div>
              <div className="today-title" style={{ fontSize: 30 }}>{phase ? phase.n : P.phase}</div>
              <div className="today-sub">{phase ? `Semaine ${phase.week} sur ${phase.len}${phase.cycle > 1 ? `, cycle ${phase.cycle}` : ""} · ` : ""}{P.stats}</div>
              <p className="meta" style={{ marginTop: 12 }}>
                Sommeil {b?.sommeil} · {b?.materiel}
                {client.bilan && ` · cycle démarré le ${new Date(client.bilan.debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}`}
              </p>
            </section>
          )}
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat"><div className="stat-value">{semaine}<small>/{parseInt(b?.freq ?? "") || "–"}</small></div><div className="stat-label">Cette semaine</div></div>
            <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">Séances au total</div></div>
          </div>
        </div>

        <section className="stack" aria-label="À surveiller">
          <div className="section-title">À surveiller</div>
          {alertes.length ? (
            alertes.map((a, i) => (
              <div key={i} className={`note ${NOTE[a.niveau]}`}>
                <span className="note-icon"><Icon nom={a.niveau === "ko" ? "alerte" : "info"} taille={17} /></span>
                <div><b>{a.titre}.</b> <span className="ink-2">{a.detail}</span></div>
              </div>
            ))
          ) : (
            <div className="note note-ok">
              <span className="note-icon"><Icon nom="check" taille={17} /></span>
              <div>Rien à signaler : charges cohérentes et régularité au rendez-vous.</div>
            </div>
          )}
        </section>
      </div>

      {checkins.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">Check-ins</h2><span className="section-note">14 derniers jours</span></div>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Jour</th><th>Sommeil</th><th>Énergie</th><th>Corps</th></tr></thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.jour}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(c.jour).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td>{c.sommeil}</td><td>{c.energie}</td><td className={c.corps.includes("douleur") ? "ko" : undefined}>{c.corps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">Charges par exercice</h2></div>
        <ProgressionCharges historique={historique} />
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Séances</h2><span className="section-note">Touche une séance pour le détail</span></div>
        <HistoriqueSeances historique={historique} limite={40} />
      </section>
    </div>
  );
}
