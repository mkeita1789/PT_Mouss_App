import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ReathParcours } from "@/components/ReathParcours";
import { getReath, getReathSeances, getUtilisateur } from "@/lib/data";
import { NB_SEMAINES } from "@/lib/coaching/reath-lca";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Réathlétisation LCA — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const R = T.reath;
  const [reath, seances] = await Promise.all([getReath(user.id), getReathSeances(user.id)]);

  return (
    <div className="reveal" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <Link href="/entrainement" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.nav.entrainement}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{R.titre}</h1>
        <p className="page-lede">{reath ? R.lede : R.nonInscrite}</p>
      </header>
      {reath && <ReathParcours semaineOuverte={Math.min(reath.semaine, NB_SEMAINES)} termine={reath.semaine > NB_SEMAINES} seances={seances} vma={reath.vma} />}
    </div>
  );
}
