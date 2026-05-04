import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = [
  "/dashboard", "/trades", "/journal", "/insights",
  "/strategies", "/eval", "/import", "/settings", "/admin",
];

const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

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
  // Instead of a hard redirect, rewrite to login page content
  // This keeps the URL the same so iOS stays in standalone mode,
  // then the client-side PwaNavFix handles pushing to /login
  if (isAppRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    // Use rewrite instead of redirect to avoid breaking iOS standalone
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