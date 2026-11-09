import { redirect } from "next/navigation";
import { SeanceTracker, type JourPrepare } from "@/components/SeanceTracker";
import { getBilan, getCheckinDuJour, getHistorique, getUtilisateur } from "@/lib/data";
import { buildProgram, phaseFor, verdictCheckin, warmup } from "@/lib/coaching/programme";
import { prepareSeance } from "@/lib/coaching/seance";

export const metadata = { title: "Séance — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");

  const [historique, ci] = await Promise.all([getHistorique(user.id, 60), getCheckinDuJour(user.id)]);
  const P = buildProgram(bilan.reponses, bilan.debut);

  if (P.repos)
    return (
      <div className="card" style={{ textAlign: "center", padding: "28px 16px", marginTop: 18 }}>
        <div style={{ fontSize: 40 }}>🛑</div>
        <div style={{ fontFamily: "var(--font-oswald)", fontWeight: 700, fontSize: 20, textTransform: "uppercase", marginTop: 8 }}>Repos imposé</div>
        <div className="sub">Le repos fait partie du programme. Reviens frais.</div>
      </div>
    );

  const phase = phaseFor(bilan.reponses, bilan.debut);
  const v = ci ? verdictCheckin(ci) : null;
  const alleger = v?.v === "ALLÉGER";

  /* Jour suggéré : celui qui suit la dernière séance faite */
  const derniere = historique[0]?.jour_code;
  const iDerniere = P.days.findIndex((d) => d.d === derniere);
  const jourSuggere = iDerniere >= 0 ? (iDerniere + 1) % P.days.length : 0;

  const jours: JourPrepare[] = P.days.map((d) => ({
    d: d.d,
    f: d.f,
    crit: !!d.crit,
    lignes: prepareSeance(d, historique, phase, !!P.deload, alleger),
  }));

  return (
    <SeanceTracker
      jours={jours}
      jourInitial={jourSuggere}
      echauffement={warmup(bilan.reponses)}
      verdict={v && v.v !== "MAINTENIR" ? { v: v.v, col: v.col, msg: v.msg } : null}
      allegee={alleger}
      deload={!!P.deload}
    />
  );
}
