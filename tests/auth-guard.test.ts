import { describe, expect, it } from "vitest";
import { evaluateAdminGuard } from "@/lib/auth/guard-core";
import type { AdminRole } from "@/lib/auth/types";

const nowMs = 1_700_000_000_000;
const recentTimestamp = Math.floor(nowMs / 1000) - 60;

function user(email = "admin@example.com") {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date(nowMs).toISOString(),
    email,
  };
}

function evaluate(options: {
  email?: string | null;
  aal?: "aal1" | "aal2" | null;
  role?: AdminRole | null;
  roles?: readonly AdminRole[];
  timestamp?: number;
  sessionIssuedAt?: number | null;
  sessionId?: string | null;
  sessionIsActive?: boolean;
}) {
  return evaluateAdminGuard({
    user: options.email === null ? null : user(options.email),
    aal: options.aal ?? "aal2",
    allowlistedRole: options.role === undefined ? "admin" : options.role,
    roles: options.roles,
    sessionIssuedAt: options.sessionIssuedAt,
    sessionId: options.sessionId,
    sessionIsActive: options.sessionIsActive,
    nowMs,
    currentAuthenticationMethods: [
      { method: "password", timestamp: options.timestamp ?? recentTimestamp },
      { method: "mfa/totp", timestamp: options.timestamp ?? recentTimestamp },
    ],
  });
}

function expectGuardError(
  result: ReturnType<typeof evaluate>,
  error: string
): void {
  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.error).toBe(error);
  }
}

describe("evaluateAdminGuard", () => {
  it("rejects no session", () => {
    expectGuardError(evaluate({ email: null }), "NO_SESSION");
  });

  it("rejects aal1 sessions", () => {
    expectGuardError(evaluate({ aal: "aal1" }), "MFA_REQUIRED");
  });

  it("rejects non-allowlisted email", () => {
    expectGuardError(evaluate({ role: null }), "NOT_ALLOWLISTED");
  });

  it("rejects wrong role", () => {
    expectGuardError(
      evaluate({ role: "reviewer", roles: ["admin"] }),
      "WRONG_ROLE"
    );
  });

  it("rejects expired session age", () => {
    const oldTimestamp = Math.floor(nowMs / 1000) - 12 * 60 * 60 - 1;

    expectGuardError(
      evaluate({ timestamp: oldTimestamp }),
      "SESSION_EXPIRED"
    );
  });

  it("uses the JWT issued-at time when MFA methods have no timestamps", () => {
    const result = evaluateAdminGuard({
      user: user(),
      aal: "aal2",
      allowlistedRole: "admin",
      currentAuthenticationMethods: ["password", "mfa/totp"],
      sessionIssuedAt: recentTimestamp,
      nowMs,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts a fresh aal2 allowlisted admin", () => {
    expect(evaluate({ role: "admin", roles: ["admin"] }).ok).toBe(true);
  });

  it("rejects a guard call with a revoked session id", () => {
    expectGuardError(
      evaluate({
        sessionId: "7b435b8e-5b6c-48be-9b37-cf86109dc082",
        sessionIsActive: false,
      }),
      "SESSION_EXPIRED"
    );
  });

  it("rejects a guard call when the session_id claim is missing", () => {
    expectGuardError(
      evaluate({
        sessionId: null,
      }),
      "SESSION_EXPIRED"
    );
  });

  it("accepts a guard call with an active session", () => {
    const result = evaluate({
      sessionId: "7b435b8e-5b6c-48be-9b37-cf86109dc082",
      sessionIsActive: true,
      role: "admin",
      roles: ["admin"],
    });
    expect(result.ok).toBe(true);
  });
});
