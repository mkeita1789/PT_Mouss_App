import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { TransfertEnAttente } from "@/components/Importeur";
import { SideNav, TabBar } from "@/components/TabBar";
import { deconnexion } from "@/app/(auth)/actions";
import { getMesEquipes, getUtilisateur } from "@/lib/data";
import { getApp } from "@/lib/app-serveur";
import { paletteClub } from "@/lib/couleurs-club";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";
import { Logo, Marque } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUtilisateur();
  const coach = user.role === "coach";
  const T = ui(await getLang());
  const app = await getApp();
  /* Baara Foot : l'appli prend les couleurs du club (la première équipe ; la page d'une équipe prend les siennes) */
  const club = app === "foot" ? (await getMesEquipes(user.id))[0] : undefined;
  const palette = club ? paletteClub(club.couleur1, club.couleur2) : null;

  return (
    <div className="shell">
      {palette && <style>{palette}</style>}
      <aside className="sidebar">
        <Link href="/" className="side-brand">
          <Logo />
          <Marque />
        </Link>
        <SideNav coach={coach} metier={user.metier} />
        <div className="side-foot">
          <Avatar url={user.avatar} nom={user.prenom || user.email} />
          <div className="who">
            <div>{user.prenom || user.email}</div>
            <span>{T.metiers.noms[coach ? "coach" : user.metier]}</span>
          </div>
          <form action={deconnexion}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ width: 38, padding: 0 }} aria-label={T.nav.deconnexion} title={T.nav.deconnexion}>
              <Icon nom="sortie" taille={18} />
            </button>
          </form>
        </div>
      </aside>

      <header className="topbar">
        <Logo />
        <div className="wordmark">BAARA{app === "foot" && <span className="wordmark-foot">FOOT</span>}</div>
        <Link href="/profil" className="topbar-user" aria-label={T.nav.monProfil}>
          <Avatar url={user.avatar} nom={user.prenom || user.email} />
        </Link>
      </header>

      <main className="main"><TransfertEnAttente />{children}</main>
      <TabBar coach={coach} metier={user.metier} />
    </div>
  );
}
