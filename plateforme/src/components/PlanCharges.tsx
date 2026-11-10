"use client";

import { useMemo, useState, useTransition } from "react";
import { enregistrerPlan, type CellulePlan } from "@/app/(app)/coach/actions";
import { tc } from "@/lib/i18n";
import { useLang } from "./Langue";

type Colonne = { exercice: string; jour_code: string | null };
type Initiale = { exercice: string; jour_code: string | null; lundi: string; charge: number };

const cle = (c: Colonne) => `${c.exercice}|${c.jour_code ?? ""}`;

/** Grille du coach : une ligne par semaine, une colonne par exercice (et jour du programme si besoin) */
export function PlanCharges(props: {
  clientId: string;
  semaines: { lundi: string; phase: string; courante: boolean }[];
  options: Colonne[];
  initiales: Initiale[];
}) {
  const { lang, T } = useLang();
  const P = T.plan;
  const fmt = (n: number) => String(n).replace(".", lang === "fr" ? "," : ".");
  const dateCourte = (l: string) => new Date(l + "T12:00:00Z").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  const [colonnes, setColonnes] = useState<Colonne[]>(() => {
    const vues = new Map<string, Colonne>();
    props.initiales.forEach((i) => vues.set(cle(i), { exercice: i.exercice, jour_code: i.jour_code }));
    /* Même ordre que le programme */
    const ordre = (c: Colonne) => { const k = props.options.findIndex((o) => cle(o) === cle(c)); return k < 0 ? 999 : k; };
    return [...vues.values()].sort((a, b) => ordre(a) - ordre(b));
  });
  const [valeurs, setValeurs] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.initiales.map((i) => [`${cle(i)}@${i.lundi}`, fmt(i.charge)])),
  );
  const [message, setMessage] = useState<{ ok?: string; erreur?: string }>({});
  const [pending, start] = useTransition();

  const libres = useMemo(() => props.options.filter((o) => !colonnes.some((c) => cle(c) === cle(o))), [props.options, colonnes]);
  const libelle = (c: Colonne) => `${tc(lang, c.exercice)} · ${c.jour_code ?? P.tousJours}`;

  const enregistrer = () => {
    setMessage({});
    const cellules: CellulePlan[] = [];
    colonnes.forEach((c) =>
      props.semaines.forEach((s) => {
        const v = valeurs[`${cle(c)}@${s.lundi}`]?.trim();
        if (!v) return;
        const n = parseFloat(v.replace(",", "."));
        cellules.push({ exercice: c.exercice, jour_code: c.jour_code, lundi: s.lundi, charge: Number.isFinite(n) ? n : null });
      }),
    );
    start(async () => setMessage(await enregistrerPlan(props.clientId, props.semaines.map((s) => s.lundi), cellules)));
  };

  return (
    <div className="panel">
      <p className="meta" style={{ marginBottom: 14 }}>{P.aide}</p>

      {colonnes.length === 0 ? (
        <p className="meta">{P.vide}</p>
      ) : (
        <div style={{ overflowX: "auto", margin: "0 -6px" }}>
          <table className="tbl plan-tbl">
            <thead>
              <tr>
                <th>{P.semaine}</th>
                {colonnes.map((c) => (
                  <th key={cle(c)}>
                    {libelle(c)}
                    <button type="button" className="link" style={{ display: "block", fontSize: 11.5, color: "var(--muted)", fontWeight: 400 }}
                      onClick={() => setColonnes((cs) => cs.filter((x) => cle(x) !== cle(c)))}>{P.retirer}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.semaines.map((s) => (
                <tr key={s.lundi} className={s.courante ? "plan-courante" : undefined}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <b>{dateCourte(s.lundi)}</b>
                    <div className="row-sub">{tc(lang, s.phase)}{s.courante ? ` · ${P.cetteSemaine}` : ""}</div>
                  </td>
                  {colonnes.map((c) => {
                    const k = `${cle(c)}@${s.lundi}`;
                    return (
                      <td key={k}>
                        <input className="kg plan-kg" inputMode="decimal" placeholder="—" aria-label={`${libelle(c)}, ${dateCourte(s.lundi)}`}
                          value={valeurs[k] ?? ""} onChange={(e) => setValeurs((v) => ({ ...v, [k]: e.target.value }))} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 16 }}>
        {libres.length > 0 && (
          <select className="input" style={{ width: "auto", height: 44, fontSize: 14 }} value="" aria-label={P.ajouterExo}
            onChange={(e) => { const o = libres.find((x) => cle(x) === e.target.value); if (o) setColonnes((cs) => [...cs, o]); }}>
            <option value="">+ {P.ajouterExo}</option>
            {libres.map((o) => <option key={cle(o)} value={cle(o)}>{libelle(o)}</option>)}
          </select>
        )}
        <button type="button" className="btn btn-primary" disabled={pending} onClick={enregistrer}>{pending ? P.enregistrement : P.enregistrer}</button>
        {message.ok && <span className="ok" style={{ fontSize: 14 }}>{message.ok}</span>}
        {message.erreur && <span className="form-err">{message.erreur}</span>}
      </div>
    </div>
  );
}
