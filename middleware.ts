import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that belong exclusively to the app. subdomain
const APP_ROUTES = [
  "/dashboard", "/trades", "/journal", "/insights",
  "/strategies", "/eval", "/import", "/settings", "/admin",
];

// Routes that are marketing-only (www.)
const MARKETING_ONLY = ["/pricing"];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const isLocal = hostname.startsWith("localhost");
  const isApp   = hostname.startsWith("app.");
  const isWww   = hostname.startsWith("www.");

  // ── app.tradiator.net ─────────────────────────────────────────────────────
  if (isApp) {
    // Root → dashboard
    if (path === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // Marketing-only paths → send to www
    if (MARKETING_ONLY.some((r) => path.startsWith(r))) {
      const wwwUrl = new URL(url);
      wwwUrl.host = hostname.replace("app.", "www.");
      return NextResponse.redirect(wwwUrl);
    }
  }

  // ── www.tradiator.net ─────────────────────────────────────────────────────
  if (isWww) {
    // App routes on www → redirect to app subdomain
    const isAppRoute = APP_ROUTES.some((r) => path.startsWith(r));
    if (isAppRoute) {
      const appUrl = new URL(url);
      appUrl.host = hostname.replace("www.", "app.");
      return NextResponse.redirect(appUrl);
    }
    // /login and /signup live on app subdomain for cookie consistency
    if (path.startsWith("/login") || path.startsWith("/signup")) {
      const appUrl = new URL(url);
      appUrl.host = hostname.replace("www.", "app.");
      return NextResponse.redirect(appUrl);
    }
  }

  // ── Supabase session refresh ──────────────────────────────────────────────
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

  await supabase.auth.getUser();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};