import { FormAuth } from "@/components/FormAuth";
import { suiteValide } from "@/lib/suite";
import { getInvitation } from "@/lib/data";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Inscription — Baara" };

export default async function Page({ searchParams }: PageProps<"/inscription">) {
  const { suite, code } = await searchParams;
  const T = ui(await getLang());
  /* Lien d'invitation d'un professionnel : /inscription?code=ABC234 */
  const brut = typeof code === "string" ? code.trim().toUpperCase() : "";
  const invitation = brut ? await getInvitation(brut) : null;
  return (
    <>
      <FormAuth
        mode="inscription"
        suite={suiteValide(suite) ?? undefined}
        invitation={invitation ? { code: brut, prenom: invitation.prenom, metier: invitation.metier } : undefined}
        codeInvalide={!!brut && !invitation}
      />
      <p className="meta" style={{ textAlign: "center", marginTop: 18, fontSize: 12.5 }}>
        {T.metiers.confidentialite}
      </p>
    </>
  );
}
