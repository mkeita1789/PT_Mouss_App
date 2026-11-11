import Link from "next/link";
import { FormCreerEquipe, FormRejoindreEquipe } from "@/components/Equipe";
import { Icon } from "@/components/Icon";
import { Vestiaire } from "@/components/VisuelsFoot";
import { getMesEquipes, getUtilisateur } from "@/lib/data";
import { estStaff } from "@/lib/equipe";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { estPro } from "@/lib/profils";

export const metadata = { title: "Équipe — Baara" };

export default async function Page({ searchParams }: PageProps<"/equipe">) {
  const brut = (await searchParams).code;
  const code = typeof brut === "string" && /^[A-Za-z0-9]{6}$/.test(brut) ? brut.toUpperCase() : undefined;
  const user = await getUtilisateur();
  const T = ui(await getLang());
  const E = T.equipe;
  const equipes = await getMesEquipes(user.id);
  /* Quelqu'un qui encadre voit d'abord « créer » ; un joueur, d'abord « rejoindre » */
  const encadre = user.role === "coach" || estPro(user.metier);

  const creer = (
    <section className="panel" key="creer">
      <div className="section-title" style={{ marginBottom: 12 }}>{E.creer}</div>
      <FormCreerEquipe roleParDefaut={user.metier === "prepa" ? "prepa" : "entraineur"} />
    </section>
  );
  const rejoindre = (
    <section className="panel" key="rejoindre">
      <div className="section-title" style={{ marginBottom: 12 }}>{E.rejoindre}</div>
      <FormRejoindreEquipe code={code} />
    </section>
  );

  return (
    <div className="reveal" style={{ maxWidth: 760 }}>
      <header className="page-head vestiaire-tete">
        <Vestiaire className="vestiaire-visuel" />
        <h1 className="page-title">{E.mesEquipes}</h1>
        <p className="page-lede">{E.lede}</p>
      </header>

      {equipes.length > 0 ? (
        <div className="stack" style={{ marginBottom: 24 }}>
          {equipes.map((e) => (
            <Link key={e.id} href={`/equipe/${e.id}`} className="panel row-link">
              <span className="note-icon"><Icon nom="equipe" taille={18} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontWeight: 600, fontSize: 16 }}>{e.nom}</b><br />
                <span className="meta" style={{ fontSize: 13 }}>{[e.saison, E.roles[e.role], E.nMembres(e.membres)].filter(Boolean).join(" · ")}</span>
              </span>
              {estStaff(e.role) && <span className="pill pill-gold" style={{ fontSize: 12 }}>{E.staff}</span>}
              <Icon nom="fleche" taille={18} className="muted" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="section-title">{E.aucune}</div>
          <p className="meta" style={{ marginTop: 6 }}>{E.aucuneTexte}</p>
        </div>
      )}

      <div className="stack">{encadre && !code ? [creer, rejoindre] : [rejoindre, creer]}</div>
    </div>
  );
}
