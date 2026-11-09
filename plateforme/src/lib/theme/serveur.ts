import "server-only";
import { cookies } from "next/headers";
import { COOKIE_THEME, lireTheme, type Theme } from "./index";

export async function getTheme(): Promise<Theme> {
  return lireTheme((await cookies()).get(COOKIE_THEME)?.value);
}
