import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinCard } from "@/components/CheckinCard";
import { Icon } from "@/components/Icon";
import { refaireCheckin } from "./actions";
import { getBilan, getCheckinDuJour, getHistorique, getUtilisateur, jourParis } from "@/lib/data";
import { buildProgram, lundiCourant, scoreForme, SRA, verdictCheckin } from "@/lib/coaching/programme";
import { indexJourSuivant } from "@/lib/coaching/seance";
import { messagesClient } from "@/lib/coaching/alertes";

const NOTE = { ko: "note-ko", gold: "note-gold", ok: "note-ok" } as const;
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function Accueil() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect(user.role === "coach" ? "/coach" : "/bilan");

  const [historique, ci] = await Promise.all([getHistorique(user.id), getCheckinDuJour(user.id)]);
  const P = buildProgram(bilan.reponses, bilan.debut);
  const lundi = lundiCourant();
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundi);
  const target = parseInt(bilan.reponses.freq) || 3;
  const sf = ci ? scoreForme(ci, semaine.length, bilan.reponses.freq) : null;
  const v = ci ? verdictCheckin(ci) : null;
  const msgs = messagesClient({ prenom: bilan.reponses.prenom, corps: ci?.corps, deload: P.deload, historique, seancesSemaine: semaine.length, freq: bilan.reponses.freq });
  const jour = P.repos ? null : P.days[indexJourSuivant(P.days, historique)];

  /* Semaine en cours : quels jours ont une séance */
  const faits = new Set(semaine.map((h) => jourParis(new Date(h.realisee_le))));
  const aujourdhui = jourParis();
  const jours = JOURS.map((lb, i) => {
    const d = jourParis(new Date(lundi.getTime() + i * 864e5 + 12 * 36e5));
    return { lb, fait: faits.has(d), auj: d === aujourdhui };
  });

  const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Salut" : "Bonsoir";
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date());

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta" style={{ textTransform: "capitalize" }}>{date}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{salut}, {bilan.reponses.prenom}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <span className="pill pill-gold">{P.icon} {P.proto.charAt(0) + P.proto.slice(1).toLowerCase()}</span>
          {P.phaseNom && <span className="pill">{P.phase?.split(" — ")[0].replace("SEMAINE", "Semaine").replace("CYCLE", "cycle")} · {P.phaseNom}</span>}
          {P.deload && <span className="pill pill-ok">Semaine légère</span>}
        </div>
      </header>

      <div className="layout-home">
        <section className="panel panel-hero" aria-labelledby="today">
          {jour ? (
            <>
              <div className="today-kicker">{v?.v === "REPORTER" ? "Séance à reporter" : v?.v === "ALLÉGER" ? "Séance du jour, version allégée" : "Séance du jour"}</div>
              <h2 id="today" className="today-title">{jour.d}</h2>
              <div className="today-sub">{jour.f} · {jour.ex.length} exercices</div>
              <div className="today-list">
                {jour.ex.map((e, i) => (
                  <div key={i} className="today-ex">
                    {SRA[e.c] ? <span className={`cat cat-${e.c}`}>{e.c}</span> : <span className="cat" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>·</span>}
                    <span>{e.n}</span>
                    <span className="presc">{e.s} × {e.r}</span>
                  </div>
                ))}
              </div>
              <div className="section-head" style={{ marginBottom: 10 }}>
                <span className="section-title" style={{ fontSize: 14 }}>Ta semaine</span>
                <span className="meta"><b className="num" style={{ color: "var(--ink)", fontSize: 15 }}>{semaine.length}</b> / {target} séances</span>
              </div>
              <div className="week" aria-label={`${semaine.length} séances sur ${target} cette semaine`}>
                {jours.map((j) => (
                  <div key={j.lb} className={`week-day ${j.fait ? "done" : ""} ${j.auj ? "today" : ""}`}>
                    <span className="week-mark"><Icon nom="check" taille={16} /></span>
                    {j.lb}
                  </div>
                ))}
              </div>
              <Link href="/seance" className="btn btn-primary btn-block" style={{ marginTop: 22 }}>
                Commencer la séance <Icon nom="fleche" taille={18} />
              </Link>
            </>
          ) : (
            <>
              <div className="today-kicker">Repos imposé</div>
              <h2 id="today" className="today-title">{P.phase}</h2>
              <p className="today-sub" style={{ marginTop: 12 }}>{P.cle}</p>
              <p className="meta" style={{ marginTop: 12, fontStyle: "italic" }}>{P.citation}</p>
            </>
          )}
        </section>

        <div className="stack" style={{ marginTop: 0 }}>
          {sf && v ? (
            <section className="panel" aria-label="Forme du jour">
              <div className="forme">
                <div className="ring">
                  <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
                    <circle className="ring-track" cx="66" cy="66" r="56" />
                    <circle className="ring-fill" cx="66" cy="66" r="56" stroke={sf.col} strokeDasharray={351.9} strokeDashoffset={351.9 * (1 - sf.s / 100)} />
                  </svg>
                  <div className="ring-center"><span className="num" style={{ color: sf.col }}>{sf.s}</span><span>forme</span></div>
                </div>
                <div>
                  <div className="section-title">{sf.lab === "FRAIS" ? "Tu es frais" : sf.lab === "CORRECT" ? "Forme correcte" : "Tu es fatigué"}</div>
                  <p className="meta" style={{ marginTop: 6 }}>{v.msg}</p>
                  <form action={refaireCheckin}><button type="submit" className="link" style={{ fontSize: 13, marginTop: 10 }}>Refaire le check-in</button></form>
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
            <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">Séances au total</div></div>
            <div className="stat"><div className="stat-value">{P.phaseNom ? `S${P.phase?.match(/SEMAINE (\d+)/)?.[1] ?? "1"}` : "—"}</div><div className="stat-label">Semaine du cycle</div></div>
          </div>
        </div>
      </div>

      <p className="motto">« Discipline today, results tomorrow »</p>
    </div>
  );
}
