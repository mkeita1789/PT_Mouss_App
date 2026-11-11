import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Pages accessibles sans être connecté */
const PUBLIC = ["/connexion", "/inscription", "/auth", "/importer", "/api/rappels"];

/* Adresse unique de l'appli. L'ancienne adresse de la plateforme y renvoie. */
const ADRESSE = "pt-mouss-app.vercel.app";
const ANCIENNES = ["ptmouss-plateforme.vercel.app"];

/* Rafraîchit la session Supabase à chaque requête et protège les pages privées. */
export async function proxy(request: NextRequest) {
  /* Mode démo local (PTMOUSS_DEMO=1, jamais en production) : pas d'authentification */
  if (process.env.PTMOUSS_DEMO === "1") return NextResponse.next({ request });

  const hote = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0];
  if (ANCIENNES.includes(hote)) {
    return NextResponse.redirect(`https://${ADRESSE}${request.nextUrl.pathname}${request.nextUrl.search}`, 308);
  }

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
    const code = path === "/equipe" ? (request.nextUrl.searchParams.get("code") ?? "").toUpperCase() : "";
    url.pathname = /^[A-Z0-9]{6}$/.test(code) ? "/inscription" : "/connexion";
    url.search = url.pathname === "/inscription" ? `?suite=${encodeURIComponent(`/equipe?code=${code}`)}` : "";
    return NextResponse.redirect(url);
  }
  if (connecte && (path === "/connexion" || path === "/inscription")) {
    const url = request.nextUrl.clone();
    /* Déjà inscrit et lien d'invitation : on l'emmène là où entrer le code (déjà rempli) */
    const code = path === "/inscription" ? request.nextUrl.searchParams.get("code") ?? "" : "";
    const valide = /^[A-Za-z0-9]{6}$/.test(code);
    url.pathname = valide ? "/profil" : "/";
    url.search = valide ? `?code=${code.toUpperCase()}` : "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-icon\\.png|manifest.webmanifest|manifest\\.json|sw\\.js).*)"],
};
