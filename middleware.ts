import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = [
  "/dashboard", "/trades", "/journal", "/insights",
  "/strategies", "/eval", "/import", "/settings", "/admin",
];

const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const isAppSubdomain = hostname.startsWith("app.");

  let response = NextResponse.next({ request });

  // ── Hostname-based routing ────────────────────────────────────────────────
  // www.tradiator.net → landing page only, redirect app routes to app subdomain
  // app.tradiator.net → journal app only, redirect / to /dashboard
  if (isAppSubdomain) {
    // On app subdomain: redirect root to dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // On www: redirect any app routes to app subdomain
    const isAppRoute = APP_ROUTES.some(r => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
    if (isAppRoute || isAuthRoute) {
      const appUrl = new URL(request.url);
      appUrl.hostname = appUrl.hostname.replace(/^www\./, "app.");
      return NextResponse.redirect(appUrl);
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const isAppRoute = APP_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  // ── Unauthenticated user trying to access app ─────────────────────────────
  if (isAppRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const isPwa = request.headers.get("sec-fetch-dest") === "document" &&
                  !request.headers.get("sec-fetch-site");
    if (isPwa) {
      return NextResponse.rewrite(loginUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated user on auth pages → send to dashboard ─────────────────
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};