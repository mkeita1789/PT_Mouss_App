import type { Metadata, Viewport } from "next";
/* Polices embarquées (pas d'appel à Google Fonts) : fonctionnent hors ligne */
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";
import { LangProvider } from "@/components/Langue";
import { getLang } from "@/lib/i18n/serveur";

export const metadata: Metadata = {
  title: "PT Mouss IA — JIGI Coaching",
  description: "JIGI Coaching : programme, séances, progression.",
  appleWebApp: { capable: true, title: "PT Mouss", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#060607",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        <LangProvider lang={lang}>
          <div id="app">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}
