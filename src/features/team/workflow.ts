import type { AdminRole } from "@/lib/auth/types";

export type TeamMutationCheck = {
  actorEmail: string;
  targetEmail: string;
  targetRole: AdminRole;
  adminCount: number;
};

export type TeamMutationDecision =
  | { ok: true }
  | { ok: false; reason: "self" | "last-admin" };

export type FactorLike = {
  id: string;
  factor_type: string;
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canRemoveAdmin(input: TeamMutationCheck): TeamMutationDecision {
  if (normalizeAdminEmail(input.actorEmail) === normalizeAdminEmail(input.targetEmail)) {
    return { ok: false, reason: "self" };
  }

  if (input.targetRole === "admin" && input.adminCount <= 1) {
    return { ok: false, reason: "last-admin" };
  }

  return { ok: true };
}

export function canChangeAdminRole(
  input: TeamMutationCheck & { newRole: AdminRole }
): TeamMutationDecision {
  if (normalizeAdminEmail(input.actorEmail) === normalizeAdminEmail(input.targetEmail)) {
    return { ok: false, reason: "self" };
  }

  if (
    input.targetRole === "admin" &&
    input.newRole !== "admin" &&
    input.adminCount <= 1
  ) {
    return { ok: false, reason: "last-admin" };
  }

  return { ok: true };
}

export function canUseTeamAction(role: AdminRole): boolean {
  return role === "admin";
}

export const TEAM_ACTIONS = [
  "addAdmin",
  "changeRole",
  "removeAdmin",
  "resetAuthenticator",
  "resetPassword",
] as const;

export type TeamAction = (typeof TEAM_ACTIONS)[number];

export function getRequiredRoleForTeamAction(action: TeamAction): readonly AdminRole[] {
  void action;
  return ["admin"] as const;
}


export function totpFactorIdsForReset(factors: readonly FactorLike[]): string[] {
  return factors
    .filter((factor) => factor.factor_type === "totp")
    .map((factor) => factor.id);
}

export function adminAuditDetail(
  detail: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  const safeDetail: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(detail)) {
    if (!key.toLowerCase().includes("password")) {
      safeDetail[key] = value;
    }
  }

  return safeDetail;
}

