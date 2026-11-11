import type { MetadataRoute } from "next";
import { getApp } from "@/lib/app-serveur";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const foot = (await getApp()) === "foot";
  const p = foot ? "/foot-" : "/";
  return {
    name: foot ? "Baara Foot" : "Baara",
    short_name: foot ? "Baara Foot" : "Baara",
    id: foot ? "/?app=foot" : "/",
    start_url: "/",
    display: "standalone",
    background_color: foot ? "#06100b" : "#0a0707",
    theme_color: foot ? "#06100b" : "#0a0707",
    icons: [
      { src: `${p}icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${p}icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${p}icon-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
