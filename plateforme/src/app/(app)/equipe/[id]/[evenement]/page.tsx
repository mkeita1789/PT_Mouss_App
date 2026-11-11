import Link from "next/link";
import { notFound } from "next/navigation";
import { dateEvenement, titreEvenement } from "@/components/CarteEvenement";
import { BoutonsReponse, FeuillePresence } from "@/components/Equipe";
import { Icon } from "@/components/Icon";
import { supprimerEvenement } from "../../actions";
import { getEquipe, getUtilisateur } from "@/lib/data";
import { bilanReponses, estAVenir, estStaff, type Membre } from "@/lib/equipe";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Événement — Baara" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps<"/equipe/[id]/[evenement]">) {
  const { id, evenement: eid } = await params;
  if (!UUID.test(id) || !UUID.test(eid)) notFound();
  const user = await getUtilisateur();
  const lang = await getLang();
  const E = ui(lang).equipe;
  const data = await getEquipe(id, user.id);
  const e = data?.evenements.find((x) => x.id === eid);
  if (!data || !e) notFound();
  const { moi, membres, presences } = data;
  const staff = estStaff(moi?.role);
  const joueurs = membres.filter((m) => m.role === "joueur");
  const avenir = estAVenir(e);
  const r = bilanReponses(e.id, joueurs, presences);
  const maReponse = moi ? presences.find((p) => p.evenement_id === e.id && p.membre_id === moi.id)?.reponse ?? null : null;
  const noms = (l: Membre[]) => l.map((m) => m.nom).join(", ");
  const score = e.type === "match" && e.score_pour !== null && e.score_contre !== null;

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
      </header>

      {avenir && moi && !staff && (
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

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="section-head"><h2 className="section-title">{E.qui}</h2><span className="section-note">{E.reponses(r.oui.length, r.non.length, r.incertain.length, r.sans.length)}</span></div>
        <div className="rows">
          {([["oui", r.oui], ["incertain", r.incertain], ["non", r.non]] as const).map(([k, l]) => l.length > 0 && (
            <div key={k} className="row-item" style={{ alignItems: "flex-start" }}>
              <span className={`pill pill-${k === "oui" ? "ok" : k === "non" ? "ko" : "gold"}`} style={{ fontSize: 12, flex: "none" }}>{E[k]}</span>
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
      </section>

      {staff && (
        <>
          <FeuillePresence equipeId={id} evenement={e} joueurs={joueurs} presences={presences.filter((p) => p.evenement_id === e.id)} />
          <form action={supprimerEvenement.bind(null, id, e.id)} style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ghost btn-sm"><Icon nom="poubelle" taille={16} /> {E.supprimer}</button>
          </form>
        </>
      )}
    </div>
  );
}
