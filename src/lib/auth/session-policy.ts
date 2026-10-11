/**
 * Admin session policy. The database enforces the inactivity and maximum-age limits
 * (supabase/phase10-admin-session-policy-combined.sql, admin_get_guard_context);
 * keep these numbers in step with it.
 *
 * The 15-minute access token lifetime is a Supabase project setting
 * (Authentication > Sessions > JWT expiry = 900), not something the app can set.
 */
export const sessionPolicy = {
  accessTokenSeconds: 15 * 60,
  inactivitySeconds: 30 * 60,
  maxSessionSeconds: 8 * 60 * 60,
} as const;

/**
 * Options for the Supabase auth cookies (access and refresh token). All auth runs on
 * the server, so the cookies are httpOnly: page scripts can never read a refresh token.
 * They also expire with the maximum session length instead of the library's 400 days.
 */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: sessionPolicy.maxSessionSeconds,
} as const;

type CookieOptionsLike = Record<string, unknown> & { maxAge?: number };

/**
 * Applies authCookieOptions to a cookie @supabase/ssr is about to set. The library
 * always sets its own 400-day maxAge, so it is replaced here; deletions (maxAge 0) stay.
 */
export function withAuthCookieOptions<T extends CookieOptionsLike>(options: T | undefined): T {
  const deleting = options?.maxAge === 0;

  return {
    ...options,
    ...authCookieOptions,
    maxAge: deleting ? 0 : authCookieOptions.maxAge,
  } as unknown as T;
}

/**
 * Request header the proxy sets to the admin path being requested, so a guard that
 * rejects a session can send the admin back there after signing in again.
 * The proxy always overwrites or removes any value sent by the client.
 */
export const adminRequestPathHeader = "x-ism-admin-path";
