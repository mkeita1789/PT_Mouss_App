import { redirect } from "next/navigation";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { getBilan, getHistorique, getUtilisateur } from "@/lib/data";
import { lundiCourant, weekNum } from "@/lib/coaching/programme";

export const metadata = { title: "Suivi — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");
  const historique = await getHistorique(user.id);

  const lundi = lundiCourant();
  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundi).length;
  const bienEtre = bilan.reponses.objectif === "Me sentir mieux";

  return (
    <>
      <div className="h1">Ta progression</div>
      <div className="sub">
        {historique.length} séance{historique.length > 1 ? "s" : ""} · semaine {weekNum(bilan.debut) + 1}
      </div>

      <div className="statgrid anim-item">
        <div className="stat"><div className="v" style={{ color: "var(--gold)" }}>{semaine}/{parseInt(bilan.reponses.freq) || 3}</div><div className="l">Cette semaine</div></div>
        <div className="stat"><div className="v" style={{ color: "var(--ok)" }}>{historique.length}</div><div className="l">Au total</div></div>
      </div>

      {/* Objectif « me sentir mieux » : on célèbre la régularité, pas les chiffres */}
      {bienEtre ? (
        <div className="card alert ok">Ici, le seul chiffre qui compte, c'est la régularité. Chaque séance enregistrée est une victoire.</div>
      ) : (
        <>
          <div className="eyebrow">Charges par exercice</div>
          <ProgressionCharges historique={historique} />
        </>
      )}

      <div className="eyebrow">Historique</div>
      <HistoriqueSeances historique={historique} />
    </>
  );
}
