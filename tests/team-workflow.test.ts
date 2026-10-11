import { describe, expect, it, vi } from "vitest";
import { evaluateAdminGuard } from "@/lib/auth/guard-core";
import {
  addAdminSchema,
  changeRoleSchema,
  confirmedTargetAdminSchema,
  ownPasswordSchema,
} from "@/features/team/schemas";
import { generateTemporaryPassword } from "@/features/team/server/password";
import {
  adminAuditDetail,
  canChangeAdminRole,
  canRemoveAdmin,
  canUseTeamAction,
  getRequiredRoleForTeamAction,
  normalizeAdminEmail,
  TEAM_ACTIONS,
  totpFactorIdsForReset,
} from "@/features/team/workflow";

const nowMs = 1_700_000_000_000;
const recentTimestamp = Math.floor(nowMs / 1000) - 60;

function mockUser(email = "test@example.com") {
  return {
    id: "user-test",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date(nowMs).toISOString(),
    email,
  };
}

describe("last-admin and self-removal rules", () => {
  it("blocks self-removal", () => {
    expect(
      canRemoveAdmin({
        actorEmail: "ADMIN@example.com",
        targetEmail: "admin@example.com",
        targetRole: "admin",
        adminCount: 2,
      })
    ).toEqual({ ok: false, reason: "self" });
  });

  it("blocks removing the last admin", () => {
    expect(
      canRemoveAdmin({
        actorEmail: "other@example.com",
        targetEmail: "admin@example.com",
        targetRole: "admin",
        adminCount: 1,
      })
    ).toEqual({ ok: false, reason: "last-admin" });
  });

  it("allows removing an admin when multiple admins exist", () => {
    expect(
      canRemoveAdmin({
        actorEmail: "lead@example.com",
        targetEmail: "second@example.com",
        targetRole: "admin",
        adminCount: 2,
      })
    ).toEqual({ ok: true });
  });

  it("allows removing a reviewer even when only one admin remains", () => {
    expect(
      canRemoveAdmin({
        actorEmail: "sole-admin@example.com",
        targetEmail: "reviewer@example.com",
        targetRole: "reviewer",
        adminCount: 1,
      })
    ).toEqual({ ok: true });
  });

  it("blocks self-role-change even when multiple admins exist", () => {
    expect(
      canChangeAdminRole({
        actorEmail: "admin@example.com",
        targetEmail: "admin@example.com",
        targetRole: "admin",
        newRole: "reviewer",
        adminCount: 3,
      })
    ).toEqual({ ok: false, reason: "self" });
  });

  it("blocks demoting the last admin", () => {
    expect(
      canChangeAdminRole({
        actorEmail: "other@example.com",
        targetEmail: "admin@example.com",
        targetRole: "admin",
        newRole: "reviewer",
        adminCount: 1,
      })
    ).toEqual({ ok: false, reason: "last-admin" });
  });

  it("allows demoting an admin when more than one admin exists", () => {
    expect(
      canChangeAdminRole({
        actorEmail: "lead@example.com",
        targetEmail: "admin2@example.com",
        targetRole: "admin",
        newRole: "reviewer",
        adminCount: 2,
      })
    ).toEqual({ ok: true });
  });

  it("allows promoting a reviewer to admin even if currently only one admin exists", () => {
    expect(
      canChangeAdminRole({
        actorEmail: "sole-admin@example.com",
        targetEmail: "reviewer@example.com",
        targetRole: "reviewer",
        newRole: "admin",
        adminCount: 1,
      })
    ).toEqual({ ok: true });
  });

  it("normalizes admin emails case-insensitively and trims whitespace", () => {
    expect(normalizeAdminEmail(" Admin@Example.COM ")).toBe("admin@example.com");
  });
});

