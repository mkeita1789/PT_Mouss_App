import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { exigerCoach, getCheckinsRecents, getClient, getHistorique } from "@/lib/data";
import { alertesCoach } from "@/lib/coaching/alertes";
import { buildProgram, lundiCourant, phaseFor } from "@/lib/coaching/programme";
import { locale, tc, traduireProgramme, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Client — PT Mouss IA" };

const NOTE = { ko: "note-ko", gold: "note-gold", ok: "note-ok" } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/coach/[id]">) {
  await exigerCoach();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const client = await getClient(id);
  if (!client) notFound();
  const lang = await getLang();
  const T = ui(lang);
  const [historique, checkins] = await Promise.all([getHistorique(id), getCheckinsRecents(14, id)]);

  const alertes = alertesCoach(historique, checkins.slice(0, 7), new Date(), lang, (n) => tc(lang, n));
  const b = client.bilan?.reponses;
  const phase = client.bilan ? phaseFor(client.bilan.reponses, client.bilan.debut) : null;
  const P = client.bilan ? traduireProgramme(buildProgram(client.bilan.reponses, client.bilan.debut), lang) : null;
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <Link href="/coach" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.coach.retour}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{client.prenom || T.coach.sansPrenom}</h1>
        {b ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span className="pill pill-gold">{tc(lang, b.objectif)}</span>
            <span className="pill">{tc(lang, b.niveau)}</span>
            <span className="pill">{T.coach.seancesSem(b.freq)}</span>
            {b.sante !== "Aucun" && <span className="pill pill-ko">{T.coach.vigilance}{tc(lang, b.sante)}</span>}
          </div>
        ) : (
          <p className="page-lede">{T.coach.pasDeBilan}</p>
        )}
      </header>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          {P && (
            <section className="panel panel-hero">
              <div className="today-kicker">{P.icon} {T.programme.protocole} {P.proto.charAt(0) + P.proto.slice(1).toLowerCase()}</div>
              <div className="today-title" style={{ fontSize: 30 }}>{phase ? tc(lang, phase.n) : P.phase}</div>
              <div className="today-sub">{phase ? T.coach.semaineSur(phase.week, phase.len, phase.cycle) : ""}{P.stats}</div>
              <p className="meta" style={{ marginTop: 12 }}>
                {T.coach.sommeil} {tc(lang, b?.sommeil)} · {tc(lang, b?.materiel)}
                {client.bilan && T.coach.cycleDemarre(new Date(client.bilan.debut).toLocaleDateString(locale(lang), { day: "numeric", month: "long", timeZone: "Europe/Paris" }))}
              </p>
            </section>
          )}
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat"><div className="stat-value">{semaine}<small>/{parseInt(b?.freq ?? "") || "–"}</small></div><div className="stat-label">{T.suivi.cetteSemaine}</div></div>
            <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">{T.suivi.total}</div></div>
          </div>
        </div>

        <section className="stack" aria-label={T.coach.aSurveiller}>
          <div className="section-title">{T.coach.aSurveiller}</div>
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
              <div>{T.coach.rien}</div>
            </div>
          )}
        </section>
      </div>

      {checkins.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">{T.coach.checkins}</h2><span className="section-note">{T.coach.quatorze}</span></div>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr>{T.coach.colonnesCheckin.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.jour}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(c.jour).toLocaleDateString(locale(lang), { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td>{tc(lang, c.sommeil)}</td><td>{tc(lang, c.energie)}</td><td className={c.corps.includes("douleur") ? "ko" : undefined}>{tc(lang, c.corps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">{T.suivi.chargesParExo}</h2></div>
        <ProgressionCharges historique={historique} lang={lang} />
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">{T.coach.seances}</h2><span className="section-note">{T.suivi.toucheDetail}</span></div>
        <HistoriqueSeances historique={historique} limite={40} lang={lang} />
      </section>
    </div>
  );
}
