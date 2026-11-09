import Link from "next/link";
import { TabBar } from "@/components/TabBar";
import { getUtilisateur } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUtilisateur();

  return (
    <>
      <header className="top">
        <div className="jc">JC</div>
        <div>
          <div className="brand">
            PT MOUSS <span>IA</span>
          </div>
          <div className="brand-sub">JIGI Coaching</div>
        </div>
        <div className="top-right">
          <Link href="/seance">
            <div className="n">🔥 Séance</div>
            <div className="s">{user.role === "coach" ? "Espace coach" : user.prenom || "Tracker"}</div>
          </Link>
        </div>
      </header>
      <main className="screen">{children}</main>
      <TabBar coach={user.role === "coach"} />
    </>
  );
}
