import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SeanceLibre } from "@/components/SeanceLibre";
import { getUtilisateur } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Séance libre — Baara" };

export default async function Page() {
  await getUtilisateur();
  const T = ui(await getLang());
  return (
    <div className="reveal" style={{ maxWidth: 680 }}>
      <header className="page-head">
        <Link href="/entrainement" className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon nom="retour" taille={16} /> {T.nav.entrainement}
        </Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{T.libre.titre}</h1>
        <p className="page-lede">{T.libre.lede}</p>
      </header>
      <SeanceLibre />
    </div>
  );
}
