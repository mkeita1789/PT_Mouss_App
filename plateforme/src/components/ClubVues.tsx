import Link from "next/link";
import { RESEAUX, parMois, type Equipe, type Evenement, type Membre, type Tactique } from "@/lib/equipe";
import { locale, type Lang } from "@/lib/i18n";
import type { TextesUI } from "@/lib/i18n/ui";
import { titreEvenement } from "./CarteEvenement";
import { Icon } from "./Icon";

type C = TextesUI["club"];
type E = TextesUI["equipe"];

/** Contacter le club : appeler, réseaux sociaux */
export function ContactClub({ equipe, C }: { equipe: Equipe; C: C }) {
  const reseaux = RESEAUX.filter((r) => equipe.reseaux?.[r]);
  if (!equipe.telephone && !reseaux.length) return null;
  return (
    <section className="panel contact-club">
      <div className="section-title">{C.contact}</div>
      {equipe.telephone && (
        <a className="btn btn-primary btn-block" style={{ marginTop: 12 }} href={`tel:${equipe.telephone.replace(/[^+0-9]/g, "")}`}>
          <Icon nom="message" taille={18} /> {C.appeler}{equipe.contact_nom ? ` · ${equipe.contact_nom}` : ""}
        </a>
      )}
      {equipe.telephone && <div className="num meta" style={{ textAlign: "center", marginTop: 6 }}>{equipe.telephone}</div>}
      {reseaux.length > 0 && (
        <div className="chips" style={{ marginTop: 12 }}>
          {reseaux.map((r) => (
            <a key={r} className="chip" href={equipe.reseaux![r]} target="_blank" rel="noopener noreferrer">{C.reseauxNoms[r]}</a>
          ))}
        </div>
      )}
    </section>
  );
}

