import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateAdminGuard, type GuardInputs } from "@/lib/auth/guard-core";

type FakeAdminRow = {
  role: "admin" | "reviewer";
  mustChangePassword: boolean;
};

const state = vi.hoisted(() => ({
  currentEmail: "flagged@example.com",
  admins: new Map<string, FakeAdminRow>(),
  authUsers: new Map<string, { id: string; email: string }>(),
  signOutCalls: [] as unknown[],
  updatedPasswords: [] as string[],
}));

class RedirectError extends Error {
  constructor(readonly location: string) {
    super(`NEXT_REDIRECT:${location}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    throw new RedirectError(location);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/admin/security",
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T,>(fn: T) => fn,
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function currentUser() {
  return {
    id: `user:${state.currentEmail}`,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: state.currentEmail,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: {
          claims: {
            sub: currentUser().id,
            iat: nowSeconds(),
            session_id: "11111111-1111-4111-8111-111111111111",
          },
        },
        error: null,
      }),
      getUser: async () => ({ data: { user: currentUser() }, error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: {
            currentLevel: "aal2",
            currentAuthenticationMethods: [
              { method: "password", timestamp: nowSeconds() },
              { method: "totp", timestamp: nowSeconds() },
            ],
          },
          error: null,
        }),
      },
      signOut: async (options?: unknown) => {
        state.signOutCalls.push(options ?? null);
        return { error: null };
      },
    },
  }),
}));

function adminsTable() {
  return {
    update: (values: { must_change_password: boolean }) => ({
      ilike: async (_column: string, email: string) => {
        const row = state.admins.get(email.toLowerCase());

        if (row) {
          row.mustChangePassword = values.must_change_password;
        }

        return { error: null };
      },
    }),
    select: () => ({
      ilike: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
  };
}

function rpc(name: string, args: Record<string, string>) {
  if (name === "admin_get_guard_context") {
    const row = state.admins.get(args.p_email?.toLowerCase() ?? "");

    return Promise.resolve({
      data: {
        role: row?.role ?? null,
        session_active: true,
        must_change_password: row?.mustChangePassword ?? false,
      },
      error: null,
    });
  }

  if (name === "admin_add_admin_allowlist") {
    const email = args.p_target_email ?? "";
    const role = args.p_role === "admin" ? "admin" : "reviewer";

    state.admins.set(email, { role, mustChangePassword: false });
    return Promise.resolve({ data: { email, role }, error: null });
  }

  return Promise.resolve({ data: null, error: null });
}

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc,
    from: (table: string) => {
      if (table !== "admins") {
        throw new Error(`Unexpected table ${table}`);
      }

      return adminsTable();
    },
    auth: {
      admin: {
        createUser: async ({ email }: { email: string }) => {
          state.authUsers.set(email, { id: `user:${email}`, email });
          return { data: { user: { id: `user:${email}` } }, error: null };
        },
        updateUserById: async (_id: string, values: { password: string }) => {
          state.updatedPasswords.push(values.password);
          return { data: {}, error: null };
        },
        mfa: {
          listFactors: async () => ({ data: { factors: [] }, error: null }),
        },
      },
    },
  }),
}));

vi.mock("@/features/team/server/data", () => ({
  findAuthUserByEmail: async (email: string) => state.authUsers.get(email) ?? null,
  listTeamMembers: async () => [],
}));

vi.mock("@/features/questions/server/data", () => ({
  listQuestions: async () => {
    throw new Error("listQuestions must not run for a flagged user");
  },
  getQuestionDetail: async () => {
    throw new Error("getQuestionDetail must not run for a flagged user");
  },
}));

const flaggedEmail = "flagged@example.com";
const actorEmail = "owner@example.com";

function signInAs(email: string): void {
  state.currentEmail = email;
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

async function redirectLocation(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    if (error instanceof RedirectError) {
      return error.location;
    }

    throw error;
  }
}

const emptySearchParams = Promise.resolve({});
const questionId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  state.admins.clear();
  state.authUsers.clear();
  state.signOutCalls.length = 0;
  state.updatedPasswords.length = 0;
  state.admins.set(actorEmail, { role: "admin", mustChangePassword: false });
  state.admins.set(flaggedEmail, { role: "reviewer", mustChangePassword: true });
  state.authUsers.set(flaggedEmail, { id: `user:${flaggedEmail}`, email: flaggedEmail });
  signInAs(flaggedEmail);
});

describe("evaluateAdminGuard with a pending password change", () => {
  const base: GuardInputs = {
    user: {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "admin@example.com",
    },
    aal: "aal2",
    allowlistedRole: "admin",
    sessionId: "11111111-1111-4111-8111-111111111111",
    sessionIsActive: true,
    currentAuthenticationMethods: [{ method: "totp", timestamp: nowSeconds() }],
    mustChangePassword: true,
  };

  it("rejects admins and reviewers alike", () => {
    expect(evaluateAdminGuard(base)).toEqual({
      ok: false,
      error: "PASSWORD_CHANGE_REQUIRED",
    });
    expect(evaluateAdminGuard({ ...base, allowlistedRole: "reviewer" })).toEqual({
      ok: false,
      error: "PASSWORD_CHANGE_REQUIRED",
    });
  });

  it("still requires the authenticator before the password check", () => {
    expect(evaluateAdminGuard({ ...base, aal: "aal1" })).toEqual({
      ok: false,
      error: "MFA_REQUIRED",
    });
  });

  it("allows callers that permit the pending change and reports the flag", () => {
    const result = evaluateAdminGuard({ ...base, allowPendingPasswordChange: true });

    expect(result.ok && result.data.mustChangePassword).toBe(true);
  });

  it("defaults to unflagged", () => {
    const result = evaluateAdminGuard({ ...base, mustChangePassword: undefined });

    expect(result.ok && result.data.mustChangePassword).toBe(false);
  });
});

describe("flagged user on admin pages", () => {
  const blockedPages: [string, () => Promise<unknown>][] = [
    ["/admin", async () => (await import("@/app/admin/(panel)/page")).default({ searchParams: emptySearchParams })],
    [
      "/admin/questions/[id]",
      async () =>
        (await import("@/app/admin/(panel)/questions/[id]/page")).default({
          params: Promise.resolve({ id: questionId }),
          searchParams: emptySearchParams,
        }),
    ],
    ["/admin/issues", async () => (await import("@/app/admin/(panel)/issues/page")).default({ searchParams: emptySearchParams })],
    [
      "/admin/issues/[id]",
      async () =>
        (await import("@/app/admin/(panel)/issues/[id]/page")).default({
          params: Promise.resolve({ id: "new" }),
          searchParams: emptySearchParams,
        }),
    ],
    ["/admin/live", async () => (await import("@/app/admin/(panel)/live/page")).default({ searchParams: emptySearchParams })],
    ["/admin/programs", async () => (await import("@/app/admin/(panel)/programs/page")).default({ searchParams: emptySearchParams })],
    [
      "/admin/programs/[id]",
      async () =>
        (await import("@/app/admin/(panel)/programs/[id]/page")).default({
          params: Promise.resolve({ id: "new" }),
          searchParams: emptySearchParams,
        }),
    ],
    ["/admin/videos", async () => (await import("@/app/admin/(panel)/videos/page")).default({ searchParams: emptySearchParams })],
    [
      "/admin/videos/[id]",
      async () =>
        (await import("@/app/admin/(panel)/videos/[id]/page")).default({
          params: Promise.resolve({ id: "new" }),
          searchParams: emptySearchParams,
        }),
    ],
    ["/admin/leaders", async () => (await import("@/app/admin/(panel)/leaders/page")).default({ searchParams: emptySearchParams })],
    [
      "/admin/leaders/[id]",
      async () =>
        (await import("@/app/admin/(panel)/leaders/[id]/page")).default({
          params: Promise.resolve({ id: "new" }),
          searchParams: emptySearchParams,
        }),
    ],
    ["/admin/dhikr", async () => (await import("@/app/admin/(panel)/dhikr/page")).default()],
    ["/admin/team", async () => (await import("@/app/admin/(panel)/team/page")).default()],
  ];

  it.each(blockedPages)("redirects %s to Security", async (_route, render) => {
    expect(await redirectLocation(render)).toBe("/admin/security");
  });

  it("renders Security with the temporary password banner", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const SecurityPage = (await import("@/app/admin/(panel)/security/page")).default;
    const html = renderToStaticMarkup(await SecurityPage({ searchParams: emptySearchParams }));

    expect(html).toContain(
      "You signed in with a temporary password. Choose a new password to continue."
    );
  });

  it("hides the sidebar links", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { AdminNavigation } = await import("@/app/admin/AdminNavigation");
    const render = (mustChangePassword: boolean) =>
      renderToStaticMarkup(
        createElement(AdminNavigation, {
          role: "admin",
          pendingCount: 0,
          mustChangePassword,
          children: null,
        })
      );

    expect(render(false)).toContain('href="/admin/team"');
    expect(render(true)).not.toContain('href="/admin/team"');
  });
});

describe("flagged user and server actions", () => {
  it("rejects other actions with a clear message", async () => {
    state.admins.set(flaggedEmail, { role: "admin", mustChangePassword: true });
    const { addAdminAction } = await import("@/features/team/server/actions");
    const { saveNotes } = await import("@/features/questions/server/actions");
    const { passwordChangeRequiredError } = await import("@/lib/auth/guard");

    await expect(
      addAdminAction({ ok: false }, form({ email: "new@example.com", role: "reviewer" }))
    ).resolves.toEqual({ ok: false, error: passwordChangeRequiredError });
    await expect(
      saveNotes({}, form({ id: questionId, notes: "x", updatedAt: new Date().toISOString() }))
    ).resolves.toEqual({ ok: false, error: passwordChangeRequiredError });
    expect(state.admins.has("new@example.com")).toBe(false);
  });

  it("redirects form actions to Security", async () => {
    const { removeFactorAction } = await import("@/app/admin/auth-actions");

    expect(
      await redirectLocation(() =>
        removeFactorAction(form({ factorId: "33333333-3333-4333-8333-333333333333" }))
      )
    ).toBe("/admin/security");
  });

  it("changes the password and clears the flag", async () => {
    const { changeOwnPasswordAction } = await import("@/features/team/server/actions");
    const result = await changeOwnPasswordAction(
      { ok: false },
      form({ password: "a-new-long-password", confirmPassword: "a-new-long-password" })
    );

    expect(result.ok).toBe(true);
    expect(state.updatedPasswords).toEqual(["a-new-long-password"]);
    expect(state.admins.get(flaggedEmail)?.mustChangePassword).toBe(false);
  });

  it("still signs out", async () => {
    const { signOutAction } = await import("@/app/admin/auth-actions");

    expect(await redirectLocation(() => signOutAction())).toBe("/admin/login");
    expect(state.signOutCalls).toHaveLength(1);
  });
});

describe("setting the flag", () => {
  beforeEach(() => {
    signInAs(actorEmail);
  });

  it("is set when add admin creates a temporary password", async () => {
    const { addAdminAction } = await import("@/features/team/server/actions");
    const result = await addAdminAction(
      { ok: false },
      form({ email: "new@example.com", role: "reviewer" })
    );

    expect(result.ok && result.temporaryPassword).toBeTruthy();
    expect(state.admins.get("new@example.com")?.mustChangePassword).toBe(true);
  });

  it("is not set when the auth user already exists and no password is issued", async () => {
    state.authUsers.set("existing@example.com", {
      id: "user:existing@example.com",
      email: "existing@example.com",
    });
    const { addAdminAction } = await import("@/features/team/server/actions");
    const result = await addAdminAction(
      { ok: false },
      form({ email: "existing@example.com", role: "reviewer" })
    );

    expect(result.ok && result.temporaryPassword).toBeFalsy();
    expect(state.admins.get("existing@example.com")?.mustChangePassword).toBe(false);
  });

  it("is set when another admin's password is reset", async () => {
    state.admins.set(flaggedEmail, { role: "reviewer", mustChangePassword: false });
    const { resetPasswordAction } = await import("@/features/team/server/actions");
    const result = await resetPasswordAction(
      { ok: false },
      form({ email: flaggedEmail, confirm: "PASSWORD" })
    );

    expect(result.ok && result.temporaryPassword).toBeTruthy();
    expect(state.admins.get(flaggedEmail)?.mustChangePassword).toBe(true);
  });

  it("leaves an unflagged admin unrestricted", async () => {
    const { getAdminContext } = await import("@/lib/auth/guard");
    const result = await getAdminContext({ roles: ["admin"] });

    expect(result.ok && result.data.mustChangePassword).toBe(false);
  });
});
