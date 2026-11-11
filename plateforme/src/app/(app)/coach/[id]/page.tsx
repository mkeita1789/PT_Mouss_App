import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Comparaison, GrillePhotos } from "@/components/Comparaison";
import { FormMot } from "@/components/FormMot";
import { ReathCoach } from "@/components/ReathCoach";
import { PlanCharges } from "@/components/PlanCharges";
import { ChargesAutres } from "@/components/ChargesAutres";
import { lundiDe } from "@/lib/coaching/motivation";
import { Icon } from "@/components/Icon";
import { supprimerMot } from "../actions";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { exigerAccesSportif, getAuteursCharges, getChargesImposees, getDemandes, getCheckinsRecents, getClient, getHistorique, getMots, getPhotos, getReath, getReathSeances } from "@/lib/data";
import { alertesCoach } from "@/lib/coaching/alertes";
import { buildProgram, lundiCourant, phaseFor } from "@/lib/coaching/programme";
import { locale, tc, traduireProgramme, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Client — Baara" };

const NOTE = { ko: "note-ko", gold: "note-gold", ok: "note-ok" } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/coach/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  /* Le coach historique voit tout ; un coach ou préparateur, seulement les sportifs qui l'ont accepté */
  const moi = await exigerAccesSportif(id);
  const admin = moi.admin;

  const client = await getClient(id);
  if (!client) notFound();
  const lang = await getLang();
  const T = ui(lang);
  /* Plan de charges : la semaine en cours et les 7 suivantes */
  const lundi0 = lundiDe(new Date());
  const lundis = Array.from({ length: 8 }, (_, k) => new Date(Date.parse(lundi0 + "T12:00:00Z") + k * 7 * 864e5).toISOString().slice(0, 10));
  const [historique, checkins, mots, photos, reath, reathSeances, imposees, auteurs, demandes] = await Promise.all([getHistorique(id), getCheckinsRecents(14, id), getMots(id, 5), getPhotos(id), getReath(id), getReathSeances(id), getChargesImposees(id, lundis[0], lundis[7]), getAuteursCharges(id), getDemandes(id)]);

  const alertes = alertesCoach(historique, checkins.slice(0, 7), new Date(), lang, (n) => tc(lang, n));
  const b = client.bilan?.reponses;
  const phase = client.bilan ? phaseFor(client.bilan.reponses, client.bilan.debut) : null;
  const P = client.bilan ? traduireProgramme(buildProgram(client.bilan.reponses, client.bilan.debut), lang) : null;
  /* Exercices chargés du programme, avec leur jour ; « tous les jours » s'il revient plusieurs fois */
  const optionsPlan = (() => {
    if (!client.bilan) return [];
    const days = buildProgram(client.bilan.reponses, client.bilan.debut).days;
    const out: { exercice: string; jour_code: string | null }[] = [];
    const vus = new Map<string, number>();
    days.forEach((d) => d.ex.filter((e) => e.c !== "-").forEach((e) => { out.push({ exercice: e.n, jour_code: d.d }); vus.set(e.n, (vus.get(e.n) ?? 0) + 1); }));
    vus.forEach((n, ex) => { if (n > 1) out.splice(out.findIndex((o) => o.exercice === ex), 0, { exercice: ex, jour_code: null }); });
    return out;
  })();
  const semainesPlan = lundis.map((l, k) => ({
    lundi: l,
    courante: k === 0,
    phase: client.bilan ? phaseFor(client.bilan.reponses, client.bilan.debut, new Date(Date.parse(l + "T12:00:00Z") + 3 * 864e5))?.n ?? "" : "",
  }));
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <Link href={admin ? "/coach" : "/pro"} className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {admin ? T.coach.retour : T.metiers.retour}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
          <Avatar url={client.avatar} nom={client.prenom || "?"} className="avatar-lg" />
          <h1 className="page-title">{client.prenom || T.coach.sansPrenom}</h1>
        </div>
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

      {optionsPlan.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">{T.plan.titre}</h2></div>
          <PlanCharges clientId={id} semaines={semainesPlan} options={optionsPlan} initiales={imposees.filter((c) => !c.auteur_id || c.auteur_id === moi.id)} />
          <ChargesAutres clientId={id} moiId={moi.id} charges={imposees} auteurs={auteurs} demandes={demandes} lang={lang} T={T} />
        </section>
      )}

      {admin && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">{T.reath.programmes}</h2></div>
          <ReathCoach clientId={id} reath={reath} seances={reathSeances} lang={lang} />
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">{T.mot.titre}</h2></div>
        <div className="panel">
          <FormMot clientId={id} prenom={client.prenom} />
          {mots.length > 0 && (
            <div className="rows" style={{ marginTop: 16 }}>
              {mots.map((m) => (
                <div key={m.id} className="row-item" style={{ alignItems: "flex-start" }}>
                  <div className="row-main">
                    <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.texte}</div>
                    <div className="row-sub">{new Date(m.cree_le).toLocaleDateString(locale(lang), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</div>
                  </div>
                  <form action={supprimerMot.bind(null, m.id, id)}>
                    <button type="submit" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }}>{T.mot.supprimer}</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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

      {admin && photos.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">{T.photos.coachTitre}</h2><span className="section-note">{T.photos.meta}</span></div>
          <Comparaison photos={photos} lang={lang} P={T.photos} />
          <details className="panel" style={{ marginTop: 12 }}>
            <summary className="link" style={{ cursor: "pointer", fontSize: 14 }}>{T.photos.toutes} ({photos.length})</summary>
            <div style={{ marginTop: 14 }}><GrillePhotos photos={photos} lang={lang} P={T.photos} /></div>
          </details>
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
