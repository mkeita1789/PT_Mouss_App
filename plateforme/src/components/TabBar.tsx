"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type NomIcone } from "./Icon";
import { useLang } from "./Langue";
import type { TextesUI } from "@/lib/i18n/ui";

type Lien = { href: string; ico: NomIcone; lb: string };

const liens = (T: TextesUI) => ({
  CLIENT: [
    { href: "/", ico: "accueil", lb: T.nav.accueil },
    { href: "/programme", ico: "programme", lb: T.nav.programme },
    { href: "/seance", ico: "seance", lb: T.nav.seance },
    { href: "/suivi", ico: "suivi", lb: T.nav.progression },
    { href: "/profil", ico: "profil", lb: T.nav.profil },
  ] as Lien[],
  COACH: { href: "/coach", ico: "coach", lb: T.nav.coach } as Lien,
});

function useActif() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
}

/** Barre du bas (mobile) — la séance au centre, en évidence */
export function TabBar({ coach }: { coach: boolean }) {
  const actif = useActif();
  const { T } = useLang();
  const { CLIENT, COACH } = liens(T);
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
  const { T } = useLang();
  const { CLIENT, COACH } = liens(T);
  const item = (t: Lien) => (
    <Link key={t.href} href={t.href} className={`nav-item ${actif(t.href) ? "on" : ""}`} aria-current={actif(t.href) ? "page" : undefined}>
      <Icon nom={t.ico} />
      {t.lb}
    </Link>
  );
  return (
    <>
      <nav className="side-nav" aria-label={T.nav.programme}>{CLIENT.map(item)}</nav>
      {coach && (
        <nav className="side-nav" aria-label={T.nav.coach}>
          <div className="side-label">{T.nav.coaching}</div>
          {item({ ...COACH, lb: T.nav.mesClients })}
        </nav>
      )}
    </>
  );
}
