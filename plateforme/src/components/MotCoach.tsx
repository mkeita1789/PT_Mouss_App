import type { MotCoach } from "@/lib/data";
import { locale, type Lang } from "@/lib/i18n";
import { Avatar } from "./Avatar";

/** Carte « le mot du coach » en haut de l'accueil du client */
export function CarteMot({ mot, titre, lang }: { mot: MotCoach; titre: string; lang: Lang }) {
  const date = new Date(mot.cree_le).toLocaleDateString(locale(lang), { day: "numeric", month: "long", timeZone: "Europe/Paris" });
  return (
    <section className="panel mot-coach" aria-label={titre}>
      <Avatar url={mot.coach.avatar} nom={mot.coach.prenom || "C"} className="avatar-md" />
      <div style={{ minWidth: 0 }}>
        <div className="mot-head"><b>{titre}</b><span className="meta">{mot.coach.prenom} · {date}</span></div>
        <p className="mot-texte">{mot.texte}</p>
      </div>
    </section>
  );
}
