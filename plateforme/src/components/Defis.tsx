import type { AvancementDefi, Defi } from "@/lib/coaching/motivation";
import { nombre, tc, ui, type Lang } from "@/lib/i18n";
import { Icon } from "./Icon";

/** Carte d'un défi du coach, avec la jauge de la cliente */
export function CarteDefi({ defi, av, lang }: { defi: Defi; av: AvancementDefi; lang: Lang }) {
  const M = ui(lang).motiv;
  const unite = defi.type === "seances" ? M.seancesUnite : M.kgUnite;
  return (
    <section className="panel defi-carte" style={{ marginBottom: 14, borderColor: av.reussi ? "rgba(76,195,138,.35)" : "var(--gold-line)" }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <span className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon nom="drapeau" taille={15} /> {av.reussi ? M.defiReussi : M.defiEnCours}</span>
        <span className="meta" style={{ fontSize: 12.5 }}>{av.termine ? M.defiTermine : M.joursRestants(av.joursRestants)}</span>
      </div>
      <div className="row-title" style={{ fontSize: 17 }}>{defi.titre}</div>
      {defi.type === "charge" && defi.exercice && <div className="meta" style={{ fontSize: 13 }}>{tc(lang, defi.exercice)}</div>}
      <div className={`defi-barre${av.reussi ? " reussi" : ""}`} role="progressbar" aria-valuenow={av.pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${av.pct}%` }} /></div>
      <div className="meta"><b className="num" style={{ color: "var(--ink)", fontSize: 15 }}>{nombre(lang, av.valeur)}</b> / {nombre(lang, av.cible)} {unite}</div>
    </section>
  );
}
