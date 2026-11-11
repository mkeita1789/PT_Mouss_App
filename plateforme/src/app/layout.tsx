import type { Metadata, Viewport } from "next";
/* Polices embarquées (pas d'appel à Google Fonts) : fonctionnent hors ligne */
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";
import { LangProvider } from "@/components/Langue";
import { getLang } from "@/lib/i18n/serveur";
import { APERCU } from "@/lib/theme";
import { getTheme } from "@/lib/theme/serveur";
import { AppProvider } from "@/components/AppContexte";
import { NOM_APP } from "@/lib/app";
import { getApp } from "@/lib/app-serveur";

export async function generateMetadata(): Promise<Metadata> {
  const app = await getApp();
  const nom = NOM_APP[app];
  const foot = app === "foot";
  return {
    title: nom,
    description: foot ? "Baara Foot : calendrier, présences, compositions et staff de ton club." : "Baara : programme, séances et progression, à la maison ou à la salle.",
    appleWebApp: { capable: true, title: nom, statusBarStyle: "black-translucent" },
    icons: { icon: foot ? "/foot-icon-192.png" : "/icon-192.png", apple: foot ? "/foot-apple-icon.png" : "/apple-icon.png" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await getApp()) === "foot" ? "#06100b" : APERCU[await getTheme()].barre, width: "device-width", initialScale: 1, viewportFit: "cover" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, theme, app] = await Promise.all([getLang(), getTheme(), getApp()]);
  /* Baara Foot : ambiance pelouse par défaut, puis les couleurs du club (layout de l'appli) */
  return (
    <html lang={lang} data-theme={app === "foot" ? "foot" : theme === "or" ? undefined : theme} data-app={app}>
      <body>
        <AppProvider app={app}>
          <LangProvider lang={lang}>
            <div id="app">{children}</div>
          </LangProvider>
        </AppProvider>
      </body>
    </html>
  );
}
