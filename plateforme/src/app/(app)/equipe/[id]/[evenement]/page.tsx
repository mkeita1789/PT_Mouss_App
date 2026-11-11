import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Convocation, FeuilleMatch, PartagerWhatsApp } from "@/components/ClubFoot";
import { dateEvenement, titreEvenement } from "@/components/CarteEvenement";
import { BoutonsReponse, FeuillePresence } from "@/components/Equipe";
import { PointAvant } from "@/components/EquipeStaff";
import { Icon } from "@/components/Icon";
import { supprimerEvenement } from "../../actions";
import { getComposition, getEquipe, getFaits, getUtilisateur } from "@/lib/data";
import { Composition } from "@/components/Composition";
import { bilanReponses, estAVenir, estCommence, estConvoque, estStaff, tempsDeJeu, type Membre } from "@/lib/equipe";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Événement — Baara" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/equipe/[id]/[evenement]">) {
  const { id, evenement: eid } = await params;
  if (!UUID.test(id) || !UUID.test(eid)) notFound();
  const user = await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const E = T.equipe;
  const C = T.club;
  const data = await getEquipe(id, user.id);
  const e = data?.evenements.find((x) => x.id === eid);
  if (!data || !e) notFound();
  const { moi, membres, presences, evenements, photos, equipe } = data;
  /* Les parents ne voient que le calendrier */
  if (moi?.role === "parent") redirect(`/equipe/${id}`);
  const staff = estStaff(moi?.role);
  const effectif = membres.filter((m) => m.role === "joueur");
  /* Seuls les convoqués comptent pour les réponses et la composition */
  const joueurs = effectif.filter((m) => estConvoque(e, m.id));
  const convoque = !moi || estConvoque(e, moi.id);
  const avenir = estAVenir(e);
  const r = bilanReponses(e.id, joueurs, presences);
  const maReponse = moi ? presences.find((p) => p.evenement_id === e.id && p.membre_id === moi.id)?.reponse ?? null : null;
  const noms = (l: Membre[]) => l.map((m) => m.nom).join(", ");
  const score = e.type === "match" && e.score_pour !== null && e.score_contre !== null;
  /* Composition du match : sinon, pour le staff, on part de la composition type (en brouillon) */
  const compoMatch = e.type === "match" ? await getComposition(id, e.id) : null;
  const compoType = e.type === "match" && staff && !compoMatch ? await getComposition(id, null) : null;
  const compo = compoMatch ?? (compoType ? { ...compoType, publiee: false } : null);
  /* Feuille de match : une fois le match commencé */
  const feuille = e.type === "match" && estCommence(e);
  const faits = feuille ? (await getFaits(id)).filter((f) => f.evenement_id === e.id) : [];
  const duree = e.duree ?? 90;
  const minutes = feuille && compoMatch ? tempsDeJeu(Object.values(compoMatch.titulaires), faits, duree) : {};
  const quandTxt = dateEvenement(e.debut, lang);
  const texteWA = C.texteWhatsApp(titreEvenement(e, E), quandTxt, e.lieu ?? "", e.convoques ? joueurs.map((m) => m.nom).join(", ") : "");

  return (
    <div className="reveal" style={{ maxWidth: 820 }}>
      <header className="page-head">
        <Link href={`/equipe/${id}`} className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {E.retour}
        </Link>
        <div className="meta" style={{ marginTop: 12 }}>{E.types[e.type]}{e.type === "match" && e.domicile !== null ? ` · ${e.domicile ? E.domicile : E.exterieur}` : ""}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{titreEvenement(e, E)}</h1>
        <p className="page-lede maj1">{dateEvenement(e.debut, lang)}{e.lieu ? ` · ${e.lieu}` : ""}</p>
        {score && <div className="evt-score-grand num">{e.score_pour} – {e.score_contre}</div>}
        {staff && <div style={{ marginTop: 12 }}><PartagerWhatsApp texte={texteWA} /></div>}
      </header>

      {staff && avenir && e.type === "match" && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-head"><h2 className="section-title">{C.convocation}</h2><span className="section-note">{e.convoques ? C.nConvoques(e.convoques.length) : C.toutLeMonde}</span></div>
          <Convocation equipeId={id} evenementId={e.id} joueurs={effectif.map((m) => ({ id: m.id, nom: m.nom, numero: m.numero }))} convoques={e.convoques ?? null}
            partage={{ titre: titreEvenement(e, E), quand: quandTxt, lieu: e.lieu ?? "" }} />
        </section>
      )}
      {avenir && moi && !staff && !convoque && <p className="note" style={{ marginBottom: 16 }}>{C.pasConvoque}</p>}

      {avenir && moi && !staff && convoque && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>{E.tuViens}</div>
          <BoutonsReponse equipeId={id} evenementId={e.id} actuelle={maReponse} />
        </section>
      )}

      {e.resume && !staff && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-title">{e.type === "match" ? E.resumeMatch : E.resume}</div>
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{e.resume}</p>
        </section>
      )}

      {staff && avenir && <PointAvant e={e} joueurs={joueurs} presences={presences} evenements={evenements} E={E} />}

      {!(staff && avenir) && <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-head"><h2 className="section-title">{avenir ? E.qui : E.quiPasse}</h2><span className="section-note">{E.reponses(r.oui.length, r.non.length, r.incertain.length, r.sans.length)}</span></div>
        <div className="rows">
          {([["oui", r.oui], ["incertain", r.incertain], ["non", r.non]] as const).map(([k, l]) => l.length > 0 && (
            <div key={k} className="row-item" style={{ alignItems: "flex-start" }}>
              <span className={`pill pill-${k === "oui" ? "ok" : k === "non" ? "ko" : "neutre"}`} style={{ fontSize: 12, flex: "none" }}>{E[k]}</span>
              <div className="row-main" style={{ fontSize: 14.5 }}>{noms(l)}</div>
            </div>
          ))}
          {r.sans.length > 0 && (
            <div className="row-item" style={{ alignItems: "flex-start" }}>
              <span className="pill" style={{ fontSize: 12, flex: "none" }}>{E.sansReponse}</span>
              <div className="row-main meta" style={{ fontSize: 14.5 }}>{noms(r.sans)}</div>
            </div>
          )}
        </div>
      </section>}

      {e.type === "match" && (staff || compo?.publiee) && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-head"><h2 className="section-title">{E.composition}</h2></div>
          <Composition equipeId={id} evenementId={e.id} editable={staff} initial={compo} couleur1={equipe.couleur1} couleur2={equipe.couleur2}
            joueurs={joueurs.map((m) => ({ id: m.id, nom: m.nom, numero: m.numero, poste: m.poste, photo: photos[m.id] ?? null, reponse: presences.find((p) => p.evenement_id === e.id && p.membre_id === m.id)?.reponse ?? null }))} />
        </section>
      )}
      {e.type === "match" && !staff && !compo?.publiee && <p className="meta" style={{ marginBottom: 16 }}>{E.pasDeCompo}</p>}

      {feuille && (staff || faits.length > 0) && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="section-head"><h2 className="section-title">{C.feuilleMatch}</h2><span className="section-note">{C.saisieStaff}</span></div>
          <FeuilleMatch equipeId={id} evenementId={e.id} faits={faits} editable={staff} minutes={minutes} duree={duree}
            joueurs={effectif.map((m) => ({ id: m.id, nom: m.nom, numero: m.numero }))} />
        </section>
      )}

      {staff && (
        <>
          {estCommence(e) && <FeuillePresence equipeId={id} evenement={e} joueurs={joueurs} presences={presences.filter((p) => p.evenement_id === e.id)} />}
          <form action={supprimerEvenement.bind(null, id, e.id)} style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ghost btn-sm"><Icon nom="poubelle" taille={16} /> {E.supprimer}</button>
          </form>
        </>
      )}
    </div>
  );
}
