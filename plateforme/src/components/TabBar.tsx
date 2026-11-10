"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type NomIcone } from "./Icon";
import { useLang } from "./Langue";
import type { TextesUI } from "@/lib/i18n/ui";
import { estPro, ongletsDe, type CleNav, type Metier } from "@/lib/profils";

type Lien = { href: string; ico: NomIcone; lb: string };

/** Tous les onglets possibles ; chaque métier en affiche une sélection (src/lib/profils.ts) */
const onglet = (T: TextesUI, metier: Metier): Record<CleNav, Lien> => ({
  accueil: { href: "/", ico: "accueil", lb: T.nav.accueil },
  entrainement: { href: "/entrainement", ico: "outils", lb: T.nav.entrainement },
  seance: { href: "/seance", ico: "seance", lb: T.nav.seance },
  suivi: { href: "/suivi", ico: "suivi", lb: T.nav.progression },
  profil: { href: "/profil", ico: "profil", lb: T.nav.profil },
  coach: { href: "/coach", ico: "coach", lb: T.nav.coach },
  pro: { href: "/pro", ico: "coach", lb: estPro(metier) ? T.metiers.nav[metier] : T.nav.coach },
  exercices: { href: "/exercices", ico: "livre", lb: T.nav.exercices },
});

const liens = (T: TextesUI) => ({
  CLIENT: [
    { href: "/", ico: "accueil", lb: T.nav.accueil },
    { href: "/entrainement", ico: "outils", lb: T.nav.entrainement },
    { href: "/seance", ico: "seance", lb: T.nav.seance },
    { href: "/suivi", ico: "suivi", lb: T.nav.progression },
    { href: "/profil", ico: "profil", lb: T.nav.profil },
  ] as Lien[],
  COACH: { href: "/coach", ico: "coach", lb: T.nav.coach } as Lien,
  /* Ordinateur : accès direct, en plus du menu Entraînement */
  OUTILS: [
    { href: "/programme", ico: "programme", lb: T.nav.programme },
    { href: "/exercices", ico: "livre", lb: T.nav.exercices },
    { href: "/chrono", ico: "chrono", lb: T.nav.chrono },
  ] as Lien[],
});

/* Le menu Entraînement reste allumé sur les pages qu'il regroupe */
const SOUS_ENTRAINEMENT = ["/programme", "/exercices", "/chrono"];

function useActif() {
  const path = usePathname();
  const dans = (href: string) => path === href || path.startsWith(href + "/");
  return (href: string, menu = true) =>
    href === "/" ? path === "/" : dans(href) || (menu && href === "/entrainement" && SOUS_ENTRAINEMENT.some(dans));
}

/** Barre du bas (mobile) — la séance au centre, en évidence */
export function TabBar({ coach, metier }: { coach: boolean; metier: Metier }) {
  const actif = useActif();
  const { T } = useLang();
  const tous = onglet(T, metier);
  const tabs = ongletsDe(metier, coach).map((k) => tous[k]);
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
export function SideNav({ coach, metier }: { coach: boolean; metier: Metier }) {
  const actif = useActif();
  const { T } = useLang();
  const { COACH, OUTILS } = liens(T);
  const tous = onglet(T, metier);
  const pro = !coach && estPro(metier);
  const CLIENT = ongletsDe(metier, coach).filter((k) => k !== "coach" && k !== "pro" && k !== "exercices").map((k) => tous[k]);
  const item = (t: Lien) => (
    <Link key={t.href} href={t.href} className={`nav-item ${actif(t.href, false) ? "on" : ""}`} aria-current={actif(t.href, false) ? "page" : undefined}>
      <Icon nom={t.ico} />
      {t.lb}
    </Link>
  );
  return (
    <>
      <nav className="side-nav" aria-label={T.nav.programme}>{CLIENT.map(item)}</nav>
      <nav className="side-nav" aria-label={T.nav.outils}>
        <div className="side-label">{T.nav.outils}</div>
        {OUTILS.map(item)}
      </nav>
      {coach && (
        <nav className="side-nav" aria-label={T.nav.coach}>
          <div className="side-label">{T.nav.coaching}</div>
          {item({ ...COACH, lb: T.nav.mesClients })}
        </nav>
      )}
      {pro && (
        <nav className="side-nav" aria-label={T.metiers.espace}>
          <div className="side-label">{T.metiers.espace}</div>
          {item({ ...tous.pro, lb: T.metiers.titres[metier] })}
        </nav>
      )}
    </>
  );
}
