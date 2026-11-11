import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinCard } from "@/components/CheckinCard";
import { Icon } from "@/components/Icon";
import { CarteMot } from "@/components/MotCoach";
import { lireProgramme } from "@/lib/coaching/programmes-speciaux";
import { refaireCheckin } from "./actions";
import { getBilan, getCheckinDuJour, getHistorique, getMotivation, getMots, getReath, getUtilisateur, jourParis, membreDUneEquipe, motRecent } from "@/lib/data";
import { CarteDefi } from "@/components/Defis";
import { phaseFor } from "@/lib/coaching/programme";
import { buildProgram, lundiCourant, scoreForme, SRA, verdictCheckin } from "@/lib/coaching/programme";
import { indexJourSuivant } from "@/lib/coaching/seance";
import { messagesClient } from "@/lib/coaching/alertes";
import { locale, tc, traduireProgramme, ui } from "@/lib/i18n";
import { accueilSansBilan, estPro } from "@/lib/profils";
import { getLang } from "@/lib/i18n/serveur";

const NOTE = { ko: "note-ko", gold: "note-gold", ok: "note-ok" } as const;

export default async function Accueil() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect(!estPro(user.metier) && user.metier !== "joueur" && user.role !== "coach" && (await membreDUneEquipe(user.id)) ? "/equipe" : accueilSansBilan(user.metier, user.role === "coach"));

  const lang = await getLang();
  const T = ui(lang);
  const [historique, ci, mots, reath] = await Promise.all([getHistorique(user.id), getCheckinDuJour(user.id), getMots(user.id, 1), getReath(user.id)]);
  const mot = motRecent(mots);
  const brut = buildProgram(bilan.reponses, bilan.debut);
  const P = traduireProgramme(brut, lang);
  const lundi = lundiCourant();
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundi);
  const target = parseInt(bilan.reponses.freq) || 3;
  const cycles = Math.max(0, (phaseFor(bilan.reponses, bilan.debut)?.cycle ?? 1) - 1);
  const motiv = await getMotivation(user.id, target, cycles);
  const M = T.motiv;
  const defisActifs = motiv.defis.filter((x) => !x.av.termine);
  const sf = ci ? scoreForme(ci, semaine.length, bilan.reponses.freq) : null;
  const v = ci ? verdictCheckin(ci) : null;
  const msgs = messagesClient({
    prenom: bilan.reponses.prenom, corps: ci?.corps, deload: brut.deload, historique,
    seancesSemaine: semaine.length, freq: bilan.reponses.freq, lang, nom: (n) => tc(lang, n),
  });
  const iJour = brut.repos ? -1 : indexJourSuivant(brut.days, historique);
  const jour = iJour >= 0 ? P.days[iJour] : null;

  /* Semaine en cours : quels jours ont une séance */
  const faits = new Set(semaine.map((h) => jourParis(new Date(h.realisee_le))));
  const aujourdhui = jourParis();
  const jours = T.accueil.jours.map((lb, i) => {
    const d = jourParis(new Date(lundi.getTime() + i * 864e5 + 12 * 36e5));
    return { lb, fait: faits.has(d), auj: d === aujourdhui };
  });

  const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  const salut = heure < 12 ? T.accueil.bonjour : heure < 18 ? T.accueil.salut : T.accueil.bonsoir;
  const date = new Intl.DateTimeFormat(locale(lang), { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date());
  const numSemaine = brut.phase?.match(/SEMAINE (\d+)/)?.[1];

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta" style={{ textTransform: "capitalize" }}>{date}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{salut}, {bilan.reponses.prenom}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <span className={`pill ${motiv.serie.semaines ? "pill-gold" : ""} serie`}>{motiv.serie.semaines ? M.serie(motiv.serie.semaines) : M.serieZero}</span>
          <span className="pill pill-gold">{P.icon} {P.proto.charAt(0) + P.proto.slice(1).toLowerCase()}</span>
          {P.phaseNom && <span className="pill">{P.phase?.split(" — ")[0].replace(/^(SEMAINE|WEEK)/, (m) => m.charAt(0) + m.slice(1).toLowerCase()).replace("CYCLE", "cycle")} · {P.phaseNom}</span>}
          {P.deload && <span className="pill pill-ok">{T.accueil.semaineLegere}</span>}
        </div>
      </header>

      {mot && <CarteMot mot={mot} titre={T.mot.titre} lang={lang} />}
      {defisActifs.map(({ defi, av }) => <CarteDefi key={defi.id} defi={defi} av={av} lang={lang} />)}
      {reath && reath.semaine <= lireProgramme(reath.programme).semaines.length && (
        <Link href="/reathletisation" className="panel row-link" style={{ marginBottom: 14, borderColor: "var(--gold-line)" }}>
          <span className="note-icon"><Icon nom="drapeau" taille={17} /></span>
          <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{lireProgramme(reath.programme).titre[lang]}</b><br /><span className="meta" style={{ fontSize: 13 }}>{T.reath.semaineSur(reath.semaine, lireProgramme(reath.programme).semaines.length)}</span></span>
          <Icon nom="fleche" taille={18} className="muted" />
        </Link>
      )}

      <div className="layout-home">
        <section className="panel panel-hero" aria-labelledby="today">
          {jour ? (
            <>
              <div className="today-kicker">{v?.v === "REPORTER" ? T.accueil.seanceReporter : v?.v === "ALLÉGER" ? T.accueil.seanceAllegee : T.accueil.seanceDuJour}</div>
              <h2 id="today" className="today-title">{jour.d}</h2>
              <div className="today-sub">{jour.f} · {T.accueil.exercices(jour.ex.length)}</div>
              <div className="today-list">
                {jour.ex.map((e, i) => (
                  <div key={i} className="today-ex">
                    {SRA[e.c] ? <span className={`cat cat-${e.c}`}>{e.c}</span> : <span className="cat" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>·</span>}
                    <span>{tc(lang, e.n)}</span>
                    <span className="presc">{e.s} × {e.r}</span>
                  </div>
                ))}
              </div>
              <div className="section-head" style={{ marginBottom: 10 }}>
                <span className="section-title" style={{ fontSize: 14 }}>{T.accueil.taSemaine}</span>
                <span className="meta"><b className="num" style={{ color: "var(--ink)", fontSize: 15 }}>{motiv.serie.cetteSemaine}</b> / {motiv.serie.objectif} {T.accueil.seances}</span>
              </div>
              <div className="week" aria-label={`${motiv.serie.cetteSemaine} / ${motiv.serie.objectif} ${T.accueil.seances}`}>
                {jours.map((j) => (
                  <div key={j.lb} className={`week-day ${j.fait ? "done" : ""} ${j.auj ? "today" : ""}`}>
                    <span className="week-mark"><Icon nom="check" taille={16} /></span>
                    {j.lb}
                  </div>
                ))}
              </div>
              <p className={`serie-msg${motiv.serie.manque === 0 ? " ok" : ""}`}>{motiv.serie.manque === 0 ? M.validee : M.encore(motiv.serie.manque)}</p>
              <Link href="/seance" className="btn btn-primary btn-block" style={{ marginTop: 22 }}>
                {T.accueil.commencer} <Icon nom="fleche" taille={18} />
              </Link>
            </>
          ) : (
            <>
              <div className="today-kicker">{T.accueil.reposImpose}</div>
              <h2 id="today" className="today-title">{P.phase}</h2>
              <p className="today-sub" style={{ marginTop: 12 }}>{P.cle}</p>
              <p className="meta" style={{ marginTop: 12, fontStyle: "italic" }}>{P.citation}</p>
            </>
          )}
        </section>

        <div className="stack" style={{ marginTop: 0 }}>
          {sf && v ? (
            <section className="panel" aria-label={T.checkin.titre}>
              <div className="forme">
                <div className="ring">
                  <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
                    <circle className="ring-track" cx="66" cy="66" r="56" />
                    <circle className="ring-fill" cx="66" cy="66" r="56" stroke={sf.col} strokeDasharray={351.9} strokeDashoffset={351.9 * (1 - sf.s / 100)} />
                  </svg>
                  <div className="ring-center"><span className="num" style={{ color: sf.col }}>{sf.s}</span><span>{T.accueil.forme}</span></div>
                </div>
                <div>
                  <div className="section-title">{sf.lab === "FRAIS" ? T.accueil.frais : sf.lab === "CORRECT" ? T.accueil.correct : T.accueil.fatigue}</div>
                  <p className="meta" style={{ marginTop: 6 }}>{tc(lang, v.msg)}</p>
                  <form action={refaireCheckin}><button type="submit" className="link" style={{ fontSize: 13, marginTop: 10 }}>{T.accueil.refaireCheckin}</button></form>
                </div>
              </div>
            </section>
          ) : (
            <CheckinCard />
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`note ${NOTE[m.niveau]}`}>
              <span className="note-icon"><Icon nom={m.niveau === "ko" ? "alerte" : m.niveau === "ok" ? "suivi" : "info"} taille={17} /></span>
              <div>{m.t}</div>
            </div>
          ))}

          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">{T.accueil.seancesTotal}</div></div>
            <div className="stat"><div className="stat-value">{brut.phaseNom ? `${lang === "en" ? "W" : "S"}${numSemaine ?? "1"}` : "—"}</div><div className="stat-label">{T.accueil.semaineCycle}</div></div>
          </div>
        </div>
      </div>

      <p className="motto">{T.accueil.devise}</p>
    </div>
  );
}
