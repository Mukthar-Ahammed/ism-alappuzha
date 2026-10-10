import type { User } from "@supabase/supabase-js";
import type { AdminRole, AdminContext } from "@/lib/auth/types";

export type GuardFailureCode =
  | "NO_SESSION"
  | "MFA_REQUIRED"
  | "NOT_ALLOWLISTED"
  | "WRONG_ROLE"
  | "SESSION_EXPIRED";

export type GuardResult =
  | { ok: true; data: AdminContext }
  | { ok: false; error: GuardFailureCode };

export type AuthMethodEntry = string | { method?: string; timestamp?: number };

export type GuardInputs = {
  user: User | null;
  aal: "aal1" | "aal2" | (string & {}) | null;
  currentAuthenticationMethods: AuthMethodEntry[];
  allowlistedRole: AdminRole | null;
  roles?: readonly AdminRole[];
  sessionIssuedAt?: number | null;
  nowMs?: number;
};

const maxSessionAgeSeconds = 12 * 60 * 60;

function getLatestAuthTimestamp(methods: AuthMethodEntry[]): number | null {
  const timestamps = methods
    .filter((method): method is { method?: string; timestamp: number } => {
      return typeof method === "object" && typeof method.timestamp === "number";
    })
    .map((method) => method.timestamp);

  if (timestamps.length === 0) {
    return null;
  }

  return Math.max(...timestamps);
}

export function evaluateAdminGuard(inputs: GuardInputs): GuardResult {
  if (!inputs.user?.email) {
    return { ok: false, error: "NO_SESSION" };
  }

  if (inputs.aal !== "aal2") {
    return { ok: false, error: "MFA_REQUIRED" };
  }

  if (!inputs.allowlistedRole) {
    return { ok: false, error: "NOT_ALLOWLISTED" };
  }

  if (inputs.roles && !inputs.roles.includes(inputs.allowlistedRole)) {
    return { ok: false, error: "WRONG_ROLE" };
  }

  const latestAuthTimestamp = getLatestAuthTimestamp(
    inputs.currentAuthenticationMethods
  );
  const nowSeconds = Math.floor((inputs.nowMs ?? Date.now()) / 1000);

  const sessionTimestamp = latestAuthTimestamp ?? inputs.sessionIssuedAt;

  if (!sessionTimestamp || nowSeconds - sessionTimestamp > maxSessionAgeSeconds) {
    return { ok: false, error: "SESSION_EXPIRED" };
  }

  return {
    ok: true,
    data: {
      user: inputs.user,
      role: inputs.allowlistedRole,
    },
  };
}
