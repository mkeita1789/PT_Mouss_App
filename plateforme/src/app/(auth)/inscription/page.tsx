import { FormAuth } from "@/components/FormAuth";

export const metadata = { title: "Inscription — PT Mouss IA" };

export default async function Page({ searchParams }: PageProps<"/inscription">) {
  const { suite } = await searchParams;
  return (
    <>
      <FormAuth mode="inscription" suite={suite === "/importer" ? suite : undefined} />
      <p className="meta" style={{ textAlign: "center", marginTop: 18, fontSize: 12.5 }}>
        Tes données d'entraînement sont visibles par toi et par ton coach, Moustapha. Elles ne sont jamais partagées.
      </p>
    </>
  );
}
