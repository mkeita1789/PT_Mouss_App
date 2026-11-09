import Link from "next/link";
import { Icon, type NomIcone } from "@/components/Icon";
import { getBilan, getHistorique, getReath, getUtilisateur } from "@/lib/data";
import { EXDB } from "@/lib/coaching/exdb";
import { buildProgram, phaseFor } from "@/lib/coaching/programme";
import { indexJourSuivant } from "@/lib/coaching/seance";
import { lireProgramme } from "@/lib/coaching/programmes-speciaux";
import { tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Entraînement — PT Mouss IA" };

type Entree = { href: string; ico: NomIcone; titre: string; sous: string };

function Liste({ titre, entrees }: { titre: string; entrees: Entree[] }) {
  return (
    <section className="section">
      <div className="section-head"><h2 className="section-title">{titre}</h2></div>
      <div className="panel menu-liste">
        {entrees.map((e) => (
          <Link key={e.href + e.titre} href={e.href} className="menu-item">
            <span className="menu-ico"><Icon nom={e.ico} taille={21} /></span>
            <span className="menu-txt">
              <span className="menu-titre">{e.titre}</span>
              <span className="menu-sous">{e.sous}</span>
            </span>
            <Icon nom="fleche" taille={18} className="muted" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function Page() {
  const user = await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const E = T.entrainement;
  const [bilan, historique, reath] = await Promise.all([getBilan(user.id), getHistorique(user.id), getReath(user.id)]);

  let sousProgramme = E.programmeSansBilan;
  let sousSeance = "";
  if (bilan) {
    const P = buildProgram(bilan.reponses, bilan.debut);
    const phase = phaseFor(bilan.reponses, bilan.debut);
    sousProgramme = phase ? `${tc(lang, phase.n)} · ${lang === "en" ? "week" : "semaine"} ${phase.week}/${phase.len}` : tc(lang, P.proto);
    const jour = P.repos ? null : P.days[indexJourSuivant(P.days, historique)];
    sousSeance = jour ? `${jour.d} · ${tc(lang, jour.f)}` : T.accueil.reposImpose;
  }

  return (
    <div className="reveal" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <h1 className="page-title">{E.titre}</h1>
        <p className="page-lede">{E.lede}</p>
      </header>

      <Liste
        titre={E.monEntrainement}
        entrees={[
          ...(reath || user.role === "coach"
            ? [(() => {
                const p = reath ? lireProgramme(reath.programme) : null;
                const n = p?.semaines.length ?? 0;
                return { href: "/reathletisation", ico: "drapeau" as const, titre: p ? p.titre[lang] : T.reath.programmes, sous: !reath ? T.reath.inscrireGen : reath.semaine > n ? T.reath.fini : T.reath.semaineSur(reath.semaine, n) };
              })()]
            : []),
          { href: bilan ? "/programme" : "/bilan", ico: "programme", titre: E.programme, sous: sousProgramme },
          ...(bilan ? [{ href: "/seance", ico: "seance" as const, titre: E.seanceJour, sous: sousSeance }] : []),
          { href: "/seance/libre", ico: "crayon", titre: E.libre, sous: E.libreSous },
          { href: "/suivi#historique", ico: "drapeau", titre: E.historique, sous: E.historiqueSous(historique.length) },
        ]}
      />
      <Liste
        titre={E.outils}
        entrees={[
          { href: "/exercices", ico: "livre", titre: E.exercices, sous: E.exercicesSous(Object.keys(EXDB).length) },
          { href: "/chrono", ico: "chrono", titre: E.chrono, sous: E.chronoSous },
          { href: "/chrono?mode=minuteur", ico: "minuteur", titre: E.minuteur, sous: E.minuteurSous },
          ...(user.role === "client" ? [{ href: "/photos", ico: "photo" as const, titre: E.photos, sous: E.photosSous }] : []),
        ]}
      />
    </div>
  );
}
