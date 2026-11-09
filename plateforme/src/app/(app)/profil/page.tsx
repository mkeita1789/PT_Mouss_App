import Link from "next/link";
import { deconnexion } from "@/app/(auth)/actions";
import { getBilan, getUtilisateur } from "@/lib/data";
import { phaseFor } from "@/lib/coaching/programme";

export const metadata = { title: "Profil — PT Mouss IA" };

const LIBELLES: Record<string, string> = {
  objectif: "Objectif", niveau: "Niveau", freq: "Séances / semaine", materiel: "Lieu",
  sante: "Vigilance santé", sommeil: "Sommeil", periode: "Période", allure: "Allure footing",
};

export default async function Page() {
  const user = await getUtilisateur();
  const bilan = await getBilan(user.id);
  const phase = bilan ? phaseFor(bilan.reponses, bilan.debut) : null;

  return (
    <>
      <div className="h1">
        <em>{bilan?.reponses.prenom || user.prenom || "Profil"}</em>
      </div>
      <div className="sub">{user.email}{user.role === "coach" ? " · Coach" : ""}</div>

      {bilan ? (
        <div className="card gold anim-item">
          <div className="eyebrow" style={{ marginTop: 0 }}>Ton bilan</div>
          {Object.entries(LIBELLES).map(([k, lb]) => {
            const v = (bilan.reponses as Record<string, string | undefined>)[k];
            return v ? (
              <div key={k} className="exline">
                <div style={{ flex: 1, color: "var(--muted)", fontSize: 12.5 }}>{lb}</div>
                <div style={{ fontSize: 13, textAlign: "right" }}>{v}</div>
              </div>
            ) : null;
          })}
          {phase && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
              Cycle démarré le {new Date(bilan.debut).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} · {phase.label} — {phase.n}
            </div>
          )}
        </div>
      ) : (
        <div className="card">Pas encore de bilan.</div>
      )}

      <Link href="/bilan" className="btn s anim-item" style={{ textAlign: "center", marginBottom: 10 }}>
        {bilan ? "Refaire mon bilan" : "Faire mon bilan"}
      </Link>
      <form action={deconnexion}>
        <button type="submit" className="btn s">Se déconnecter</button>
      </form>

      <div className="card alert ko" style={{ marginTop: 18, fontSize: 12.5 }}>
        <b>Douleur</b> (pas courbature) → tu arrêtes et tu préviens Moustapha. Pour la nutrition et le moral, tu passes par lui.
      </div>
    </>
  );
}
