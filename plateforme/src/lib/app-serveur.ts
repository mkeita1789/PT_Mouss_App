import "server-only";
import { headers } from "next/headers";
import { appDeHote, type App } from "./app";

export async function getApp(): Promise<App> {
  const h = await headers();
  return appDeHote(h.get("x-forwarded-host") ?? h.get("host"));
}
