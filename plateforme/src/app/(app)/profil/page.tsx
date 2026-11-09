import Link from "next/link";
import { deconnexion } from "@/app/(auth)/actions";
import { Icon } from "@/components/Icon";
import { ChoixLangue } from "@/components/Langue";
import { ChoixTheme } from "@/components/ChoixTheme";
import { PhotoProfil } from "@/components/PhotoProfil";
import { Notifications } from "@/components/Notifications";
import { getTheme } from "@/lib/theme/serveur";
import { getBilan, getUtilisateur } from "@/lib/data";
import { phaseFor } from "@/lib/coaching/programme";
import { locale, tc, ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Profil — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  const lang = await getLang();
  const theme = await getTheme();
  const T = ui(lang);
  const phase = bilan ? phaseFor(bilan.reponses, bilan.debut) : null;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{user.email}{user.role === "coach" ? ` · ${T.nav.coachRole}` : ""}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{bilan?.reponses.prenom || user.prenom || T.profil.titre}</h1>
      </header>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="panel">
          <div className="section-head">
            <h2 className="section-title">{T.profil.tonBilan}</h2>
            <Link href="/bilan" className="link" style={{ fontSize: 13.5 }}>{bilan ? T.profil.refaire : T.profil.commencer}</Link>
          </div>
          {bilan ? (
            <div className="rows">
              {Object.entries(T.profil.libelles).map(([k, lb]) => {
                const v = (bilan.reponses as Record<string, string | undefined>)[k];
                return v ? (
                  <div key={k} className="row-item">
                    <div className="row-main meta">{lb}</div>
                    <div style={{ fontSize: 14, textAlign: "right" }}>{tc(lang, v)}</div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="meta">{T.profil.sansBilan}</p>
          )}
          {phase && (
            <p className="meta" style={{ marginTop: 12 }}>
              {T.profil.cycleDemarre(new Date(bilan!.debut).toLocaleDateString(locale(lang), { day: "numeric", month: "long", timeZone: "Europe/Paris" }), phase.week, phase.len, tc(lang, phase.n))}
            </p>
          )}
        </section>

        <div className="stack">
          <section className="panel">
            <div className="section-title">{T.avatar.titre}</div>
            <p className="meta" style={{ margin: "4px 0 14px" }}>{T.avatar.aide}</p>
            <PhotoProfil uid={user.id} nom={bilan?.reponses.prenom || user.prenom || user.email} url={user.avatar} />
          </section>
          {user.role === "client" && (
            <Link href="/photos" className="panel row-link">
              <span className="note-icon"><Icon nom="photo" taille={17} /></span>
              <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{T.photos.lien}</b><br /><span className="meta" style={{ fontSize: 13 }}>{T.photos.meta}</span></span>
              <Icon nom="fleche" taille={18} className="muted" />
            </Link>
          )}
          <section className="panel">
            <div className="section-title">{T.notifs.titre}</div>
            <Notifications coach={user.role === "coach"} />
          </section>
          <section className="panel">
            <div className="section-title">{T.theme.titre}</div>
            <p className="meta" style={{ margin: "4px 0 14px" }}>{T.theme.aide}</p>
            <ChoixTheme actuel={theme} />
          </section>
          <section className="panel">
            <div className="section-title">{T.langue}</div>
            <p className="meta" style={{ margin: "4px 0 14px" }}>{T.profil.langueAide}</p>
            <ChoixLangue />
          </section>
          <div className="note note-ko">
            <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
            <div><b>{T.profil.douleur[0]}</b>{T.profil.douleur[1]}</div>
          </div>
          <form action={deconnexion}>
            <button type="submit" className="btn btn-ghost btn-block"><Icon nom="sortie" taille={18} /> {T.nav.deconnexion}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
