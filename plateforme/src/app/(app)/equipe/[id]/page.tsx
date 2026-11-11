import Link from "next/link";
import { notFound } from "next/navigation";
import { CarteEvenement, dateEvenement, titreEvenement } from "@/components/CarteEvenement";
import { ChoixRole, FormEvenement, FormFiche, InviterEquipe } from "@/components/Equipe";
import { Icon } from "@/components/Icon";
import { retirerMembre } from "../actions";
import { getEquipe, getUtilisateur } from "@/lib/data";
import { bilanSaison, compteurs, estStaff, separer } from "@/lib/equipe";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Équipe — Baara" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params, searchParams }: PageProps<"/equipe/[id]">) {
  const { id } = await params;
  const { vue, tout } = await searchParams;
  if (!UUID.test(id)) notFound();
  const user = await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const E = T.equipe;
  const data = await getEquipe(id, user.id);
  if (!data) notFound();
  const { equipe, moi, membres, evenements, presences } = data;
  const staff = estStaff(moi?.role);
  const joueurs = membres.filter((m) => m.role === "joueur");
  const encadrement = membres.filter((m) => m.role !== "joueur");
  const { aVenir, passes } = separer(evenements);
  const montrerPasses = tout === "1" ? passes : passes.slice(0, 5);
  const saison = bilanSaison(evenements);
  const effectif = vue === "effectif";
  const prochain = aVenir[0];

  return (
    <div className="reveal">
      <header className="page-head">
        <Link href="/equipe" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {E.mesEquipes}
        </Link>
        <h1 className="page-title" style={{ marginTop: 10 }}>{equipe.nom}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {equipe.saison && <span className="pill">{E.saison} {equipe.saison}</span>}
          {moi && <span className={`pill ${staff ? "pill-gold" : ""}`}>{E.roles[moi.role]}</span>}
          <span className="pill">{E.nMembres(membres.length)}</span>
        </div>
      </header>

      <div className="grid-3 equipe-stats">
        <div className="stat">
          <div className="stat-value">{saison.joues ? `${saison.victoires}-${saison.nuls}-${saison.defaites}` : "–"}</div>
          <div className="stat-label">{saison.joues ? E.bilanTexte(saison.joues, saison.victoires, saison.nuls, saison.defaites) : E.bilan}</div>
        </div>
        <div className="stat">
          <div className="stat-value">{saison.joues ? `${saison.pour}:${saison.contre}` : "–"}</div>
          <div className="stat-label">{E.buts(saison.pour, saison.contre)}</div>
        </div>
        <div className="stat">
          <div className="stat-value">{saison.entrainements}</div>
          <div className="stat-label">{E.nEntrainements(saison.entrainements)}</div>
        </div>
      </div>

      {prochain && (
        <Link href={`/equipe/${id}/${prochain.id}`} className="panel panel-hero prochain">
          <div className="today-kicker">{E.prochain}</div>
          <div className="today-title" style={{ fontSize: 28 }}>{titreEvenement(prochain, E)}</div>
          <div className="today-sub maj1">{dateEvenement(prochain.debut, lang)}{prochain.lieu ? ` · ${prochain.lieu}` : ""}</div>
        </Link>
      )}

      <nav className="lang-switch segments" aria-label={E.onglets.calendrier}>
        <Link href={`/equipe/${id}`} className={!effectif ? "on" : ""} aria-current={!effectif ? "page" : undefined}>{E.onglets.calendrier}</Link>
        <Link href={`/equipe/${id}?vue=effectif`} className={effectif ? "on" : ""} aria-current={effectif ? "page" : undefined}>{E.onglets.effectif}</Link>
      </nav>

      {!effectif ? (
        <div className="grid-2 equipe-grille" style={{ alignItems: "start" }}>
          <div className="stack">
            <section className="stack" aria-label={E.aVenir}>
              <h2 className="section-title">{E.aVenir}</h2>
              {aVenir.length ? aVenir.slice(0, 12).map((e) => (
                <CarteEvenement key={e.id} e={e} equipeId={id} joueurs={joueurs} presences={presences} moi={moi} staff={staff} lang={lang} E={E} passe={false} />
              )) : <p className="meta">{E.rienAVenir}</p>}
            </section>
            <section className="stack" aria-label={E.passes} style={{ marginTop: 18 }}>
              <h2 className="section-title">{E.passes}</h2>
              {montrerPasses.length ? montrerPasses.map((e) => (
                <CarteEvenement key={e.id} e={e} equipeId={id} joueurs={joueurs} presences={presences} moi={moi} staff={staff} lang={lang} E={E} passe />
              )) : <p className="meta">{E.rienPasse}</p>}
              {tout !== "1" && passes.length > 5 && <Link href={`/equipe/${id}?tout=1`} className="link" style={{ fontSize: 14 }}>{E.voirTout(passes.length)}</Link>}
            </section>
          </div>
          {staff && (
            <aside className="stack">
              <section className="panel">
                <div className="section-title" style={{ marginBottom: 12 }}>{E.ajouterEvenement}</div>
                <FormEvenement equipeId={id} />
              </section>
              <section className="panel">
                <div className="section-title">{E.codeEquipe}</div>
                <div className="code-pro">{equipe.code}</div>
                <p className="meta" style={{ marginTop: 8 }}>{E.codeAide}</p>
                <InviterEquipe nom={equipe.nom} code={equipe.code} />
              </section>
            </aside>
          )}
        </div>
      ) : (
        <div className="grid-2 equipe-grille" style={{ alignItems: "start" }}>
          <section className="panel" aria-label={E.joueurs} style={{ overflowX: "auto" }}>
            <div className="section-head"><h2 className="section-title">{E.joueurs}</h2><span className="section-note">{joueurs.length}</span></div>
            <table className="tbl effectif">
              <thead><tr>{E.colonnes.map((c) => <th key={c}>{c}</th>)}{staff && <th><span className="sr-only">{E.role}</span></th>}</tr></thead>
              <tbody>
                {joueurs.map((m) => {
                  const c = compteurs(m.id, evenements, presences);
                  return (
                    <tr key={m.id}>
                      <td>
                        <b style={{ fontWeight: 600 }}>{m.numero !== null && <span className="num muted">{m.numero} </span>}{m.nom}</b>
                        <div className="row-sub">{[m.poste, m.user_id ? null : E.sansCompte].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="num">{c.entrainements}/{c.entrainementsTotal}{c.taux !== null && <span className="muted" style={{ fontSize: 12 }}> · {c.taux} %</span>}</td>
                      <td className="num">{c.matchs}</td>
                      <td className="num">{c.minutes}</td>
                      {staff && (
                        <td style={{ whiteSpace: "nowrap" }}>
                          {m.user_id ? <ChoixRole equipeId={id} membreId={m.id} role={m.role} /> : null}
                          <form action={retirerMembre.bind(null, id, m.id, false)} style={{ display: "inline" }}>
                            <button type="submit" className="link" style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: 8 }}>{E.retirer}</button>
                          </form>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <div className="stack">
            <section className="panel">
              <div className="section-title">{E.staff}</div>
              <div className="rows" style={{ marginTop: 6 }}>
                {encadrement.map((m) => (
                  <div key={m.id} className="row-item">
                    <div className="row-main">
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{m.nom}</div>
                      <div className="row-sub">{E.roles[m.role]}{m.user_id ? "" : ` · ${E.sansCompte}`}</div>
                    </div>
                    {staff && m.user_id && m.user_id !== user.id && <ChoixRole equipeId={id} membreId={m.id} role={m.role} />}
                  </div>
                ))}
              </div>
            </section>
            {staff && (
              <section className="panel">
                <div className="section-title" style={{ marginBottom: 6 }}>{E.ajouterJoueur}</div>
                <FormFiche equipeId={id} />
              </section>
            )}
            <p className="meta" style={{ fontSize: 12.5 }}>{E.confidentialite}</p>
            {moi && equipe.cree_par !== user.id && (
              <form action={retirerMembre.bind(null, id, moi.id, true)}>
                <button type="submit" className="btn btn-ghost btn-block"><Icon nom="sortie" taille={18} /> {E.quitter}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
