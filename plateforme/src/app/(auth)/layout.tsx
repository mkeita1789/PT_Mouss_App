import { Icon } from "@/components/Icon";
import { AncienHistoriqueNotice } from "@/components/Importeur";
import { ChoixLangue } from "@/components/Langue";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { Logo, Marque } from "@/components/Logo";
import { Projecteurs, Terrain } from "@/components/VisuelsFoot";
import { getApp } from "@/lib/app-serveur";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const T = ui(await getLang());
  const foot = (await getApp()) === "foot";
  const icones = foot ? (["calendrier", "equipe", "seance"] as const) : (["programme", "suivi", "coach"] as const);
  const textes = foot ? T.foot : T.auth;
  return (
    <main className="auth">
      <aside className="auth-brand">
        {foot && <><Projecteurs className="auth-projecteurs" tribune={false} /><Terrain className="auth-terrain" /></>}
        <div className="side-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <Marque />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="auth-quote">{textes.citation[0]}<em>{textes.citation[1]}</em></p>
          <div className="auth-points" style={{ marginTop: 34 }}>
            {textes.points.map((p, i) => <div key={p}><Icon nom={icones[i]} /> {p}</div>)}
          </div>
        </div>
        <div className="meta" style={{ position: "relative", zIndex: 1 }}>{textes.specialites}</div>
      </aside>
      <div className="auth-form-wrap">
        {foot && <Projecteurs className="auth-projecteurs-mobile" tribune={false} />}
        <div className="auth-mobile-brand" style={{ justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo />
            <Marque />
          </span>
          <ChoixLangue compact />
        </div>
        <div className="auth-lang-desktop"><ChoixLangue compact /></div>
        <AncienHistoriqueNotice />
        {children}
      </div>
    </main>
  );
}
