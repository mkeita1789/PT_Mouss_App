import { Importeur } from "@/components/Importeur";
import { getUtilisateurOuNull } from "@/lib/data";
import { Logo, Marque } from "@/components/Logo";

export const metadata = { title: "Transfert — Baara" };

export default async function Page() {
  const user = await getUtilisateurOuNull();
  return (
    <main className="auth-form-wrap" style={{ maxWidth: 620 }}>
      <div className="auth-mobile-brand" style={{ display: "flex" }}>
        <Logo />
        <Marque />
      </div>
      <Importeur connecte={!!user} />
    </main>
  );
}
