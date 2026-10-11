import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateAdminGuard } from "@/lib/auth/guard-core";
import { adminLoginPath, sanitizeAdminNext } from "@/lib/auth/redirect";
import { adminRequestPathHeader, sessionPolicy, withAuthCookieOptions } from "@/lib/auth/session-policy";

const sessionId = "11111111-1111-4111-8111-111111111111";
const nowSeconds = Math.floor(Date.now() / 1000);

type GuardContext = {
  role: "admin" | "reviewer" | null;
  session_active: boolean;
  expired_reason?: string | null;
  must_change_password: boolean;
};

const state = vi.hoisted(() => ({
  requestPath: null as string | null,
  claims: null as Record<string, unknown> | null,
  aal: "aal2" as string,
  guardContext: null as GuardContext | null,
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  signOutCalls: [] as unknown[],
  // Proxy: cookies the fake Supabase client "refreshes" during getClaims.
  refreshedCookies: [] as { name: string; value: string; options: Record<string, unknown> }[],
}));

class RedirectSignal extends Error {
  constructor(readonly location: string) {
    super(`REDIRECT ${location}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    throw new RedirectSignal(location);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(state.requestPath ? { [adminRequestPathHeader]: state.requestPath } : {}),
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

function fakeAuth() {
  return {
    getClaims: async () =>
      state.claims ? { data: { claims: state.claims }, error: null } : { data: null, error: new Error("no session") },
    getUser: async () =>
      state.claims
        ? { data: { user: { id: "user-1", email: "admin@example.com", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" } }, error: null }
        : { data: { user: null }, error: new Error("no session") },
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: {
          currentLevel: state.aal,
          currentAuthenticationMethods: [{ method: "mfa/totp", timestamp: nowSeconds - 60 }],
        },
        error: null,
      }),
    },
    signOut: async (options: unknown) => {
      state.signOutCalls.push(options);
      return { error: null };
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: fakeAuth() }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      return name === "admin_get_guard_context"
        ? { data: state.guardContext, error: null }
        : { data: null, error: null };
    },
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: (cookies: typeof state.refreshedCookies) => void } }
  ) => ({
    auth: {
      getClaims: async () => {
        if (state.refreshedCookies.length > 0) {
          options.cookies.setAll(state.refreshedCookies);
        }
        return state.claims ? { data: { claims: state.claims }, error: null } : { data: null, error: new Error("no session") };
      },
    },
  }),
}));

vi.mock("@/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key-for-tests",
  },
}));

const activeAdmin: GuardContext = { role: "admin", session_active: true, must_change_password: false };

async function captureRedirect(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    if (error instanceof RedirectSignal) return error.location;
    throw error;
  }
}

beforeEach(() => {
  state.requestPath = "/admin/issues?page=2";
  state.claims = { sub: "user-1", session_id: sessionId, iat: nowSeconds - 60 };
  state.aal = "aal2";
  state.guardContext = { ...activeAdmin };
  state.rpcCalls.length = 0;
  state.signOutCalls.length = 0;
  state.refreshedCookies = [];
});

describe("safe return destinations (open redirects)", () => {
  it.each([
    ["/admin/issues?page=2#top", "/admin/issues?page=2#top"],
    ["/admin", "/admin"],
    ["%2Fadmin%2Fdhikr", "/admin/dhikr"],
  ])("keeps the internal admin route %s", (input, expected) => {
    expect(sanitizeAdminNext(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example/admin",
    "%2F%2Fevil.example%2Fadmin",
    "/administrator",
    "/admin-tools",
    "/admin/../dhikr",
    "/admin/%2e%2e/dhikr",
    "/dhikr",
    "javascript:alert(1)",
    "/admin\n/x",
    "/admin/login",
    "/admin/login/verify?next=/admin",
    "%E0%A4%A",
  ])("rejects %s and falls back to the admin home", (input) => {
    expect(sanitizeAdminNext(input)).toBe("/admin");
  });

  it("builds the sign-in URL with an encoded, sanitised destination", () => {
    expect(adminLoginPath("/admin/issues?page=2")).toBe("/admin/login?next=%2Fadmin%2Fissues%3Fpage%3D2");
    expect(adminLoginPath("https://evil.example")).toBe("/admin/login?next=%2Fadmin");
  });
});

describe("session policy", () => {
  const base = {
    user: { id: "u", email: "admin@example.com", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" },
    aal: "aal2",
    allowlistedRole: "admin" as const,
    sessionId,
    sessionIsActive: true,
  };

  it("matches the agreed limits", () => {
    expect(sessionPolicy).toEqual({ accessTokenSeconds: 900, inactivitySeconds: 1800, maxSessionSeconds: 28800 });
  });

  it("expires a session older than 8 hours even if the database still has it", () => {
    const signedIn = nowSeconds - sessionPolicy.maxSessionSeconds - 1;
    const result = evaluateAdminGuard({
      ...base,
      currentAuthenticationMethods: [{ method: "mfa/totp", timestamp: signedIn }],
      nowMs: nowSeconds * 1000,
    });

    expect(result).toEqual({ ok: false, error: "SESSION_EXPIRED" });
  });

  it("keeps a session just inside 8 hours", () => {
    const signedIn = nowSeconds - sessionPolicy.maxSessionSeconds + 60;
    const result = evaluateAdminGuard({
      ...base,
      currentAuthenticationMethods: [{ method: "mfa/totp", timestamp: signedIn }],
      nowMs: nowSeconds * 1000,
    });

    expect(result.ok).toBe(true);
  });

  it("makes auth cookies httpOnly and limits them to the maximum session length", () => {
    expect(withAuthCookieOptions({ path: "/", maxAge: 400 * 24 * 60 * 60, httpOnly: false })).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      maxAge: sessionPolicy.maxSessionSeconds,
    });
    // Deleting a cookie (logout, expired session) must stay a deletion.
    expect(withAuthCookieOptions({ maxAge: 0 }).maxAge).toBe(0);
  });
});

describe("server-side admin guard", () => {
  it("lets a valid admin session through and records activity in the same call", async () => {
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(requireAdmin()).resolves.toMatchObject({ role: "admin" });
    expect(state.rpcCalls).toEqual([
      { name: "admin_get_guard_context", args: { p_email: "admin@example.com", p_session_id: sessionId } },
    ]);
  });

  it.each([
    ["inactive for 30 minutes", "inactive"],
    ["older than 8 hours", "max_age"],
    ["revoked", "revoked"],
  ])("sends a session %s to sign-in and back to the page afterwards", async (_label, reason) => {
    state.guardContext = { ...activeAdmin, session_active: false, expired_reason: reason };
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin())).resolves.toBe(
      "/admin/login?next=%2Fadmin%2Fissues%3Fpage%3D2"
    );
  });

  it("treats a token without a session id as expired", async () => {
    state.claims = { sub: "user-1", iat: nowSeconds - 60 };
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin())).resolves.toMatch(/^\/admin\/login\?next=/);
  });

  it("refuses a signed-in user who is not on the admin list", async () => {
    state.guardContext = { ...activeAdmin, role: null };
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin())).resolves.toMatch(/^\/admin\/login\?next=/);
  });

  it("refuses a password-only session that has not passed two-step verification", async () => {
    state.aal = "aal1";
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin())).resolves.toMatch(/^\/admin\/login\?next=/);
  });

  it("sends a reviewer away from an admin-only page to the home, not to sign-in (no loop)", async () => {
    state.guardContext = { ...activeAdmin, role: "reviewer" };
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin({ roles: ["admin"] }))).resolves.toBe("/admin");
  });

  it("shows not-found if even the home refused the role, instead of redirecting in a loop", async () => {
    state.guardContext = { ...activeAdmin, role: "reviewer" };
    state.requestPath = "/admin";
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(requireAdmin({ roles: ["admin"] })).rejects.toThrow("NOT_FOUND");
  });

  it("returns an error to a form action for the wrong role instead of redirecting", async () => {
    state.guardContext = { ...activeAdmin, role: "reviewer" };
    const { requireAdminAction } = await import("@/lib/auth/guard");

    await expect(requireAdminAction({ roles: ["admin"] })).resolves.toEqual({
      ok: false,
      error: "You do not have access to this admin area.",
    });
  });

  it("ignores an unsafe path header and returns to the admin home", async () => {
    state.requestPath = "https://evil.example/steal";
    state.guardContext = { ...activeAdmin, session_active: false };
    const { requireAdmin } = await import("@/lib/auth/guard");

    await expect(captureRedirect(() => requireAdmin())).resolves.toBe("/admin/login?next=%2Fadmin");
  });
});

describe("sign-in pages for an authenticated admin", () => {
  const props = (next?: string) => ({ searchParams: Promise.resolve(next ? { next } : {}) });

  it("redirects a signed-in admin from /admin/login to the intended page before rendering", async () => {
    const { default: LoginPage } = await import("@/app/admin/login/page");

    await expect(captureRedirect(() => LoginPage(props("/admin/dhikr")))).resolves.toBe("/admin/dhikr");
  });

  it("redirects to the dashboard when no destination was given", async () => {
    const { default: LoginPage } = await import("@/app/admin/login/page");

    await expect(captureRedirect(() => LoginPage(props()))).resolves.toBe("/admin");
  });

  it("never follows an external destination", async () => {
    const { default: LoginPage } = await import("@/app/admin/login/page");

    await expect(captureRedirect(() => LoginPage(props("https://evil.example")))).resolves.toBe("/admin");
  });

  it("sends an admin with a temporary password to Security", async () => {
    state.guardContext = { ...activeAdmin, must_change_password: true };
    const { default: LoginPage } = await import("@/app/admin/login/page");

    await expect(captureRedirect(() => LoginPage(props("/admin/dhikr")))).resolves.toBe("/admin/security");
  });

  it.each([
    ["no session", () => (state.claims = null)],
    ["an expired session", () => (state.guardContext = { ...activeAdmin, session_active: false, expired_reason: "inactive" })],
    ["a non-admin account", () => (state.guardContext = { ...activeAdmin, role: null })],
  ])("shows the sign-in form for %s", async (_label, arrange) => {
    arrange();
    const { default: LoginPage } = await import("@/app/admin/login/page");

    await expect(captureRedirect(() => LoginPage(props("/admin/dhikr")))).resolves.toBeNull();
  });
});

describe("logout", () => {
  it("revokes this session only, ends it in the database and redirects to sign-in", async () => {
    const { signOutAction } = await import("@/app/admin/auth-actions");

    await expect(captureRedirect(() => signOutAction())).resolves.toBe("/admin/login");
    expect(state.signOutCalls).toEqual([{ scope: "local" }]);
    expect(state.rpcCalls).toEqual([{ name: "admin_end_session", args: { p_session_id: sessionId } }]);
  });

  it("still redirects when the session had already gone", async () => {
    state.claims = null;
    const { signOutAction } = await import("@/app/admin/auth-actions");

    await expect(captureRedirect(() => signOutAction())).resolves.toBe("/admin/login");
    expect(state.rpcCalls).toEqual([]);
  });
});

describe("proxy (page loads and refreshes)", () => {
  async function run(path: string, init: { headers?: Record<string, string> } = {}) {
    const { proxy } = await import("@/proxy");
    return proxy(new NextRequest(new URL(path, "https://ism.example"), init));
  }

  it("redirects a visitor with no session to sign-in, keeping the destination", async () => {
    state.claims = null;
    const response = await run("/admin/issues?page=2");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://ism.example/admin/login?next=%2Fadmin%2Fissues%3Fpage%3D2"
    );
  });

  it("lets the sign-in page itself load without a session", async () => {
    state.claims = null;
    const response = await run("/admin/login");

    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps a valid session on reload: refreshed tokens reach the page and the browser", async () => {
    state.refreshedCookies = [
      { name: "sb-project-auth-token", value: "rotated", options: { path: "/", maxAge: 400 * 24 * 60 * 60 } },
    ];
    const response = await run("/admin/dhikr");

    expect(response.headers.get("location")).toBeNull();
    const cookie = response.cookies.get("sb-project-auth-token");
    expect(cookie?.value).toBe("rotated");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(sessionPolicy.maxSessionSeconds);
    // The page rendered in this request sees the rotated token too, not the old one.
    expect(response.headers.get("x-middleware-request-cookie")).toContain("sb-project-auth-token=rotated");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("passes the admin path to the guard and discards a spoofed copy", async () => {
    const admin = await run("/admin/dhikr?x=1", { headers: { [adminRequestPathHeader]: "https://evil.example" } });
    expect(admin.headers.get(`x-middleware-request-${adminRequestPathHeader}`)).toBe("/admin/dhikr?x=1");

    const publicPage = await run("/dhikr", { headers: { [adminRequestPathHeader]: "/admin/team" } });
    expect(publicPage.headers.get(`x-middleware-request-${adminRequestPathHeader}`)).toBeNull();
  });

  it("does not treat look-alike paths as admin routes", async () => {
    state.claims = null;
    const response = await run("/administrator");

    expect(response.headers.get("location")).toBeNull();
  });
});