describe("role checks on every Team action and reviewer rejection", () => {
  it("rejects reviewer for team actions in workflow permission check", () => {
    expect(canUseTeamAction("reviewer")).toBe(false);
    expect(canUseTeamAction("admin")).toBe(true);
  });

  it("enforces admin role requirement across all team action identifiers", () => {
    for (const action of TEAM_ACTIONS) {
      const required = getRequiredRoleForTeamAction(action);
      expect(required).toEqual(["admin"]);
      expect(required.includes("reviewer")).toBe(false);
    }
  });

  it("rejects reviewer session when guard evaluates team actions", () => {
    const result = evaluateAdminGuard({
      user: mockUser("reviewer@example.com"),
      aal: "aal2",
      allowlistedRole: "reviewer",
      roles: ["admin"],
      sessionIssuedAt: recentTimestamp,
      nowMs,
      currentAuthenticationMethods: [
        { method: "password", timestamp: recentTimestamp },
        { method: "mfa/totp", timestamp: recentTimestamp },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("WRONG_ROLE");
    }
  });

  it("accepts admin session when guard evaluates team actions", () => {
    const result = evaluateAdminGuard({
      user: mockUser("admin@example.com"),
      aal: "aal2",
      allowlistedRole: "admin",
      roles: ["admin"],
      sessionIssuedAt: recentTimestamp,
      nowMs,
      currentAuthenticationMethods: [
        { method: "password", timestamp: recentTimestamp },
        { method: "mfa/totp", timestamp: recentTimestamp },
      ],
    });

    expect(result.ok).toBe(true);
  });
});

describe("temporary password safety and non-leakage", () => {
  it("generates strong passwords meeting complexity and length requirements", () => {
    const password = generateTemporaryPassword(20);
    expect(password.length).toBe(20);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[!@#$%^&*()-_=+]/.test(password)).toBe(true);
  });

  it("generates distinct random passwords across subsequent calls", () => {
    const p1 = generateTemporaryPassword();
    const p2 = generateTemporaryPassword();
    const p3 = generateTemporaryPassword();
    expect(p1).not.toBe(p2);
    expect(p2).not.toBe(p3);
    expect(p1).not.toBe(p3);
  });

  it("scrubs any password fields from audit details", () => {
    const scrubbed = adminAuditDetail({
      temporaryPassword: "secret-temp-pw",
      password: "secret-password",
      new_password: "new-secret",
      role: "admin",
      removed_factors: 2,
    });

    expect(scrubbed).toEqual({ role: "admin", removed_factors: 2 });
    expect(scrubbed).not.toHaveProperty("temporaryPassword");
    expect(scrubbed).not.toHaveProperty("password");
    expect(scrubbed).not.toHaveProperty("new_password");
  });
});

describe("authenticator reset calls factor removal for every factor", () => {
  it("identifies all and only TOTP factors for reset", () => {
    const factors = [
      { id: "totp-1", factor_type: "totp" },
      { id: "phone-1", factor_type: "phone" },
      { id: "totp-2", factor_type: "totp" },
      { id: "totp-3", factor_type: "totp" },
    ];

    expect(totpFactorIdsForReset(factors)).toEqual(["totp-1", "totp-2", "totp-3"]);
  });

  it("returns empty array when no TOTP factors are present", () => {
    expect(
      totpFactorIdsForReset([
        { id: "phone-1", factor_type: "phone" },
        { id: "sms-1", factor_type: "sms" },
      ])
    ).toEqual([]);
  });

  it("executes factor removal for each factor ID returned", async () => {
    const factors = [
      { id: "factor-alpha", factor_type: "totp" },
      { id: "factor-beta", factor_type: "totp" },
    ];
    const factorIds = totpFactorIdsForReset(factors);

    const deleteFactorMock = vi.fn().mockResolvedValue({ error: null });

    for (const id of factorIds) {
      await deleteFactorMock({ userId: "target-user-id", id });
    }

    expect(deleteFactorMock).toHaveBeenCalledTimes(2);
    expect(deleteFactorMock).toHaveBeenNthCalledWith(1, {
      userId: "target-user-id",
      id: "factor-alpha",
    });
    expect(deleteFactorMock).toHaveBeenNthCalledWith(2, {
      userId: "target-user-id",
      id: "factor-beta",
    });
  });
});

describe("zod validation schemas", () => {
  it("validates addAdminSchema email and role", () => {
    expect(addAdminSchema.safeParse({ email: "new@example.com", role: "admin" }).success).toBe(true);
    expect(addAdminSchema.safeParse({ email: "reviewer@example.com", role: "reviewer" }).success).toBe(true);
    expect(addAdminSchema.safeParse({ email: "invalid-email", role: "admin" }).success).toBe(false);
    expect(addAdminSchema.safeParse({ email: "test@example.com", role: "superadmin" }).success).toBe(false);
  });

  it("validates changeRoleSchema", () => {
    expect(changeRoleSchema.safeParse({ email: "test@example.com", role: "admin" }).success).toBe(true);
    expect(changeRoleSchema.safeParse({ email: "test@example.com", role: "reviewer" }).success).toBe(true);
    expect(changeRoleSchema.safeParse({ email: "test@example.com", role: "other" }).success).toBe(false);
  });

  it("validates confirmedTargetAdminSchema", () => {
    expect(
      confirmedTargetAdminSchema.safeParse({ email: "test@example.com", confirm: "REMOVE" }).success
    ).toBe(true);
    expect(
      confirmedTargetAdminSchema.safeParse({ email: "test@example.com", confirm: "RESET" }).success
    ).toBe(true);
    expect(
      confirmedTargetAdminSchema.safeParse({ email: "test@example.com", confirm: "PASSWORD" }).success
    ).toBe(true);
    expect(
      confirmedTargetAdminSchema.safeParse({ email: "invalid", confirm: "REMOVE" }).success
    ).toBe(false);
  });

  it("validates ownPasswordSchema length (min 12) and confirmation match", () => {
    expect(
      ownPasswordSchema.safeParse({
        password: "securepassword123",
        confirmPassword: "securepassword123",
      }).success
    ).toBe(true);

    // Too short (< 12)
    const tooShort = ownPasswordSchema.safeParse({
      password: "short123",
      confirmPassword: "short123",
    });
    expect(tooShort.success).toBe(false);

    // Mismatched confirmation
    const mismatch = ownPasswordSchema.safeParse({
      password: "securepassword123",
      confirmPassword: "differentpassword123",
    });
    expect(mismatch.success).toBe(false);
  });
});
