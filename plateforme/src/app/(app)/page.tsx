import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckinCard } from "@/components/CheckinCard";
import { refaireCheckin } from "./actions";
import { getBilan, getCheckinDuJour, getHistorique, getUtilisateur } from "@/lib/data";
import { buildProgram, lundiCourant, scoreForme, verdictCheckin } from "@/lib/coaching/programme";
import { messagesClient } from "@/lib/coaching/alertes";

const COULEUR = { ko: "var(--ko)", gold: "var(--gold)", ok: "var(--ok)" } as const;

export default async function Accueil() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect(user.role === "coach" ? "/coach" : "/bilan");

  const [historique, ci] = await Promise.all([getHistorique(user.id), getCheckinDuJour(user.id)]);
  const P = buildProgram(bilan.reponses, bilan.debut);
  const lundi = lundiCourant();
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundi).length;
  const target = parseInt(bilan.reponses.freq) || 3;
  const sf = ci ? scoreForme(ci, semaine, bilan.reponses.freq) : null;
  const v = ci ? verdictCheckin(ci) : null;
  const msgs = messagesClient({
    prenom: bilan.reponses.prenom,
    corps: ci?.corps,
    deload: P.deload,
    historique,
    seancesSemaine: semaine,
    freq: bilan.reponses.freq,
  });

  const heure = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Salut" : "Bonsoir";

  return (
    <>
      <div className="h1">
        {salut}, <em>{bilan.reponses.prenom}</em>
      </div>
      <div className="sub">{P.phase || P.proto}</div>

      {sf && v ? (
        <>
          <form action={refaireCheckin}>
            <button type="submit" className="scorering anim-item" style={{ background: "none", border: "none", cursor: "pointer", display: "block", margin: "0 auto" }} title="Refaire le check-in">
              <svg width="150" height="150" aria-hidden>
                <circle className="track" cx="75" cy="75" r="62" />
                <circle cx="75" cy="75" r="62" fill="none" stroke={sf.col} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="389" strokeDashoffset={389 * (1 - sf.s / 100)}
                  style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
              </svg>
              <div className="scorenum">
                <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 40, color: sf.col, lineHeight: 1 }}>{sf.s}</div>
                <div style={{ fontSize: 8.5, color: "var(--muted)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 3 }}>Forme · {sf.lab}</div>
              </div>
            </button>
          </form>
          <div style={{ textAlign: "center", margin: "-4px 0 12px" }}>
            <span className="badge" style={{ color: v.col, border: `1.5px solid ${v.col}`, fontSize: 11, padding: "6px 14px" }}>
              Séance du jour : {v.v === "REPORTER" ? "à reporter" : v.v === "ALLÉGER" ? "allégée" : "normale"}
            </span>
          </div>
          {v.v !== "MAINTENIR" && <div className="card alert" style={{ borderLeftColor: v.col }}>{v.msg}</div>}
        </>
      ) : (
        <CheckinCard />
      )}

      {msgs.map((m, i) => (
        <div key={i} className="card anim-item" style={{ borderLeft: `3px solid ${COULEUR[m.niveau]}` }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="jc" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14 }}>M</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, paddingTop: 2 }}>{m.t}</div>
          </div>
        </div>
      ))}

      <div className="statgrid anim-item">
        <div className="stat"><div className="v" style={{ color: "var(--gold)" }}>{semaine}/{target}</div><div className="l">Cette semaine</div></div>
        <div className="stat"><div className="v" style={{ color: "var(--ok)" }}>{historique.length}</div><div className="l">Séances au total</div></div>
      </div>

      {!P.repos && (
        <Link href="/seance" className="btn p anim-item" style={{ textAlign: "center" }}>
          Lancer la séance
        </Link>
      )}
      <div style={{ textAlign: "center", fontFamily: "var(--font-oswald)", fontSize: 11, letterSpacing: ".14em", color: "var(--gold)", textTransform: "uppercase", marginTop: 18 }}>
        « Discipline today, results tomorrow »
      </div>
    </>
  );
}
