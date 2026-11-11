import Link from "next/link";
import { Icon } from "./Icon";
import { BoutonsReponse } from "./Equipe";
import { appelFait, bilanReponses, type Evenement, type Membre, type Presence } from "@/lib/equipe";
import { locale, type Lang } from "@/lib/i18n";
import type { TextesUI } from "@/lib/i18n/ui";

const ICONE = { entrainement: "seance", match: "ballon", rdv: "calendrier" } as const;

/** Titre lisible d'un événement : « Match contre AS Montreuil », « Entraînement », titre du rendez-vous */
export const titreEvenement = (e: Evenement, E: TextesUI["equipe"]) =>
  e.type === "match" ? `${E.types.match}${e.adversaire ? ` ${E.contre(e.adversaire)}` : ""}` : e.type === "rdv" ? e.titre || E.types.rdv : E.types.entrainement;

export const dateEvenement = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(locale(lang), { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Une ligne du calendrier : date, titre, lieu ; réponses ou présences ; boutons du joueur */
export function CarteEvenement({ e, equipeId, joueurs, presences, moi, staff, lang, E, passe }: {
  e: Evenement; equipeId: string; joueurs: Membre[]; presences: Presence[]; moi: Membre | null; staff: boolean; lang: Lang; E: TextesUI["equipe"]; passe: boolean;
}) {
  const d = new Date(e.debut);
  const jour = d.toLocaleDateString(locale(lang), { day: "numeric", timeZone: "Europe/Paris" });
  const mois = d.toLocaleDateString(locale(lang), { month: "short", timeZone: "Europe/Paris" }).replace(".", "");
  const heure = d.toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const s = d.toLocaleDateString(locale(lang), { weekday: "short", timeZone: "Europe/Paris" }).replace(".", "");
  const semaine = s.charAt(0).toUpperCase() + s.slice(1);
  const r = bilanReponses(e.id, joueurs, presences);
  const presents = presences.filter((p) => p.evenement_id === e.id && p.present).length;
  const fait = appelFait(presences, e.id);
  const maReponse = moi ? presences.find((p) => p.evenement_id === e.id && p.membre_id === moi.id)?.reponse ?? null : null;
  const score = e.type === "match" && e.score_pour !== null && e.score_contre !== null;
  const issue = score ? (e.score_pour! > e.score_contre! ? "ok" : e.score_pour! < e.score_contre! ? "ko" : "") : "";

  return (
    <article className={`evt evt-${e.type} ${passe ? "evt-passe" : ""}`}>
      <Link href={`/equipe/${equipeId}/${e.id}`} className="evt-lien">
        <div className="evt-date"><b className="num">{jour}</b><span>{mois}</span></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="evt-type"><Icon nom={ICONE[e.type]} taille={14} /> {E.types[e.type]}{e.type === "match" && e.domicile !== null ? ` · ${e.domicile ? E.domicile : E.exterieur}` : ""}</div>
          <div className="evt-titre maj1">{e.type === "match" ? (e.adversaire ? E.contre(e.adversaire) : E.types.match) : e.type === "rdv" ? e.titre || E.types.rdv : `${semaine} ${heure}`}</div>
          <div className="row-sub">{e.type === "entrainement" ? e.lieu ?? "" : [`${semaine} ${heure}`, e.lieu].filter(Boolean).join(" · ")}</div>
          {passe && e.resume && <p className="evt-resume">{e.resume}</p>}
        </div>
        {score ? (
          <div className={`evt-score num ${issue}`}>{e.score_pour}–{e.score_contre}</div>
        ) : (
          <Icon nom="fleche" taille={18} className="muted" />
        )}
      </Link>
      <div className="evt-pied">
        {passe ? (
          staff || fait ? <span className={`pill ${fait ? "" : "pill-gold"}`} style={{ fontSize: 12 }}>{fait ? E.presents(presents, joueurs.length) : E.appelAFaire}</span> : null
        ) : (
          <span className="meta" style={{ fontSize: 12.5 }}>{E.reponses(r.oui.length, r.non.length, r.incertain.length, r.sans.length)}</span>
        )}
        {!passe && moi && !staff && <BoutonsReponse equipeId={equipeId} evenementId={e.id} actuelle={maReponse} />}
      </div>
    </article>
  );
}
