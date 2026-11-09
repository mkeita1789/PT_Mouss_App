"use client";

import { useMemo, useState } from "react";
import { EXDB } from "@/lib/coaching/exdb";
import { EXDB_EN } from "@/lib/coaching/exdb-en";
import { tc } from "@/lib/i18n";
import { FicheSheet } from "./FicheExercice";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

/* Groupes musculaires dans l'ordre d'affichage des filtres */
const GROUPES = ["Fessiers", "Jambes", "Chaîne postérieure", "Dos", "Pectoraux", "Épaules", "Bras", "Tronc"];
const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Bibliothèque d'exercices : recherche, filtre par groupe, fiche détaillée */
export function Bibliotheque({ programme }: { programme: string[] }) {
  const { lang, T } = useLang();
  const X = T.exos;
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<string>(programme.length ? "prog" : "tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const dansProg = useMemo(() => new Set(programme), [programme]);

  const liste = useMemo(() => {
    const cle = sansAccent(q.trim());
    return Object.entries(EXDB)
      .filter(([nom, e]) => (filtre === "tous" ? true : filtre === "prog" ? dansProg.has(nom) : e.groupe.includes(filtre)))
      .filter(([nom, e]) => {
        if (!cle) return true;
        const en = EXDB_EN[nom];
        return [nom, tc(lang, nom), e.groupe, e.primaires, en?.primaires ?? ""].some((t) => sansAccent(t).includes(cle));
      })
      .sort(([a], [b]) => Number(dansProg.has(b)) - Number(dansProg.has(a)) || tc(lang, a).localeCompare(tc(lang, b)));
  }, [q, filtre, dansProg, lang]);

  const puces = [
    ...(programme.length ? [{ k: "prog", lb: X.monProgramme }] : []),
    { k: "tous", lb: X.tous },
    ...GROUPES.map((g) => ({ k: g, lb: X.groupes[g] ?? g })),
  ];

  return (
    <>
      <label className="recherche">
        <Icon nom="loupe" taille={18} className="muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={X.chercher} aria-label={X.chercher} />
      </label>
      <div className="puces" role="radiogroup" aria-label={X.titre}>
        {puces.map((p) => (
          <button key={p.k} type="button" role="radio" aria-checked={filtre === p.k} className={`puce${filtre === p.k ? " on" : ""}`} onClick={() => setFiltre(p.k)}>{p.lb}</button>
        ))}
      </div>

      {liste.length ? (
        <div className="panel menu-liste" style={{ marginTop: 14 }}>
          {liste.map(([nom, e]) => {
            const fiche = lang === "en" ? (EXDB_EN[nom] ?? e) : e;
            return (
              <button key={nom} type="button" className="menu-item" onClick={() => setOuvert(nom)}>
                <span className="menu-ico"><Icon nom={e.video ? "video" : "livre"} taille={20} /></span>
                <span className="menu-txt">
                  <span className="menu-titre">{tc(lang, nom)}{dansProg.has(nom) && <span className="dot-prog" title={X.dansProgramme} aria-label={X.dansProgramme} />}</span>
                  <span className="menu-sous">{fiche.groupe} · {fiche.primaires}</span>
                </span>
                <Icon nom="fleche" taille={18} className="muted" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="meta" style={{ marginTop: 18 }}>{X.aucun}</p>
      )}

      {ouvert && <FicheSheet nom={ouvert} onClose={() => setOuvert(null)} />}
    </>
  );
}
