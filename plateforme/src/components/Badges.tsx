import type { Badge } from "@/lib/coaching/motivation";
import { ui, type Lang } from "@/lib/i18n";

/** Grille des badges : obtenus en couleur, à débloquer en gris avec la progression */
export function Badges({ badges, lang }: { badges: Badge[]; lang: Lang }) {
  const M = ui(lang).motiv;
  return (
    <div className="badges">
      {badges.map((b) => {
        const [nom, desc] = M.badge[b.id];
        return (
          <div key={b.id} className={`badge ${b.obtenu ? "obtenu" : "verrou"}`} title={desc}>
            <span className="badge-emoji" aria-hidden>{b.emoji}</span>
            <b>{nom}</b>
            <span>{b.obtenu ? desc : `${b.progres}/${b.cible}`}</span>
          </div>
        );
      })}
    </div>
  );
}
