import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, sanitizeAdminNext } from "@/lib/auth/redirect";
import { adminRequestPathHeader, withAuthCookieOptions } from "@/lib/auth/session-policy";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const adminLoginPrefix = "/admin/login";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * First line of the admin auth: refreshes the Supabase session cookies (so a page reload
 * keeps a valid session) and sends visitors with no session to sign-in. Admin status,
 * role, revocation, inactivity and maximum age are checked by the server-side guard
 * (src/lib/auth/guard.ts) on every admin page and action.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const adminRequest = isAdminPath(pathname);

  // Only the proxy may set this header; a client-sent copy is always discarded.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(adminRequestPathHeader);

  if (adminRequest) {
    requestHeaders.set(adminRequestPathHeader, sanitizeAdminNext(`${pathname}${search}`));
  }

  const forward = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = forward();

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Refreshed tokens go to both the page being rendered and the browser.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          requestHeaders.set("cookie", request.cookies.toString());
          response = forward();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, withAuthCookieOptions(options));
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();

  if (
    adminRequest &&
    !pathname.startsWith(adminLoginPrefix) &&
    (error || !data?.claims.sub)
  ) {
    const redirectResponse = NextResponse.redirect(
      new URL(adminLoginPath(`${pathname}${search}`), request.url)
    );
    // Keep any cookie changes (e.g. a cleared, unusable session) on the redirect too.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirectResponse;
  }

  if (adminRequest) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    // Admin pages depend on the session; never let a shared cache store them.
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|models|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)$).*)",
  ],
};
