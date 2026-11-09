import { FormAuth } from "@/components/FormAuth";

export const metadata = { title: "Connexion — PT Mouss IA" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  return <FormAuth mode="connexion" suite={suite === "/importer" ? suite : undefined} />;
}
