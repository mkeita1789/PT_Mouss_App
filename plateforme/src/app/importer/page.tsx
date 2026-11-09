import { Importeur } from "@/components/Importeur";
import { getUtilisateurOuNull } from "@/lib/data";

export const metadata = { title: "Transfert — PT Mouss IA" };

export default async function Page() {
  const user = await getUtilisateurOuNull();
  return (
    <main className="auth-form-wrap" style={{ maxWidth: 620 }}>
      <div className="auth-mobile-brand" style={{ display: "flex" }}>
        <span className="monogram">JC</span>
        <span>
          <div className="wordmark">PT MOUSS <b>IA</b></div>
          <div className="wordmark-sub">JIGI Coaching</div>
        </span>
      </div>
      <Importeur connecte={!!user} />
    </main>
  );
}
