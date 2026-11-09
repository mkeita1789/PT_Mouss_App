import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { exigerCoach, getCheckinsRecents, getClient, getHistorique } from "@/lib/data";
import { alertesCoach } from "@/lib/coaching/alertes";
import { buildProgram, lundiCourant, phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Fiche client — PT Mouss IA" };

const COULEUR = { ko: "ko", gold: "", ok: "ok" } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/coach/[id]">) {
  await exigerCoach();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const client = await getClient(id);
  if (!client) notFound();
  const [historique, checkins] = await Promise.all([getHistorique(id), getCheckinsRecents(14, id)]);

  const alertes = alertesCoach(historique, checkins.slice(0, 7));
  const phase = client.bilan ? phaseFor(client.bilan.reponses, client.bilan.debut) : null;
  const P = client.bilan ? buildProgram(client.bilan.reponses, client.bilan.debut) : null;
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;

  return (
    <>
      <Link href="/coach" className="link" style={{ fontSize: 12, display: "inline-block", marginTop: 14 }}>← Tous les clients</Link>
      <div className="h1" style={{ paddingTop: 10 }}><em>{client.prenom || "Client"}</em></div>
      <div className="sub">
        {client.bilan ? `${client.bilan.reponses.objectif} · ${client.bilan.reponses.niveau} · ${client.bilan.reponses.freq} séances/sem.` : "Bilan non fait"}
      </div>

      {P && (
        <div className="card gold anim-item">
          <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>{P.icon} {P.proto}</div>
          {P.phase && <div style={{ fontFamily: "var(--font-oswald)", fontSize: 15, marginTop: 4 }}>{P.phase}</div>}
          {P.stats && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{P.stats}</div>}
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            {client.bilan?.reponses.sante && client.bilan.reponses.sante !== "Aucun" && <>Vigilance : <b style={{ color: "var(--ink)" }}>{client.bilan.reponses.sante}</b> · </>}
            Sommeil : {client.bilan?.reponses.sommeil} · Lieu : {client.bilan?.reponses.materiel}
            {phase && <> · Cycle démarré le {new Date(client.bilan!.debut).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}</>}
          </div>
        </div>
      )}

      <div className="statgrid anim-item">
        <div className="stat"><div className="v" style={{ color: "var(--gold)" }}>{semaine}</div><div className="l">Cette semaine</div></div>
        <div className="stat"><div className="v" style={{ color: "var(--ok)" }}>{historique.length}</div><div className="l">Au total</div></div>
      </div>

      <div className="eyebrow">À surveiller</div>
      {alertes.length ? (
        alertes.map((a, i) => (
          <div key={i} className={`card alert ${COULEUR[a.niveau]}`}>
            <b>{a.titre}</b>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{a.detail}</div>
          </div>
        ))
      ) : (
        <div className="card alert ok">Rien à signaler : charges cohérentes, régularité OK.</div>
      )}

      {checkins.length > 0 && (
        <>
          <div className="eyebrow">Check-ins (14 jours)</div>
          <div className="card">
            <table className="tbl">
              <thead><tr><th>Jour</th><th>Sommeil</th><th>Énergie</th><th>Corps</th></tr></thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.jour}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(c.jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</td>
                    <td>{c.sommeil}</td><td>{c.energie}</td><td>{c.corps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="eyebrow">Charges par exercice</div>
      <ProgressionCharges historique={historique} />

      <div className="eyebrow">Séances</div>
      <HistoriqueSeances historique={historique} limite={40} />
    </>
  );
}
