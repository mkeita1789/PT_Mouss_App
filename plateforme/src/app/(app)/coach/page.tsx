import Link from "next/link";
import { exigerCoach, getCheckinsRecents, getClients, getSeancesTousClients } from "@/lib/data";
import { alertesCoach, joursDepuis } from "@/lib/coaching/alertes";
import { lundiCourant, phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Espace coach — PT Mouss IA" };

const COULEUR = { ko: "var(--ko)", gold: "var(--gold)", ok: "var(--ok)" } as const;

export default async function Page() {
  const coach = await exigerCoach();
  const [clients, seances, checkins] = await Promise.all([getClients(coach.id), getSeancesTousClients(), getCheckinsRecents(7)]);
  const lundi = lundiCourant();

  const lignes = clients.map((c) => {
    const hist = seances[c.id] ?? [];
    const ci = checkins.filter((x) => x.user_id === c.id);
    const alertes = alertesCoach(hist, ci);
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

  return (
    <>
      <div className="h1">Espace <em>coach</em></div>
      <div className="sub">Séances et charges de tes clients, avec les points à surveiller en premier.</div>

      <div className="statgrid anim-item" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat"><div className="v" style={{ color: "var(--gold)" }}>{clients.length}</div><div className="l">Clients</div></div>
        <div className="stat"><div className="v" style={{ color: "var(--ok)" }}>{seancesSemaine}</div><div className="l">Séances / sem.</div></div>
        <div className="stat"><div className="v" style={{ color: aSuivre ? "var(--ko)" : "var(--ok)" }}>{aSuivre}</div><div className="l">À suivre</div></div>
      </div>

      {!clients.length && (
        <div className="card muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Aucun client pour l'instant. Envoie le lien de l'appli à tes clients : ils créent leur compte, font leur bilan, et apparaissent ici.
        </div>
      )}

      {lignes.map((l) => (
        <Link key={l.id} href={`/coach/${l.id}`} className="card anim-item" style={{ display: "block", borderLeft: `3px solid ${l.gravite === 2 ? "var(--ko)" : l.gravite ? "var(--gold)" : "var(--ok)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 18, textTransform: "uppercase" }}>{l.prenom || "Sans prénom"}</div>
            <div style={{ fontFamily: "var(--font-oswald)", color: "var(--gold)", fontSize: 13, whiteSpace: "nowrap" }}>
              {l.semaine}/{parseInt(l.bilan?.reponses.freq ?? "") || "–"} cette sem.
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
            {l.bilan ? l.bilan.reponses.objectif : "Bilan non fait"}
            {l.phase && ` · ${l.phase.n} (S${l.phase.week})`}
            {` · ${l.hist.length} séance${l.hist.length > 1 ? "s" : ""}`}
            {l.jours !== null && ` · dernière il y a ${l.jours === 0 ? "moins d'1 j" : `${l.jours} j`}`}
          </div>
          {l.alertes.slice(0, 3).map((a, i) => (
            <div key={i} style={{ fontSize: 12, marginTop: 7, lineHeight: 1.45 }}>
              <span style={{ color: COULEUR[a.niveau], fontWeight: 600 }}>● {a.titre}</span>
              <span className="muted"> — {a.detail}</span>
            </div>
          ))}
          {l.alertes.length > 3 && <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>+ {l.alertes.length - 3} autre(s)</div>}
        </Link>
      ))}
    </>
  );
}
