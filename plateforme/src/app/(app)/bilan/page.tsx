import { BilanWizard } from "@/components/BilanWizard";
import { getBilan, getUtilisateur } from "@/lib/data";

export const metadata = { title: "Bilan — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  return <BilanWizard initial={bilan?.reponses ?? { prenom: user.prenom }} existe={!!bilan} />;
}
