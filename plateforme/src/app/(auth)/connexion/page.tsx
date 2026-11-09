import { FormAuth } from "@/components/FormAuth";

export const metadata = { title: "Connexion — Baara" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  return <FormAuth mode="connexion" suite={suite === "/importer" ? suite : undefined} />;
}
