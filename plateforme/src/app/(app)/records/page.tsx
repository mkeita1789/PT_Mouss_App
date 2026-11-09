import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getHistorique, getUtilisateur } from "@/lib/data";
import { records } from "@/lib/coaching/motivation";
import { locale, nombre, tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Mes records — Baara" };

export default async function Page() {
  const user = await getUtilisateur();
  const lang = await getLang();
  const T = ui(lang);
  const M = T.motiv;
  const recs = records(await getHistorique(user.id, 500)).sort((a, b) => b.kg - b.premier - (a.kg - a.premier) || b.date.localeCompare(a.date));

  return (
    <div className="reveal" style={{ maxWidth: 720 }}>
      <header className="page-head">
        <Link href="/suivi" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.nav.progression}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>🏆 {M.records}</h1>
        <p className="page-lede">{M.recordsLede}</p>
      </header>
      {recs.length ? (
        <div className="panel records-liste" style={{ padding: "6px 18px" }}>
          <div className="rows">
            {recs.map((r) => (
              <div key={r.nom} className="row-item">
                <div className="row-main">
                  <div className="row-title">{tc(lang, r.nom)}</div>
                  <div className="row-sub">
                    {new Date(r.date).toLocaleDateString(locale(lang), { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                    {r.kg > r.premier ? <> · <span className="ok">{M.depuisDebut(nombre(lang, r.kg - r.premier))}</span></> : null}
                    {r.nbRecords ? ` · ${M.battu(r.nbRecords)}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}><span className="record-kg">{nombre(lang, r.kg)}</span> <span className="meta">kg</span></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="meta">{M.aucunRecord}</p>
      )}
    </div>
  );
}
