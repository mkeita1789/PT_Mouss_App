"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useLang } from "@/components/Langue";

/** Erreur inattendue dans une page : message clair, réessayer ou revenir à l'accueil */
export default function Erreur({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { T } = useLang();
  const E = T.erreurPage;
  return (
    <div className="reveal" style={{ maxWidth: 560 }}>
      <header className="page-head">
        <h1 className="page-title">{E.titre}</h1>
        <p className="page-lede">{E.texte}</p>
      </header>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={() => retry()}><Icon nom="reset" taille={18} /> {E.reessayer}</button>
        <Link href="/" className="btn btn-ghost">{E.accueil}</Link>
      </div>
    </div>
  );
}
