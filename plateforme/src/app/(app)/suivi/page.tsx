import { redirect } from "next/navigation";
import { HistoriqueSeances, ProgressionCharges } from "@/components/Progression";
import { Icon } from "@/components/Icon";
import { chargesParExercice, getBilan, getHistorique, getUtilisateur } from "@/lib/data";
import { lundiCourant, weekNum } from "@/lib/coaching/programme";
import { meilleureProgression } from "@/lib/coaching/alertes";
import { nombre, tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Progression — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");
  const lang = await getLang();
  const T = ui(lang);
  const historique = await getHistorique(user.id);

  const semaine = historique.filter((h) => new Date(h.realisee_le) >= lundiCourant()).length;
  const bienEtre = bilan.reponses.objectif === "Me sentir mieux";
  const best = meilleureProgression(historique);
  const enHausse = Object.values(chargesParExercice(historique)).filter((p) => p.length > 1 && p[p.length - 1].kg > p[0].kg).length;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{T.suivi.semaineDepuis(weekNum(bilan.debut) + 1)}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{T.suivi.titre}</h1>
      </header>

      <div className="grid-3">
        <div className="stat"><div className="stat-value">{semaine}<small>/{parseInt(bilan.reponses.freq) || 3}</small></div><div className="stat-label">{T.suivi.cetteSemaine}</div></div>
        <div className="stat"><div className="stat-value">{historique.length}</div><div className="stat-label">{T.suivi.total}</div></div>
        {bienEtre ? (
          <div className="stat"><div className="stat-value">{Math.max(0, weekNum(bilan.debut) + 1)}</div><div className="stat-label">{T.suivi.regularite}</div></div>
        ) : (
          <div className="stat"><div className="stat-value ok">{enHausse}</div><div className="stat-label">{T.suivi.enHausse}</div></div>
        )}
      </div>

      {/* Objectif « me sentir mieux » : on célèbre la régularité, pas les chiffres */}
      {bienEtre ? (
        <div className="note note-ok section">
          <span className="note-icon"><Icon nom="feuille" taille={17} /></span>
          <div>{T.suivi.bienEtre}</div>
        </div>
      ) : (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">{T.suivi.chargesParExo}</h2>
            {best && <span className="section-note">{T.suivi.meilleure}<b className="ok">+{nombre(lang, best.gain)} kg</b>{T.suivi.sur}{tc(lang, best.nom)}</span>}
          </div>
          <ProgressionCharges historique={historique} lang={lang} />
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2 className="section-title">{T.suivi.historique}</h2><span className="section-note">{T.suivi.toucheDetail}</span></div>
        <HistoriqueSeances historique={historique} lang={lang} />
      </section>
    </div>
  );
}
