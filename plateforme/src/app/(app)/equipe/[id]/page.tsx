import Link from "next/link";
import { notFound } from "next/navigation";
import { CarteEvenement, dateEvenement, titreEvenement } from "@/components/CarteEvenement";
import { ChoixRole, FormEvenement, FormFiche, InviterEquipe } from "@/components/Equipe";
import { EncartSemaine } from "@/components/EquipeStaff";
import { Icon } from "@/components/Icon";
import { annulerInvitation, retirerMembre, supprimerMessageEquipe } from "../actions";
import { AccepterSuivi, EcrireMembres, InviterStaff } from "@/components/EquipeRoles";
import { getComposition, getEquipe, getInvitationsEquipe, getMesPros, getMesSportifs, getMessagesEquipe, getUtilisateur } from "@/lib/data";
import { Composition } from "@/components/Composition";
import { FormClub, PhotoMembre } from "@/components/Club";
import { bilanSaison, compteurs, estStaff, gereClub, gerePhotos, peutEcrire, resumeSemaine, separer, texteSur } from "@/lib/equipe";
import { locale, ui } from "@/lib/i18n";
import { paletteClub } from "@/lib/couleurs-club";
import { Terrain } from "@/components/VisuelsFoot";
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
  const { equipe, moi, membres, evenements, presences, photos, logo } = data;
  const photosOk = gerePhotos(moi?.role);
  const staff = estStaff(moi?.role);
  const joueurs = membres.filter((m) => m.role === "joueur");
  const encadrement = membres.filter((m) => m.role !== "joueur");
  const { aVenir, passes } = separer(evenements);
  const montrerPasses = tout === "1" ? passes : passes.slice(0, 5);
  const saison = bilanSaison(evenements);
  const role = moi?.role;
  const prepa = role === "prepa";
  const onglets: [string, string][] = [
    ["calendrier", E.onglets.calendrier], ["effectif", E.onglets.effectif], ["compo", E.compo], ["messages", E.messages],
    ...(prepa ? [["preparation", E.preparation] as [string, string]] : []),
    ...(gereClub(role) ? [["club", E.club] as [string, string]] : []),
  ];
  const onglet = onglets.some(([k]) => k === vue) ? (vue as string) : "calendrier";
  const [messages, invitations, mesSportifs, mesPros] = await Promise.all([
    onglet === "messages" ? getMessagesEquipe(id) : Promise.resolve([]),
    onglet === "effectif" && role === "entraineur" ? getInvitationsEquipe(id) : Promise.resolve([]),
    onglet === "preparation" && prepa ? getMesSportifs(user.id) : Promise.resolve([]),
    onglet === "calendrier" && role === "joueur" ? getMesPros(user.id) : Promise.resolve([]),
  ]);
  /* Préparateurs de l'équipe que le joueur n'a pas encore acceptés */
  const prepasAProposer = role === "joueur" ? membres.filter((m) => m.role === "prepa" && m.user_id && !mesPros.some((p) => p.id === m.user_id)) : [];
  const dateCourte = (iso: string) => new Date(iso).toLocaleDateString(locale(lang), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const effectif = onglet === "effectif";
  const compo = onglet === "compo" ? await getComposition(id, null) : null;
  const prochain = aVenir[0];
  const semaine = staff && onglet === "calendrier" ? resumeSemaine(evenements, joueurs, presences) : null;
  const palette = paletteClub(equipe.couleur1, equipe.couleur2);
  const club = { "--club1": equipe.couleur1 || "var(--gold)", "--club2": equipe.couleur2 || "var(--surface-2)", "--club1-texte": texteSur(equipe.couleur1) } as React.CSSProperties;

  return (
    <div className="reveal" style={club}>
      {palette && <style>{palette}</style>}
      <header className="page-head club-tete">
        <Terrain className="club-tete-terrain" />
        <Link href="/equipe" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {E.mesEquipes}
        </Link>
        <div className="club-titre">
          <span className="logo-club">
            {/* eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire */}
            {logo ? <img src={logo} alt={E.logo} /> : <Icon nom="ballon" taille={28} />}
          </span>
          <h1 className="page-title">{equipe.nom}</h1>
        </div>
        {(equipe.couleur1 || equipe.couleur2) && <span className="club-bande" aria-hidden />}
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

      {onglet === "calendrier" && equipe.valeurs && (
        <section className="panel valeurs-club">
          <div className="today-kicker">{E.nosValeurs}</div>
          <p>{equipe.valeurs}</p>
        </section>
      )}

      <nav className="lang-switch segments onglets-equipe" aria-label={E.onglets.calendrier}>
        {onglets.map(([k, lb]) => (
          <Link key={k} href={k === "calendrier" ? `/equipe/${id}` : `/equipe/${id}?vue=${k}`} className={onglet === k ? "on" : ""} aria-current={onglet === k ? "page" : undefined}>{lb}</Link>
        ))}
      </nav>

      {onglet === "compo" ? (
        <section className="panel">
          <div className="section-head"><h2 className="section-title">{E.compoType}</h2></div>
          {staff && <p className="meta" style={{ marginBottom: 12 }}>{E.compoTypeAide}</p>}
          {staff || compo?.publiee ? (
            <Composition equipeId={id} evenementId={null} editable={staff} initial={compo} couleur1={equipe.couleur1} couleur2={equipe.couleur2}
              joueurs={joueurs.map((m) => ({ id: m.id, nom: m.nom, numero: m.numero, poste: m.poste, photo: photos[m.id] ?? null, reponse: null }))} />
          ) : <p className="meta">{E.pasDeCompo}</p>}
        </section>
      ) : onglet === "messages" ? (
        <div className="grid-2 equipe-grille" style={{ alignItems: "start" }}>
          <section className="stack" aria-label={E.messages}>
            {messages.length ? messages.map((m) => (
              <article key={m.id} className="panel message-equipe">
                <div className="row-sub">
                  <b style={{ color: "var(--ink)", fontWeight: 600 }}>{m.auteur_nom}</b> · {E.roles[m.auteur_role] ?? ""} · {E.cibles[m.cible]} · {dateCourte(m.cree_le)}
                </div>
                <p style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 15 }}>{m.texte}</p>
                {m.auteur_id === user.id && (
                  <form action={supprimerMessageEquipe.bind(null, id, m.id)} style={{ marginTop: 6 }}>
                    <button type="submit" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }}>{E.supprimerMessage}</button>
                  </form>
                )}
              </article>
            )) : <p className="meta">{E.aucunMessage}</p>}
          </section>
          {peutEcrire(role) && (
            <aside className="panel">
              <div className="section-title" style={{ marginBottom: 12 }}>{E.ecrire}</div>
              <EcrireMembres equipeId={id} membres={membres.filter((m) => m.user_id !== user.id)} />
            </aside>
          )}
        </div>
      ) : onglet === "preparation" ? (
        <section className="panel">
          <div className="section-head"><h2 className="section-title">{E.preparation}</h2></div>
          <p className="meta" style={{ marginBottom: 10 }}>{E.preparationAide}</p>
          <div className="rows">
            {joueurs.map((m) => {
              const suivi = m.user_id && mesSportifs.some((s) => s.id === m.user_id);
              return (
                <div key={m.id} className="row-item">
                  <div className="row-main">
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{m.numero !== null && <span className="num muted">{m.numero} </span>}{m.nom}</div>
                    <div className="row-sub">{!m.user_id ? E.sansCompteSuivi : suivi ? E.suiviOk : E.suiviAttente}</div>
                  </div>
                  {suivi && <Link href={`/coach/${m.user_id}`} className="btn btn-ghost btn-sm">{E.programmePerso}</Link>}
                </div>
              );
            })}
          </div>
        </section>
      ) : onglet === "club" ? (
        <section className="panel" style={{ maxWidth: 640 }}>
          <div className="section-head"><h2 className="section-title">{E.personnaliser}</h2></div>
          <FormClub equipe={equipe} logo={logo} />
        </section>
      ) : !effectif ? (
        <div className="grid-2 equipe-grille" style={{ alignItems: "start" }}>
          <div className="stack">
            {semaine && <EncartSemaine r={semaine} equipeId={id} sansJoueur={joueurs.length === 0} lang={lang} E={E} />}
            {prepasAProposer.map((p) => <AccepterSuivi key={p.id} equipeId={id} proMembreId={p.id} nom={p.nom} />)}
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
                        <div className="joueur-cellule">
                          {photosOk ? <PhotoMembre equipeId={id} membreId={m.id} nom={m.nom} url={photos[m.id] ?? null} />
                            : photos[m.id] ? (
                              // eslint-disable-next-line @next/next/no-img-element -- lien signé temporaire
                              <img className="photo-mini" src={photos[m.id]} alt="" />
                            ) : null}
                          <div>
                            <b style={{ fontWeight: 600 }}>{m.numero !== null && <span className="num muted">{m.numero} </span>}{m.nom}</b>
                            <div className="row-sub">{[m.poste, m.user_id ? null : E.sansCompte].filter(Boolean).join(" · ")}</div>
                          </div>
                        </div>
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
            {role === "entraineur" && (
              <section className="panel">
                <div className="section-title" style={{ marginBottom: 6 }}>{E.inviterStaff}</div>
                <InviterStaff equipeId={id} nomEquipe={equipe.nom} />
                {invitations.length > 0 && (
                  <div className="rows" style={{ marginTop: 14 }}>
                    <div className="meta">{E.invitationsEnCours}</div>
                    {invitations.map((i) => (
                      <div key={i.code} className="row-item">
                        <div className="row-main">
                          <div className="num" style={{ fontSize: 17, letterSpacing: "0.12em" }}>{i.code}</div>
                          <div className="row-sub">{E.roles[i.role]} · {E.expireLe(new Date(i.expire_le).toLocaleDateString(locale(lang), { day: "numeric", month: "long" }))}</div>
                        </div>
                        <form action={annulerInvitation.bind(null, id, i.code)}>
                          <button type="submit" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }}>{E.annuler}</button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
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
