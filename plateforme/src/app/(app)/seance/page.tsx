import { redirect } from "next/navigation";
import { SeanceTracker, type JourPrepare } from "@/components/SeanceTracker";
import { getBilan, getCheckinDuJour, getHistorique, getUtilisateur } from "@/lib/data";
import { buildProgram, phaseFor, verdictCheckin, warmup } from "@/lib/coaching/programme";
import { indexJourSuivant, prepareSeance } from "@/lib/coaching/seance";
import { tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Séance — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  if (!bilan) redirect("/bilan");

  const lang = await getLang();
  const T = ui(lang);
  const [historique, ci] = await Promise.all([getHistorique(user.id, 60), getCheckinDuJour(user.id)]);
  const P = buildProgram(bilan.reponses, bilan.debut);

  if (P.repos)
    return (
      <div className="reveal">
        <header className="page-head">
          <div className="meta">{T.seance.duJour}</div>
          <h1 className="page-title" style={{ marginTop: 6 }}>{T.accueil.reposImpose}</h1>
          <p className="page-lede">{T.seance.reposTexte}</p>
        </header>
      </div>
    );

  const phase = phaseFor(bilan.reponses, bilan.debut);
  const v = ci ? verdictCheckin(ci) : null;
  const alleger = v?.v === "ALLÉGER";

  /* Jour suggéré : celui qui suit la dernière séance faite */
  const jourSuggere = indexJourSuivant(P.days, historique);

  const jours: JourPrepare[] = P.days.map((d) => ({
    d: d.d,
    f: d.f,
    crit: !!d.crit,
    lignes: prepareSeance(d, historique, phase, !!P.deload, alleger, lang, (n) => tc(lang, n)),
  }));

  return (
    <SeanceTracker
      jours={jours}
      jourInitial={jourSuggere}
      echauffement={(() => { const w = warmup(bilan.reponses); return { t: tc(lang, w.t), ex: w.ex.map((x) => tc(lang, x)) }; })()}
      verdict={v && v.v !== "MAINTENIR" ? { v: v.v, col: v.col, msg: tc(lang, v.msg) } : null}
      allegee={alleger}
      deload={!!P.deload}
    />
  );
}
