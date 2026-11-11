import { BilanWizard } from "@/components/BilanWizard";
import { OBJECTIFS_FOOT, OBJECTIFS_FORME } from "@/lib/coaching/programme";
import { getBilan, getUtilisateur } from "@/lib/data";
import { familleDe } from "@/lib/profils";

export const metadata = { title: "Bilan — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  /* Un joueur, un entraîneur ou un préparateur a le bilan foot ; les autres, le bilan forme */
  const famille = familleDe(user.metier);
  /* Si le profil a changé depuis le dernier bilan, l'ancien objectif ne s'applique plus */
  const proposes: string[] = famille === "foot" ? OBJECTIFS_FOOT : OBJECTIFS_FORME;
  const initial = bilan?.reponses ?? { prenom: user.prenom };
  const garde = bilan && (proposes.includes(bilan.reponses.objectif) || bilan.reponses.objectif === "Performance sportive ⚽") ? initial : { prenom: initial.prenom };
  return <BilanWizard key={famille} initial={garde} existe={!!bilan} famille={famille} />;
}
