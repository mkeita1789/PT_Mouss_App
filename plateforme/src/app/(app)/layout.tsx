import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TransfertEnAttente } from "@/components/Importeur";
import { SideNav, TabBar } from "@/components/TabBar";
import { deconnexion } from "@/app/(auth)/actions";
import { getUtilisateur } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

const initiale = (s: string) => (s.trim()[0] ?? "?").toUpperCase();

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUtilisateur();
  const coach = user.role === "coach";
  const T = ui(await getLang());

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="side-brand">
          <span className="monogram">JC</span>
          <span>
            <div className="wordmark">PT MOUSS <b>IA</b></div>
            <div className="wordmark-sub">JIGI Coaching</div>
          </span>
        </Link>
        <SideNav coach={coach} />
        <div className="side-foot">
          <span className="avatar">{initiale(user.prenom || user.email)}</span>
          <div className="who">
            <div>{user.prenom || user.email}</div>
            <span>{coach ? T.nav.coachRole : T.nav.clientRole}</span>
          </div>
          <form action={deconnexion}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ width: 38, padding: 0 }} aria-label={T.nav.deconnexion} title={T.nav.deconnexion}>
              <Icon nom="sortie" taille={18} />
            </button>
          </form>
        </div>
      </aside>

      <header className="topbar">
        <span className="monogram">JC</span>
        <div className="wordmark">PT MOUSS <b>IA</b></div>
        <Link href="/profil" className="topbar-user" aria-label={T.nav.monProfil}>
          <span className="avatar">{initiale(user.prenom || user.email)}</span>
        </Link>
      </header>

      <main className="main"><TransfertEnAttente />{children}</main>
      <TabBar coach={coach} />
    </div>
  );
}
