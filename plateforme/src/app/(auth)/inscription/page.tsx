import { FormAuth } from "@/components/FormAuth";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Inscription — Baara" };

export default async function Page({ searchParams }: PageProps<"/inscription">) {
  const { suite } = await searchParams;
  const T = ui(await getLang());
  return (
    <>
      <FormAuth mode="inscription" suite={suite === "/importer" ? suite : undefined} />
      <p className="meta" style={{ textAlign: "center", marginTop: 18, fontSize: 12.5 }}>
        {T.auth.confidentialite}
      </p>
    </>
  );
}
