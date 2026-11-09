"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type NomIcone } from "./Icon";

type Lien = { href: string; ico: NomIcone; lb: string };

const CLIENT: Lien[] = [
  { href: "/", ico: "accueil", lb: "Accueil" },
  { href: "/programme", ico: "programme", lb: "Programme" },
  { href: "/seance", ico: "seance", lb: "Séance" },
  { href: "/suivi", ico: "suivi", lb: "Progression" },
  { href: "/profil", ico: "profil", lb: "Profil" },
];
const COACH: Lien = { href: "/coach", ico: "coach", lb: "Coach" };

function useActif() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
}

/** Barre du bas (mobile) — la séance au centre, en évidence */
export function TabBar({ coach }: { coach: boolean }) {
  const actif = useActif();
  const tabs = coach ? [CLIENT[0], CLIENT[1], CLIENT[2], CLIENT[3], COACH] : CLIENT;
  return (
    <nav className="tabbar" aria-label="Navigation">
      {tabs.map((t) =>
        t.href === "/seance" ? (
          <Link key={t.href} href={t.href} className={`tab tab-center ${actif(t.href) ? "on" : ""}`} aria-current={actif(t.href) ? "page" : undefined}>
            <span className="tab-bubble"><Icon nom={t.ico} taille={24} /></span>
            <span>{t.lb}</span>
          </Link>
        ) : (
          <Link key={t.href} href={t.href} className={`tab ${actif(t.href) ? "on" : ""}`} aria-current={actif(t.href) ? "page" : undefined}>
            <Icon nom={t.ico} taille={22} />
            <span>{t.lb}</span>
          </Link>
        ),
      )}
    </nav>
  );
}

/** Menu latéral (ordinateur) */
export function SideNav({ coach }: { coach: boolean }) {
  const actif = useActif();
  const item = (t: Lien) => (
    <Link key={t.href} href={t.href} className={`nav-item ${actif(t.href) ? "on" : ""}`} aria-current={actif(t.href) ? "page" : undefined}>
      <Icon nom={t.ico} />
      {t.lb}
    </Link>
  );
  return (
    <>
      <nav className="side-nav" aria-label="Entraînement">{CLIENT.map(item)}</nav>
      {coach && (
        <nav className="side-nav" aria-label="Coach">
          <div className="side-label">Coaching</div>
          {item({ ...COACH, lb: "Mes clients" })}
        </nav>
      )}
    </>
  );
}