/** Une ligne de calendrier compacte (date, heure, titre, lieu, score) */
function LigneEvenement({ e, lang, E, lien }: { e: Evenement; lang: Lang; E: E; lien: string | null }) {
  const d = new Date(e.debut);
  const jour = d.toLocaleDateString(locale(lang), { weekday: "short", day: "numeric", timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const score = e.score_pour !== null && e.score_contre !== null ? `${e.score_pour}–${e.score_contre}` : null;
  const contenu = (
    <>
      <span className="saison-jour maj1">{jour}<span className="meta"> · {heure}</span></span>
      <span className="saison-titre">
        <b>{titreEvenement(e, E)}</b>
        <span className="meta">{[e.type === "match" && e.domicile !== null ? (e.domicile ? E.domicile : E.exterieur) : null, e.lieu].filter(Boolean).join(" · ")}</span>
      </span>
      {score && <span className="num saison-score">{score}</span>}
    </>
  );
  return lien ? <Link href={lien} className={`saison-ligne type-${e.type}`}>{contenu}</Link> : <div className={`saison-ligne type-${e.type}`}>{contenu}</div>;
}

/** Calendrier de la saison, mois par mois */
export function SaisonCalendrier({ evenements, equipeId, lang, E, C, liens, matchsSeulement }: {
  evenements: Evenement[]; equipeId: string; lang: Lang; E: E; C: C; liens: boolean; matchsSeulement: boolean;
}) {
  const liste = matchsSeulement ? evenements.filter((e) => e.type === "match") : evenements;
  return (
    <section className="panel">
      <div className="section-head">
        <h2 className="section-title">{C.saison}</h2>
        <span className="chips" style={{ gap: 6 }}>
          <Link href={`/equipe/${equipeId}?saison=matchs`} className={`chip ${matchsSeulement ? "on" : ""}`} scroll={false}>{C.matchsSeulement}</Link>
          <Link href={`/equipe/${equipeId}?saison=tout`} className={`chip ${!matchsSeulement ? "on" : ""}`} scroll={false}>{C.tout}</Link>
        </span>
      </div>
      {liste.length ? parMois(liste).map(({ mois, liste: l }) => (
        <div key={mois} className="saison-mois">
          <div className="saison-mois-titre maj1">{new Date(`${mois}-15T12:00:00Z`).toLocaleDateString(locale(lang), { month: "long", year: "numeric", timeZone: "Europe/Paris" })}</div>
          {l.map((e) => <LigneEvenement key={e.id} e={e} lang={lang} E={E} lien={liens ? `/equipe/${equipeId}/${e.id}` : null} />)}
        </div>
      )) : <p className="meta">{E.rienAVenir}</p>}
    </section>
  );
}

/** Espace parents : ce week-end, à venir, contact du club — rien d'autre */
export function VueParents({ equipe, evenements, weekend, aVenir, lang, E, C }: {
  equipe: Equipe; evenements: Evenement[]; weekend: Evenement[]; aVenir: Evenement[]; lang: Lang; E: E; C: C;
}) {
  return (
    <div className="grid-2 equipe-grille" style={{ alignItems: "start" }}>
      <div className="stack">
        <p className="meta">{C.parentAide}</p>
        <section className="panel panel-hero">
          <div className="today-kicker">{C.ceWeekend}</div>
          {weekend.length ? weekend.map((e) => <LigneEvenement key={e.id} e={e} lang={lang} E={E} lien={null} />) : <p className="today-sub">{C.rienCeWeekend}</p>}
        </section>
        <section className="panel">
          <h2 className="section-title">{C.aVenir}</h2>
          {aVenir.length ? aVenir.slice(0, 10).map((e) => <LigneEvenement key={e.id} e={e} lang={lang} E={E} lien={null} />) : <p className="meta">{E.rienAVenir}</p>}
        </section>
      </div>
      <div className="stack">
        <ContactClub equipe={equipe} C={C} />
        <SaisonCalendrier evenements={evenements} equipeId={equipe.id} lang={lang} E={E} C={C} liens={false} matchsSeulement />
      </div>
    </div>
  );
}

/** Un contenu tactique */
function CarteTactique({ t, nomMembre, C, supprimer, lang }: { t: Tactique; nomMembre: (id: string) => string; C: C; supprimer?: React.ReactNode; lang: Lang }) {
  return (
    <article className={`tactique genre-${t.genre}`}>
      <div className="row-sub">
        <span className="pill" style={{ fontSize: 11.5 }}>{t.cible === "equipe" ? C.cibles.equipe : t.cible === "ligne" ? C.lignes[t.ligne ?? ""] : nomMembre(t.membre_id ?? "")}</span>
        {" "}{t.auteur_nom} · {new Date(t.cree_le).toLocaleDateString(locale(lang), { day: "numeric", month: "short", timeZone: "Europe/Paris" })}
      </div>
      <h3 className="tactique-titre">{t.titre}</h3>
      {t.texte && <p className="tactique-texte">{t.texte}</p>}
      {t.url && (
        <a className="btn btn-ghost btn-sm" href={t.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8 }}>
          <Icon nom="video" taille={16} /> {C.voirVideo}
        </a>
      )}
      {supprimer}
    </article>
  );
}

/** Tactique : pour toi, principes de jeu (équipe puis lignes), consignes, vidéos */
export function ListeTactique({ tactiques, membres, moi, staff, C, lang, supprimer }: {
  tactiques: Tactique[]; membres: Membre[]; moi: Membre | null; staff: boolean; C: C; lang: Lang;
  supprimer: (id: string) => React.ReactNode;
}) {
  const nom = (id: string) => membres.find((m) => m.id === id)?.nom ?? "?";
  const pourMoi = !staff && moi ? tactiques.filter((t) => t.cible === "joueur" && t.membre_id === moi.id) : [];
  const reste = tactiques.filter((t) => !pourMoi.includes(t));
  const groupes: [string, Tactique[]][] = [
    [C.pourToi, pourMoi],
    [C.principes, reste.filter((t) => t.genre === "principe")],
    [C.consignes, reste.filter((t) => t.genre === "consigne")],
    [C.videos, reste.filter((t) => t.genre === "video")],
  ];
  if (!tactiques.length) return <p className="meta">{C.aucuneTactique}</p>;
  return (
    <div className="stack">
      {groupes.filter(([, l]) => l.length).map(([titre, l]) => (
        <section key={titre} className="panel">
          <h2 className="section-title">{titre}</h2>
          <div className="stack" style={{ gap: 12, marginTop: 10 }}>
            {l.map((t) => <CarteTactique key={t.id} t={t} nomMembre={nom} C={C} lang={lang} supprimer={staff ? supprimer(t.id) : undefined} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
