import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminLoginPath, sanitizeAdminNext } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

const adminLoginPrefix = "/admin/login";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (request.nextUrl.pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith(adminLoginPrefix) &&
    (error || !data?.claims.sub)
  ) {
    const next = sanitizeAdminNext(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(new URL(adminLoginPath(next), request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|models|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)$).*)",
  ],
};
