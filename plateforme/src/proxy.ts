import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Pages accessibles sans être connecté */
const PUBLIC = ["/connexion", "/inscription", "/auth", "/importer"];

/* Rafraîchit la session Supabase à chaque requête et protège les pages privées. */
export async function proxy(request: NextRequest) {
  /* Mode démo local (PTMOUSS_DEMO=1, jamais en production) : pas d'authentification */
  if (process.env.PTMOUSS_DEMO === "1") return NextResponse.next({ request });
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const connecte = !!data?.claims;
  const path = request.nextUrl.pathname;
  const estPublic = PUBLIC.some((p) => path === p || path.startsWith(p + "/"));

  if (!connecte && !estPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (connecte && (path === "/connexion" || path === "/inscription")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest.webmanifest).*)"],
};
