import Link from "next/link";
import { deconnexion } from "@/app/(auth)/actions";
import { Icon } from "@/components/Icon";
import { getBilan, getUtilisateur } from "@/lib/data";
import { phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Profil — PT Mouss IA" };

const LIBELLES: Record<string, string> = {
  objectif: "Objectif", niveau: "Niveau", freq: "Séances par semaine", materiel: "Lieu d'entraînement",
  sante: "Vigilance santé", sommeil: "Sommeil", periode: "Période", allure: "Allure de footing",
};

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  const phase = bilan ? phaseFor(bilan.reponses, bilan.debut) : null;

  return (
    <div className="reveal">
      <header className="page-head">
        <div className="meta">{user.email}{user.role === "coach" ? " · Coach" : ""}</div>
        <h1 className="page-title" style={{ marginTop: 6 }}>{bilan?.reponses.prenom || user.prenom || "Mon profil"}</h1>
      </header>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="panel">
          <div className="section-head">
            <h2 className="section-title">Ton bilan</h2>
            <Link href="/bilan" className="link" style={{ fontSize: 13.5 }}>{bilan ? "Refaire" : "Commencer"}</Link>
          </div>
          {bilan ? (
            <div className="rows">
              {Object.entries(LIBELLES).map(([k, lb]) => {
                const v = (bilan.reponses as Record<string, string | undefined>)[k];
                return v ? (
                  <div key={k} className="row-item">
                    <div className="row-main meta">{lb}</div>
                    <div style={{ fontSize: 14, textAlign: "right" }}>{v}</div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="meta">Fais ton bilan pour générer ton programme.</p>
          )}
          {phase && (
            <p className="meta" style={{ marginTop: 12 }}>
              Cycle démarré le {new Date(bilan!.debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })} · semaine {phase.week} sur {phase.len}, {phase.n}
            </p>
          )}
        </section>

        <div className="stack">
          <div className="note note-ko">
            <span className="note-icon"><Icon nom="alerte" taille={17} /></span>
            <div><b>Douleur, pas courbature ?</b> Tu arrêtes et tu préviens Moustapha. Pour la nutrition et le moral, tu passes par lui aussi.</div>
          </div>
          <form action={deconnexion}>
            <button type="submit" className="btn btn-ghost btn-block"><Icon nom="sortie" taille={18} /> Se déconnecter</button>
          </form>
        </div>
      </div>
    </div>
  );
}
