import { supprimerDefi } from "@/app/(app)/coach/actions";
import type { SeanceFaite } from "@/lib/data";
import { EXDB } from "@/lib/coaching/exdb";
import { avancementDefi, type Defi } from "@/lib/coaching/motivation";
import { locale, nombre, tc, ui, type Lang } from "@/lib/i18n";
import { FormDefi } from "./FormDefi";

type ClientDefi = { id: string; prenom: string; hist: SeanceFaite[]; autres: string[] };

/** Espace coach : lancer un défi et suivre l'avancement de chaque cliente */
export function DefisCoach({ defis, clients, lang, limite }: { defis: Defi[]; clients: ClientDefi[]; lang: Lang; limite: string }) {
  const M = ui(lang).motiv;
  const date = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString(locale(lang), { day: "numeric", month: "short" });
  /* Défis en cours, et ceux finis depuis moins de 2 semaines */
  const visibles = defis.filter((d) => d.fin >= limite);
  const exercices = [...new Set([...clients.flatMap((c) => c.hist.flatMap((h) => h.seance_exercices.filter((e) => e.charge_kg !== null).map((e) => e.nom))), ...Object.keys(EXDB)])];

  return (
    <section className="section">
      <div className="section-head"><h2 className="section-title">{M.defis}</h2></div>
      <FormDefi clients={clients.map((c) => ({ id: c.id, prenom: c.prenom }))} exercices={exercices} />
      {visibles.length ? (
        <div className="stack" style={{ marginTop: 12 }}>
          {visibles.map((d) => {
            const concernees = clients.filter((c) => d.client_id === null || d.client_id === c.id);
            const unite = d.type === "seances" ? M.seancesUnite : M.kgUnite;
            return (
              <div key={d.id} className="panel">
                <div className="section-head" style={{ marginBottom: 4 }}>
                  <b style={{ fontSize: 15.5 }}>🎯 {d.titre}</b>
                  <form action={supprimerDefi.bind(null, d.id)}>
                    <button type="submit" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }}>{M.supprimer}</button>
                  </form>
                </div>
                <div className="meta" style={{ fontSize: 13 }}>
                  {d.type === "charge" && d.exercice ? `${tc(lang, d.exercice)} · ` : ""}{M.cible} {nombre(lang, d.cible)} {unite} · {date(d.debut)} → {date(d.fin)}
                </div>
                <div className="rows" style={{ marginTop: 10 }}>
                  {concernees.map((c) => {
                    const av = avancementDefi(d, c.hist, c.autres);
                    return (
                      <div key={c.id} className="row-item" style={{ display: "grid", gridTemplateColumns: "minmax(70px, 120px) 1fr auto", gap: 12, alignItems: "center", padding: "8px 0" }}>
                        <span style={{ fontSize: 14 }}>{c.prenom || "—"}</span>
                        <div className={`defi-barre${av.reussi ? " reussi" : ""}`}><span style={{ width: `${av.pct}%` }} /></div>
                        <span className="num meta" style={{ fontSize: 13 }}>{av.reussi ? "✅ " : ""}{nombre(lang, av.valeur)}/{nombre(lang, d.cible)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="meta" style={{ marginTop: 10, fontSize: 13.5 }}>{M.aucunDefi}</p>
      )}
    </section>
  );
}
