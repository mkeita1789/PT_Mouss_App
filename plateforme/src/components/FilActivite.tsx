import Link from "next/link";
import type { Activite } from "@/lib/data";
import { locale, ui, type Lang } from "@/lib/i18n";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

/* « il y a 5 min », « hier »… */
function ilYa(iso: string, lang: Lang, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: "auto" });
  const min = Math.round((Date.parse(iso) - now) / 60000);
  if (min > -60) return rtf.format(Math.min(-1, min), "minute");
  const h = Math.round(min / 60);
  if (h > -24) return rtf.format(h, "hour");
  return rtf.format(Math.round(h / 24), "day");
}

/** Ce que font les clientes en ce moment : début, fin, séance libre */
export function FilActivite({ activites, lang }: { activites: Activite[]; lang: Lang }) {
  const N = ui(lang).notifs;
  return (
    <section className="section">
      <div className="section-head"><h2 className="section-title">{N.activite}</h2></div>
      {activites.length ? (
        <div className="panel menu-liste">
          {activites.map((a) => (
            <Link key={a.id} href={`/coach/${a.client.id}`} className="menu-item">
              <span style={{ position: "relative", flex: "none" }}>
                <Avatar url={a.client.avatar} nom={a.client.prenom || "?"} />
                <span className={`fil-badge fil-${a.type}`}><Icon nom={a.type === "debut" ? "play" : "check"} taille={10} /></span>
              </span>
              <span className="menu-txt">
                <span style={{ fontSize: 14.5 }}>
                  <b style={{ fontWeight: 600 }}>{a.client.prenom}</b> {a.type === "debut" ? N.aCommence : a.type === "fin" ? N.aTermine : N.aFaitLibre}
                </span>
                {a.detail && <span className="menu-sous">{a.detail}</span>}
              </span>
              <span className="meta" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{ilYa(a.cree_le, lang)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="meta">{N.activiteVide}</p>
      )}
    </section>
  );
}
