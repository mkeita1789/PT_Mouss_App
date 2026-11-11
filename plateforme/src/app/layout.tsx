import type { Metadata, Viewport } from "next";
/* Polices embarquées (pas d'appel à Google Fonts) : fonctionnent hors ligne */
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";
import { LangProvider } from "@/components/Langue";
import { getLang } from "@/lib/i18n/serveur";
import { APERCU } from "@/lib/theme";
import { getTheme } from "@/lib/theme/serveur";

export const metadata: Metadata = {
  title: "Baara",
  description: "Baara : programme, séances, progression, équipe.",
  appleWebApp: { capable: true, title: "Baara", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: APERCU[await getTheme()].barre, width: "device-width", initialScale: 1, viewportFit: "cover" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  return (
    <html lang={lang} data-theme={theme === "or" ? undefined : theme}>
      <body>
        <LangProvider lang={lang}>
          <div id="app">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}
