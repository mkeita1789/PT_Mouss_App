import { Bibliotheque } from "@/components/Bibliotheque";
import { getBilan, getUtilisateur } from "@/lib/data";
import { buildProgram } from "@/lib/coaching/programme";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Exercices — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const bilan = await getBilan(user.id);
  /* Exercices du programme du client, pour le filtre « Mon programme » */
  const programme = bilan ? [...new Set(buildProgram(bilan.reponses, bilan.debut).days.flatMap((d) => d.ex.map((e) => e.n)))] : [];

  return (
    <div className="reveal" style={{ maxWidth: 820 }}>
      <header className="page-head">
        <h1 className="page-title">{T.exos.titre}</h1>
        <p className="page-lede">{T.exos.lede}</p>
      </header>
      <Bibliotheque programme={programme} />
    </div>
  );
}
