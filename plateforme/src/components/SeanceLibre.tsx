"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { enregistrerSeanceLibre, type ExerciceLibre } from "@/app/(app)/actions";
import { EXDB } from "@/lib/coaching/exdb";
import { tc } from "@/lib/i18n";
import { FicheExercice } from "./FicheExercice";
import { CelebrationRecords } from "./Celebration";
import type { NouveauRecord } from "@/lib/coaching/motivation";
import { Icon } from "./Icon";
import { useLang } from "./Langue";

const CLE = "ptmouss.seanceLibre";
type Brouillon = { nom: string; exercices: ExerciceLibre[] };
const VIDE: Brouillon = { nom: "", exercices: [] };
const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Saisie d'une séance hors programme : exercices au choix, séries kg × reps */
export function SeanceLibre() {
  const { lang, T } = useLang();
  const L = T.libre;
  const router = useRouter();
  const [b, setB] = useState<Brouillon>(VIDE);
  const [choix, setChoix] = useState(false);
  const [q, setQ] = useState("");
  const [erreur, setErreur] = useState("");
  const [recordsBattus, setRecordsBattus] = useState<NouveauRecord[] | null>(null);
  const [pending, start] = useTransition();

  /* Brouillon gardé sur le téléphone : rien n'est perdu en changeant de page */
  useEffect(() => {
    try {
      const v = localStorage.getItem(CLE);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- état gardé dans le navigateur, absent au rendu serveur
      if (v) setB({ ...VIDE, ...JSON.parse(v) });
    } catch {}
  }, []);
  const maj = (n: Brouillon) => {
    setB(n);
    try { localStorage.setItem(CLE, JSON.stringify(n)); } catch {}
  };
  const majEx = (i: number, e: ExerciceLibre | null) =>
    maj({ ...b, exercices: e ? b.exercices.map((x, j) => (j === i ? e : x)) : b.exercices.filter((_, j) => j !== i) });

  const ajouter = (nom: string) => {
    const n = nom.trim();
    if (!n) return;
    maj({ ...b, exercices: [...b.exercices, { nom: n, series: [{ kg: "", reps: "" }] }] });
    setChoix(false);
    setQ("");
  };

  const liste = useMemo(() => {
    const cle = sansAccent(q.trim());
    return Object.keys(EXDB)
      .filter((n) => !cle || sansAccent(n).includes(cle) || sansAccent(tc(lang, n)).includes(cle) || sansAccent(EXDB[n].groupe).includes(cle))
      .sort((a, c) => tc(lang, a).localeCompare(tc(lang, c)));
  }, [q, lang]);

  const enregistrer = () => {
    setErreur("");
    start(async () => {
      const r = await enregistrerSeanceLibre(b);
      if (r.erreur) return setErreur(r.erreur);
      try { localStorage.removeItem(CLE); } catch {}
      if (r.records?.length) return setRecordsBattus(r.records);
      router.push("/suivi#historique");
    });
  };

  return (
    <>
      {recordsBattus && <CelebrationRecords records={recordsBattus} onFin={() => router.push("/suivi#historique")} />}
      <label className="field">
        <span>{L.nom}</span>
        <input className="input" value={b.nom} maxLength={80} placeholder={L.nomPlaceholder} onChange={(e) => maj({ ...b, nom: e.target.value })} />
      </label>

      <div className="stack" style={{ marginTop: 18 }}>
        {b.exercices.map((ex, i) => (
          <section key={i} className="panel ex-card">
            <div className="section-head" style={{ marginBottom: 10 }}>
              {EXDB[ex.nom] ? <FicheExercice nom={ex.nom} /> : <span className="ex-name">{ex.nom}</span>}
              <button type="button" className="link" style={{ fontSize: 12.5, color: "var(--muted)" }} onClick={() => majEx(i, null)}>{L.retirer}</button>
            </div>
            <div className="libre-series">
              {ex.series.map((s, k) => (
                <div key={k} className="libre-serie">
                  <span className="meta num">{L.serie} {k + 1}</span>
                  <label className="libre-champ">
                    <input className="input num" inputMode="decimal" value={s.kg} placeholder="—" aria-label={`${L.serie} ${k + 1} ${L.kg}`}
                      onChange={(e) => majEx(i, { ...ex, series: ex.series.map((x, j) => (j === k ? { ...x, kg: e.target.value } : x)) })} />
                    <span>{L.kg}</span>
                  </label>
                  <span className="muted">×</span>
                  <label className="libre-champ">
                    <input className="input num" inputMode="numeric" value={s.reps} placeholder="—" aria-label={`${L.serie} ${k + 1} ${L.reps}`}
                      onChange={(e) => majEx(i, { ...ex, series: ex.series.map((x, j) => (j === k ? { ...x, reps: e.target.value } : x)) })} />
                    <span>{L.reps}</span>
                  </label>
                  {ex.series.length > 1 && (
                    <button type="button" className="libre-suppr" aria-label={`${L.retirer} ${L.serie} ${k + 1}`} onClick={() => majEx(i, { ...ex, series: ex.series.filter((_, j) => j !== k) })}>
                      <Icon nom="moins" taille={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} disabled={ex.series.length >= 20}
              onClick={() => majEx(i, { ...ex, series: [...ex.series, { ...(ex.series[ex.series.length - 1] ?? { kg: "", reps: "" }) }] })}>
              {L.ajouterSerie}
            </button>
          </section>
        ))}
        {!b.exercices.length && <p className="meta">{L.vide}</p>}
      </div>

      {choix ? (
        <section className="panel section">
          <div className="section-head" style={{ marginBottom: 10 }}>
            <span className="section-title" style={{ fontSize: 15 }}>{L.choisir}</span>
            <button type="button" className="sheet-close" style={{ position: "static", float: "none" }} aria-label="✕" onClick={() => setChoix(false)}><Icon nom="plus" taille={16} /></button>
          </div>
          <label className="recherche">
            <Icon nom="loupe" taille={18} className="muted" />
            <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.exos.chercher} aria-label={T.exos.chercher}
              onKeyDown={(e) => { if (e.key === "Enter" && q.trim() && !liste.length) ajouter(q); }} />
          </label>
          <div className="libre-choix">
            {liste.map((n) => (
              <button key={n} type="button" className="menu-item" onClick={() => ajouter(n)}>
                <span className="menu-txt"><span className="menu-titre">{tc(lang, n)}</span><span className="menu-sous">{EXDB[n].groupe}</span></span>
                <Icon nom="plus" taille={18} className="gold" />
              </button>
            ))}
          </div>
          <div className="meta" style={{ margin: "14px 0 6px" }}>{L.autre}</div>
          <form className="libre-autre" onSubmit={(e) => { e.preventDefault(); ajouter(q); }}>
            <input className="input" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={L.autrePlaceholder} />
            <button type="submit" className="btn btn-ghost" disabled={!q.trim()}>{L.ajouter}</button>
          </form>
        </section>
      ) : (
        <button type="button" className="btn btn-ghost btn-block section" disabled={b.exercices.length >= 20} onClick={() => setChoix(true)}>
          <Icon nom="plus" taille={18} /> {L.ajouterExo}
        </button>
      )}

      {b.exercices.length > 0 && (
        <div className="section">
          {erreur && <p className="form-err" style={{ marginBottom: 10 }}>{erreur}</p>}
          <button type="button" className="btn btn-primary btn-block" disabled={pending} onClick={enregistrer}>
            <Icon nom="check" taille={18} /> {pending ? L.enregistrement : L.enregistrer}
          </button>
          <p className="meta" style={{ marginTop: 10, fontSize: 12.5, textAlign: "center" }}>{L.brouillon}</p>
        </div>
      )}
    </>
  );
}
