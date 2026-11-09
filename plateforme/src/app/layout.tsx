import type { Metadata, Viewport } from "next";
/* Polices embarquées (pas d'appel à Google Fonts) : fonctionnent hors ligne */
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT Mouss IA — JIGI Coaching",
  description: "Ton coaching JIGI : programme, séances, progression.",
  appleWebApp: { capable: true, title: "PT Mouss", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#060607",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
