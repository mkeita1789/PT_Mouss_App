import { traiterDemande } from "@/app/(app)/coach/actions";
import type { ChargeImposee, Demande } from "@/lib/data";
import { locale, tc, type Lang } from "@/lib/i18n";
import type { TextesUI } from "@/lib/i18n/ui";
import type { Metier } from "@/lib/profils";
import { FormDemande } from "./FormDemande";

type Auteurs = Record<string, { prenom: string; metier: Metier }>;

/** Charges fixées par les AUTRES professionnels : en lecture seule, avec une demande de changement */
export function ChargesAutres({ clientId, moiId, charges, auteurs, demandes, lang, T }: {
  clientId: string; moiId: string; charges: ChargeImposee[]; auteurs: Auteurs; demandes: Demande[]; lang: Lang; T: TextesUI;
}) {
  const P = T.plan;
  const M = T.metiers;
  const nom = (id: string) => auteurs[id]?.prenom || M.noms[auteurs[id]?.metier ?? "coach"];
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale(lang), { day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const fmt = (n: number) => String(n).replace(".", lang === "fr" ? "," : ".");
  const autres = [...new Set(charges.map((c) => c.auteur_id).filter((a): a is string => !!a && a !== moiId))];
  const recues = demandes.filter((d) => d.destinataire_id === moiId && !d.traitee_le);
  const envoyees = demandes.filter((d) => d.auteur_id === moiId).slice(0, 5);
  if (!autres.length && !recues.length && !envoyees.length) return null;

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      {recues.length > 0 && (
        <section className="panel" style={{ borderColor: "var(--gold-line)" }}>
          <div className="section-title">{P.demandesRecues}</div>
          <div className="rows" style={{ marginTop: 8 }}>
            {recues.map((d) => (
              <div key={d.id} className="row-item" style={{ alignItems: "flex-start" }}>
                <div className="row-main">
                  <div className="row-sub">{P.deLaPart(nom(d.auteur_id))} · {date(d.cree_le)}</div>
                  <div style={{ fontSize: 14.5, whiteSpace: "pre-wrap", marginTop: 4 }}>{d.message}</div>
                </div>
                <form action={traiterDemande.bind(null, d.id, clientId)}>
                  <button type="submit" className="btn btn-ghost btn-sm">{P.cEstFait}</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {autres.map((a) => {
        const siennes = charges.filter((c) => c.auteur_id === a);
        const exos = [...new Set(siennes.map((c) => `${c.exercice}|${c.jour_code ?? ""}`))];
        const lundis = [...new Set(siennes.map((c) => c.lundi))].sort();
        return (
          <section key={a} className="panel">
            <div className="section-title">{P.autresTitre(nom(a), M.noms[auteurs[a]?.metier ?? "prepa"])}</div>
            <p className="meta" style={{ margin: "4px 0 12px" }}>{P.lectureSeule}</p>
            <div style={{ overflowX: "auto", margin: "0 -6px" }}>
              <table className="tbl plan-tbl">
                <thead>
                  <tr>
                    <th>{P.semaine}</th>
                    {exos.map((k) => { const [ex, j] = k.split("|"); return <th key={k}>{tc(lang, ex)}{j ? ` · ${j}` : ""}</th>; })}
                  </tr>
                </thead>
                <tbody>
                  {lundis.map((l) => (
                    <tr key={l}>
                      <td style={{ whiteSpace: "nowrap" }}><b>{date(l + "T12:00:00Z")}</b></td>
                      {exos.map((k) => {
                        const [ex, j] = k.split("|");
                        const c = siennes.find((x) => x.lundi === l && x.exercice === ex && (x.jour_code ?? "") === j);
                        return <td key={k} className="num" style={{ color: "var(--ink)" }}>{c ? `${fmt(c.charge)} kg` : "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details style={{ marginTop: 14 }}>
              <summary className="link" style={{ cursor: "pointer", fontSize: 14 }}>{P.demander}</summary>
              <FormDemande clientId={clientId} destinataireId={a} />
            </details>
          </section>
        );
      })}

      {envoyees.length > 0 && (
        <section className="panel">
          <div className="section-title">{P.mesDemandes}</div>
          <div className="rows" style={{ marginTop: 6 }}>
            {envoyees.map((d) => (
              <div key={d.id} className="row-item" style={{ alignItems: "flex-start" }}>
                <div className="row-main">
                  <div className="row-sub">{nom(d.destinataire_id)} · {date(d.cree_le)}</div>
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap", marginTop: 4 }}>{d.message}</div>
                </div>
                <span className={`pill ${d.traitee_le ? "pill-ok" : "pill-neutre"}`} style={{ fontSize: 12, flex: "none" }}>{d.traitee_le ? P.traitee : P.enAttente}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
