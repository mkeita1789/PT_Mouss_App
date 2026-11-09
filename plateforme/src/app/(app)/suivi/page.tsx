import { redirect } from "next/navigation";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { Icon } from "@/components/Icon";
import { chargesParExercice, getBilan, getHistorique, getUtilisateur } from "@/lib/data";
import { lundiCourant, weekNum } from "@/lib/coaching/programme";
import { meilleureProgression } from "@/lib/coaching/alertes";

export const metadata = { title: "Progression — PT Mouss IA" };

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");
  const historique = await getHistorique(user.id);

  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;
  const bienEtre = bilan.reponses.objectif === "Me sentir mieux";
  const best = meilleureProgression(historique);
  const enHausse = Object.values(chargesParExercice(historique)).filter((p) => p.length > 1 && p[p.length - 1].kg > p[0].kg).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">Semaine {weekNum(bilan.debut) + 1} depuis ton bilan</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>Ta progression</h1>
      </header>

      <div className="grid-3">
        <div className="stat"><div className="stat-value">{semaine}<small>/{parseInt(bilan.reponses.freq) || 3}</small></div><div className="stat-label">Cette semaine</div></div>
        <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">Séances au total</div></div>
        {bienEtre ? (
          <div className="stat"><div className="stat-value">{Math.max(0, weekNum(bilan.debut) + 1)}</div><div className="stat-label">Semaines de régularité</div></div>
        ) : (
          <div className="stat"><div className="stat-value ok">{enHausse}</div><div className="stat-label">Charges en hausse</div></div>
        )}
      </div>

      {/* Objectif « me sentir mieux » : on célèbre la régularité, pas les chiffres */}
      {bienEtre ? (
        <div className="note note-ok section">
          <span className="note-icon"><Icon nom="feuille" taille={17} /></span>
          <div>Ici, le seul chiffre qui compte, c'est la régularité. Chaque séance enregistrée est une victoire.</div>
        </div>
      ) : (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Charges par exercice</h2>
            {best && <span className="section-note">Meilleure hausse : <b className="ok">+{fmt(best.gain)} kg</b> sur {best.nom}</span>}
          </div>
          <ProgressionCharges historique={historique} />
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">Historique</h2><span className="section-note">Touche une séance pour le détail</span></div>
        <HistoriqueSeances historique={historique} />
      </section>
    </div>
  );
}
