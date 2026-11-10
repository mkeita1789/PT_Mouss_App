import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Inviter } from "@/components/Inviter";
import { rompre } from "../profil/liens";
import { exigerPro, getCodeInvitation, getMesSportifs } from "@/lib/data";
import { locale, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { estPro } from "@/lib/profils";

export const metadata = { title: "Espace professionnel — Baara" };

export default async function Page() {
  const user = await exigerPro();
  const metier = estPro(user.metier) ? user.metier : "coach";
  const lang = await getLang();
  const T = ui(lang);
  const M = T.metiers;
  const [sportifs, code] = await Promise.all([getMesSportifs(user.id), getCodeInvitation()]);
  const sante = metier === "kine" || metier === "osteo";
  const aVenir = sante ? M.aVenir.sante : M.aVenir[metier];
  const jour = (d: string) => new Date(d).toLocaleDateString(locale(lang), { day: "numeric", month: "long", timeZone: "Europe/Paris" });

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{M.espace} · {M.noms[metier]}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{M.titres[metier]}</h1>
        <p className="page-lede">{M.lede[metier]}</p>
      </header>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="stack" aria-label={M.titres[metier]}>
          {sportifs.length === 0 ? (
            <div className="panel">
              <div className="section-title">{M.aucunSportif}</div>
              <p className="meta" style={{ marginTop: 6 }}>{M.aucunSportifTexte}</p>
            </div>
          ) : (
            <>
              <div className="meta">{M.nPersonnes(sportifs.length)}</div>
              {sportifs.map((s) => (
                <div key={s.id} className="panel lie-row">
                  <Avatar url={null} nom={s.prenom || "?"} />
                  <div style={{ minWidth: 0 }}>
                    <div className="row-title" style={{ fontSize: 16 }}>{s.prenom || T.coach.sansPrenom}</div>
                    <div className="row-sub">{M.noms[s.metier]} · {M.depuis(jour(s.depuis))}</div>
                  </div>
                  <form action={rompre.bind(null, s.id, "pro")}>
                    <button type="submit" className="link" style={{ fontSize: 13, color: "var(--muted)" }}>{M.retirer}</button>
                  </form>
                </div>
              ))}
            </>
          )}
        </section>

        <div className="stack">
          <section className="panel">
            <div className="section-title">{M.tonCode}</div>
            {code ? (
              <>
                <div className="code-pro" aria-label={M.tonCode}>{code}</div>
                <p className="meta" style={{ margin: "10px 0 14px" }}>{M.codeAide}</p>
                <Inviter coach={user.prenom} code={code} generique />
              </>
            ) : (
              <p className="form-err" role="alert">{T.erreurs.generique}</p>
            )}
          </section>

          <section className="panel">
            <div className="section-head"><h2 className="section-title">{M.enPreparation}</h2></div>
            <p className="meta" style={{ marginBottom: 6 }}>{M.enPreparationAide}</p>
            <div className="rows">
              {aVenir.map(([titre, texte]) => (
                <div key={titre} className="row-item" style={{ alignItems: "flex-start" }}>
                  <span className="note-icon" style={{ marginTop: 2 }}><Icon nom="minuteur" taille={16} /></span>
                  <div className="row-main">
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{titre}</div>
                    <div className="row-sub">{texte}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {sante && (
            <div className="note note-gold">
              <span className="note-icon"><Icon nom="info" taille={17} /></span>
              <div>{M.santeNote}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
