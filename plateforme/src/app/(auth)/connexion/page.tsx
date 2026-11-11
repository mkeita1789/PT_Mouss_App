import { FormAuth } from "@/components/FormAuth";
import { suiteValide } from "@/lib/suite";

export const metadata = { title: "Connexion — Baara" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  return <FormAuth mode="connexion" suite={suiteValide(suite) ?? undefined} />;
}
