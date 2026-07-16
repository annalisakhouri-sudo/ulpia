import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Vérifie la session utilisateur à chaque requête et protège les pages privées.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/connexion") ||
    request.nextUrl.pathname.startsWith("/inscription");

  const isPartnerAuthPage =
    request.nextUrl.pathname.startsWith("/partenaire/connexion") ||
    request.nextUrl.pathname.startsWith("/partenaire/inscription");

  const isPartnerPage = request.nextUrl.pathname.startsWith("/partenaire");

  const isPublicPage =
    request.nextUrl.pathname.startsWith("/acces") ||
    request.nextUrl.pathname.startsWith("/demande");

  if (
    !user &&
    !isAuthPage &&
    !isPartnerAuthPage &&
    !isPublicPage &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = isPartnerPage ? "/partenaire/connexion" : "/connexion";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    return NextResponse.redirect(url);
  }

  if (user && isPartnerAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/partenaire/tableau-de-bord";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
