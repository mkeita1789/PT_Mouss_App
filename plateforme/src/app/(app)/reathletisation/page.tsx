import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ReathCoach } from "@/components/ReathCoach";
import { ReathParcours } from "@/components/ReathParcours";
import { getReath, getReathSeances, getUtilisateur } from "@/lib/data";
import { lireProgramme } from "@/lib/coaching/programmes-speciaux";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Programme — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const R = T.reath;
  const coach = user.role === "coach";
  const [reath, seances] = await Promise.all([getReath(user.id), getReathSeances(user.id)]);
  const prog = reath ? lireProgramme(reath.programme) : null;

  return (
    <div className="reveal" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <Link href="/entrainement" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.nav.entrainement}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{prog ? prog.titre[lang] : R.programmes}</h1>
        <p className="page-lede">{prog ? prog.lede[lang] : coach ? R.coachSoiGen : R.nonInscriteGen}</p>
      </header>
      {/* Le coach gère son propre parcours (choix du programme, semaines) */}
      {coach && (
        <section style={{ marginBottom: 18 }}>
          <ReathCoach clientId={user.id} reath={reath} seances={seances} lang={lang} ouvert />
        </section>
      )}
      {reath && prog && (
        <ReathParcours programme={reath.programme} semaineOuverte={Math.min(reath.semaine, prog.semaines.length)} termine={reath.semaine > prog.semaines.length} seances={seances} vma={reath.vma} />
      )}
    </div>
  );
}
