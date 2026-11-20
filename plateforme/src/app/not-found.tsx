import Link from "next/link";
import { Terrain } from "@/components/VisuelsFoot";
import { getApp } from "@/lib/app-serveur";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

/* Page introuvable, aux couleurs de l'appli (Baara ou Baara Foot) */
export default async function NotFound() {
  const [lang, app] = await Promise.all([getLang(), getApp()]);
  const T = ui(lang).introuvable;
  return (
    <main className="page-introuvable">
      {app === "foot" && <Terrain className="introuvable-terrain" />}
      <div className="num introuvable-code" aria-hidden>404</div>
      <h1 className="page-title" style={{ fontSize: 30 }}>{T.titre}</h1>
      <p className="page-lede" style={{ maxWidth: 420 }}>{T.texte}</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }}>{T.accueil}</Link>
    </main>
  );
}
