import { Icon } from "@/components/Icon";
import { AncienHistoriqueNotice } from "@/components/Importeur";
import { ChoixLangue } from "@/components/Langue";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { Logo, Marque } from "@/components/Logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const T = ui(await getLang());
  const icones = ["programme", "suivi", "coach"] as const;
  return (
    <main className="auth">
      <aside className="auth-brand">
        <div className="side-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <Marque />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="auth-quote">{T.auth.citation[0]}<em>{T.auth.citation[1]}</em></p>
          <div className="auth-points" style={{ marginTop: 34 }}>
            {T.auth.points.map((p, i) => <div key={p}><Icon nom={icones[i]} /> {p}</div>)}
          </div>
        </div>
        <div className="meta" style={{ position: "relative", zIndex: 1 }}>{T.auth.specialites}</div>
      </aside>
      <div className="auth-form-wrap">
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
