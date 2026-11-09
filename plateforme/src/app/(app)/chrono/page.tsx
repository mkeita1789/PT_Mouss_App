import { Chrono } from "@/components/Chrono";
import { ui } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/serveur";

export const metadata = { title: "Chrono — PT Mouss IA" };

export default async function Page({ searchParams }: PageProps<"/chrono">) {
  const { mode } = await searchParams;
  const T = ui(await getLang());
  return (
    <div className="reveal" style={{ maxWidth: 620 }}>
      <header className="page-head">
        <h1 className="page-title">{T.chrono.titre}</h1>
      </header>
      <Chrono initial={mode === "minuteur" ? "minuteur" : "chrono"} />
    </div>
  );
}
