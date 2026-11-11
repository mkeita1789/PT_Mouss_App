import Link from "next/link";
import { titreEvenement } from "./CarteEvenement";
import { Icon } from "./Icon";
import { bilanReponses, minutesRecentes, momentEvenement, type Evenement, type Membre, type Presence, type ResumeSemaine } from "@/lib/equipe";
import { locale, type Lang } from "@/lib/i18n";
import type { TextesUI } from "@/lib/i18n/ui";

/* Encarts réservés au staff : uniquement calendrier, réponses et présences. Aucune donnée de forme. */

type E = TextesUI["equipe"];

/** « lun. 9 nov. » à partir d'une date du calendrier « 2026-11-09 » */
const jourCourt = (jour: string, lang: Lang) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString(locale(lang), { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
/** « jeu. 12 nov., 19:00 » */
const quand = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(locale(lang), { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const noms = (l: Membre[]) => l.map((m) => m.nom).join(", ");

/* ─── Résumé de la semaine, en haut du calendrier ─── */
export function EncartSemaine({ r, equipeId, sansJoueur, lang, E }: { r: ResumeSemaine; equipeId: string; sansJoueur: boolean; lang: Lang; E: E }) {
  const S = E.semaine;
  return (
    <section className="panel semaine" aria-label={S.titre}>
      <div className="section-head semaine-tete">
        <h2 className="section-title">{S.titre}</h2>
        <span className="section-note">{S.periode(jourCourt(r.lundi, lang), jourCourt(r.dimanche, lang))}</span>
      </div>

      <div className="semaine-stats">
        <div className="semaine-stat">
          <b className="num">{r.entrainementsFaits}/{r.entrainementsPrevus}</b>
          <span>{S.entrainements}</span>
        </div>
        <div className="semaine-stat">
          <b className="num">{r.taux !== null ? `${r.taux} %` : "–"}</b>
          <span>{r.taux !== null ? S.presence : S.presenceVide}</span>
        </div>
        <div className="semaine-stat">
          <b className="num">{r.matchs.length}</b>
          <span>{S.matchs(r.matchs.length)}</span>
        </div>
      </div>
      {r.appelsAFaire > 0 && <p className="semaine-info"><span className="pill pill-gold">{E.appelAFaire}</span> {S.appelsAFaire(r.appelsAFaire)}</p>}

      {r.matchs.length > 0 && (
        <div className="rows semaine-matchs">
          {r.matchs.map((e) => {
            const score = e.score_pour !== null && e.score_contre !== null;
            const issue = score ? (e.score_pour! > e.score_contre! ? "ok" : e.score_pour! < e.score_contre! ? "ko" : "") : "";
            return (
              <Link key={e.id} href={`/equipe/${equipeId}/${e.id}`} className="row-item">
                <div className="row-main">
                  <div className="row-title">{titreEvenement(e, E)}</div>
                  <div className="row-sub maj1">{quand(e.debut, lang)}</div>
                </div>
                {score ? <span className={`evt-score num semaine-score ${issue}`}>{e.score_pour}–{e.score_contre}</span> : <span className="pill pill-gold" style={{ flex: "none" }}>{S.scoreASaisir}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {sansJoueur ? (
        <p className="meta semaine-info">{S.aucunJoueur}</p>
      ) : (
        <div className="stack semaine-notes">
          {r.aRelancer.length > 0 && (
            <div className="note note-gold">
              <span className="note-icon"><Icon nom="message" taille={17} /></span>
              <div className="row-main">
                <b>{S.aRelancer}</b>
                <ul className="semaine-liste">
                  {r.aRelancer.map(({ membre, absences }) => (
                    <li key={membre.id}><span>{membre.nom}</span><span className="meta">{S.absences(absences)}</span></li>
                  ))}
                </ul>
                <div className="row-sub">{S.aRelancerAide}</div>
              </div>
            </div>
          )}
          {r.prochain && (r.sansReponse.length > 0 ? (
            <Link href={`/equipe/${equipeId}/${r.prochain.id}`} className="note semaine-lien">
              <span className="note-icon"><Icon nom="calendrier" taille={17} /></span>
              <div className="row-main">
                <b>{S.sansReponse}</b> <span className="pill" style={{ fontSize: 12, padding: "2px 8px" }}>{r.sansReponse.length}</span>
                <div className="row-sub maj1">{S.pour(titreEvenement(r.prochain, E), quand(r.prochain.debut, lang))}</div>
                <div style={{ marginTop: 4 }}>{noms(r.sansReponse)}</div>
              </div>
            </Link>
          ) : (
            <p className="meta semaine-info">{S.tousOntRepondu(titreEvenement(r.prochain, E).toLowerCase())}</p>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── « Ce soir » : le point avant un événement à venir ─── */
export function PointAvant({ e, joueurs, presences, evenements, E }: { e: Evenement; joueurs: Membre[]; presences: Presence[]; evenements: Evenement[]; E: E }) {
  const A = E.avant;
  const r = bilanReponses(e.id, joueurs, presences);
  const moment = momentEvenement(e);
  const titre = moment === "plusTard" ? A.titre.plusTard[e.type] : A.titre[moment];
  const temps = e.type === "match" ? minutesRecentes(joueurs, evenements, presences) : null;
  const max = temps?.lignes[0]?.minutes ?? 0;
  const groupes = ([["oui", r.oui], ["incertain", r.incertain], ["non", r.non], ["sans", r.sans]] as const).filter(([, l]) => l.length > 0);

  return (
    <section className="panel panel-hero point-avant" style={{ marginBottom: 16 }} aria-label={titre}>
      <div className="today-kicker">{titre}</div>
      <p className="point-clair">{A.enClair(r.oui.length, r.incertain.length, r.sans.length)}</p>

      {joueurs.length === 0 ? (
        <p className="meta" style={{ marginTop: 10 }}>{E.semaine.aucunJoueur}</p>
      ) : (
        <div className="point-groupes">
          {groupes.map(([k, l]) => (
            <div key={k} className={`point-groupe point-${k}`}>
              <div className="point-label"><span className="dot" />{A.groupe[k](l.length)}</div>
              <div className="point-noms">{noms(l)}</div>
            </div>
          ))}
        </div>
      )}

      {temps && joueurs.length > 0 && (
        <div className="point-temps">
          <div className="section-head" style={{ marginBottom: 4 }}>
            <h2 className="section-title">{A.minutesTitre}</h2>
            <span className="section-note">{A.minutesNote(temps.matchs)}</span>
          </div>
          {temps.lignes.length ? (
            <div className="rows">
              {temps.lignes.map((l) => (
                <div key={l.membre.id} className="row-item temps-ligne">
                  <div className="row-main">
                    <div className="row-title">{l.membre.numero !== null && <span className="num muted">{l.membre.numero} </span>}{l.membre.nom}</div>
                    <div className="temps-barre" aria-hidden="true"><span style={{ width: `${Math.max(6, Math.round((l.minutes / max) * 100))}%` }} /></div>
                  </div>
                  <div className="temps-valeur">
                    <span className="row-value">{l.minutes} {E.minutes}</span>
                    {temps.matchs > 1 && <span className="row-sub">· {A.nMatchs(l.matchs)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">{A.minutesVide}</p>
          )}
          <p className="meta point-aide">{A.minutesAide}</p>
        </div>
      )}
    </section>
  );
}
