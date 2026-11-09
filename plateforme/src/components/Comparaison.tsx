/* eslint-disable @next/next/no-img-element -- liens signés privés et temporaires */
import type { PhotoProgression } from "@/lib/data";
import { locale, type Lang, type TextesUIPhotos } from "@/lib/i18n";

const fmt = (d: string, lang: Lang) => new Date(d + "T12:00:00").toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric" });

/** Avant / après : pour chaque vue, la première photo face à la plus récente */
export function Comparaison({ photos, lang, P }: { photos: PhotoProgression[]; lang: Lang; P: TextesUIPhotos }) {
  const paires = (["face", "profil", "dos"] as const)
    .map((vue) => {
      const l = photos.filter((p) => p.vue === vue && p.url);
      return l.length > 1 ? { vue, avant: l[l.length - 1], apres: l[0] } : null;
    })
    .filter((x) => x !== null);
  if (!paires.length) return null;

  return (
    <div className="stack">
      {paires.map(({ vue, avant, apres }) => {
        const jours = Math.round((Date.parse(apres.prise_le) - Date.parse(avant.prise_le)) / 864e5);
        return (
          <div key={vue} className="panel compare">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="section-title" style={{ fontSize: 15 }}>{P.vues[vue]}</span>
              <span className="meta">{P.ecart(jours)}</span>
            </div>
            <div className="compare-pair">
              {[{ p: avant, lb: P.avant }, { p: apres, lb: P.apres }].map(({ p, lb }) => (
                <a key={p.id} href={p.url!} target="_blank" rel="noreferrer" className="compare-shot">
                  <img src={p.url!} alt={`${P.vues[vue]} — ${lb}`} loading="lazy" />
                  <span className="compare-label"><b>{lb}</b> {fmt(p.prise_le, lang)}</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Grille de toutes les photos, groupées par date */
export function GrillePhotos({ photos, lang, P, action }: { photos: PhotoProgression[]; lang: Lang; P: TextesUIPhotos; action?: (p: PhotoProgression) => React.ReactNode }) {
  const parDate = photos.reduce<Record<string, PhotoProgression[]>>((acc, p) => ((acc[p.prise_le] ||= []).push(p), acc), {});
  return (
    <div className="stack">
      {Object.entries(parDate).map(([date, liste]) => (
        <div key={date}>
          <div className="meta" style={{ margin: "4px 0 8px" }}>{fmt(date, lang)}</div>
          <div className="photo-grid">
            {liste.map((p) => (
              <figure key={p.id} className="photo-cell">
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={P.vues[p.vue]} loading="lazy" /></a> : <div className="photo-vide" />}
                <figcaption><span>{P.vues[p.vue]}</span>{action?.(p)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
