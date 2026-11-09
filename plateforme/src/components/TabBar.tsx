"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", ico: "🏠", lb: "Accueil" },
  { href: "/programme", ico: "🏋️", lb: "Programme" },
  { href: "/seance", ico: "🔥", lb: "Séance", center: true },
  { href: "/suivi", ico: "📈", lb: "Suivi" },
  { href: "/profil", ico: "👤", lb: "Profil" },
];

export function TabBar({ coach }: { coach: boolean }) {
  const path = usePathname();
  const tabs = coach ? [...TABS.slice(0, 4), { href: "/coach", ico: "🧭", lb: "Coach" }] : TABS;
  const actif = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {tabs.map((t) =>
        t.center ? (
          <Link key={t.href} href={t.href} className={`tab center ${actif(t.href) ? "on" : ""}`}>
            <span className="cbtn">{t.ico}</span>
            <span className="lb">{t.lb}</span>
          </Link>
        ) : (
          <Link key={t.href} href={t.href} className={`tab ${actif(t.href) ? "on" : ""}`}>
            <span className="ico">{t.ico}</span>
            <span className="lb">{t.lb}</span>
            <span className="dot" />
          </Link>
        ),
      )}
    </nav>
  );
}
