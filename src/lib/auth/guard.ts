import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateAdminGuard, type GuardInputs } from "@/lib/auth/guard-core";
import { adminHomePath, adminLoginPath, sanitizeAdminNext } from "@/lib/auth/redirect";
import { adminRequestPathHeader } from "@/lib/auth/session-policy";
import type { ActionResult, AdminContext, AdminRole } from "@/lib/auth/types";

export type RequireAdminOptions = {
  roles?: readonly AdminRole[];
  /** Only the Security page, the shell and the change-password action may pass this. */
  allowPendingPasswordChange?: boolean;
};

export const adminSecurityPath = "/admin/security";

export const passwordChangeRequiredError =
  "You signed in with a temporary password. Choose a new password on Security to continue.";

const signInAgainError = "Please sign in again.";
const noAccessError = "You do not have access to this admin area.";

type GuardSession = Omit<GuardInputs, "roles" | "allowPendingPasswordChange" | "nowMs">;

type LoadedGuardSession =
  | { ok: true; data: GuardSession }
  | { ok: false; error: string };

export type AdminContextResult =
  | { ok: true; data: AdminContext }
  | { ok: false; error: string; reason: "sign_in" | "password_change" | "forbidden" };

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cached per request so every guard call in one render or action shares one RPC.
const loadGuardSession = cache(async (): Promise<LoadedGuardSession> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { ok: false, error: signInAgainError };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    return { ok: false, error: signInAgainError };
  }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal.error) {
    return { ok: false, error: "Please verify your authenticator code." };
  }

  const rawSessionId = (claimsData.claims as { session_id?: unknown }).session_id;
  const sessionId =
    typeof rawSessionId === "string" && uuidRegex.test(rawSessionId.trim())
      ? rawSessionId.trim()
      : null;

  const adminClient = createSupabaseAdminClient();
  const { data: guardContext, error: guardError } = await adminClient.rpc(
    "admin_get_guard_context",
    {
      p_email: userData.user.email,
      p_session_id: sessionId ?? "00000000-0000-0000-0000-000000000000",
    }
  );

  if (guardError || !guardContext) {
    if (guardError) {
      console.error("[guard] admin_get_guard_context RPC failed:", guardError.code);
    }
    return { ok: false, error: signInAgainError };
  }

  return {
    ok: true,
    data: {
      user: userData.user,
      aal: aal.data.currentLevel,
      currentAuthenticationMethods: aal.data.currentAuthenticationMethods,
      allowlistedRole: guardContext.role ?? null,
      sessionIssuedAt: claimsData.claims.iat,
      sessionId,
      sessionIsActive: Boolean(sessionId && guardContext.session_active),
      mustChangePassword: guardContext.must_change_password === true,
    },
  };
});

export async function getAdminContext(
  options: RequireAdminOptions = {}
): Promise<AdminContextResult> {
  const session = await loadGuardSession();

  if (!session.ok) {
    return { ok: false, error: session.error, reason: "sign_in" };
  }

  const result = evaluateAdminGuard({
    ...session.data,
    roles: options.roles,
    allowPendingPasswordChange: options.allowPendingPasswordChange,
  });

  if (result.ok) {
    return result;
  }

  if (result.error === "PASSWORD_CHANGE_REQUIRED") {
    return { ok: false, error: passwordChangeRequiredError, reason: "password_change" };
  }

  if (result.error === "SESSION_EXPIRED") {
    return { ok: false, error: signInAgainError, reason: "sign_in" };
  }

  // Signed in with a valid session but the wrong role: signing in again cannot help, and
  // sending them to the login page would bounce straight back here.
  if (result.error === "WRONG_ROLE") {
    return { ok: false, error: noAccessError, reason: "forbidden" };
  }

  return { ok: false, error: noAccessError, reason: "sign_in" };
}

/** The admin path of this request (set by the proxy), so sign-in can return to it. */
async function currentAdminPath(): Promise<string> {
  const headerStore = await headers();

  return sanitizeAdminNext(headerStore.get(adminRequestPathHeader));
}

/** For pages and form actions without result state: redirects on any failure. */
export async function requireAdmin(
  options: RequireAdminOptions = {}
): Promise<AdminContext> {
  const result = await getAdminContext(options);

  if (result.ok) {
    return result.data;
  }

  if (result.reason === "password_change") {
    redirect(adminSecurityPath);
  }

  const path = await currentAdminPath();

  if (result.reason === "forbidden") {
    // The home is open to every admin role, so this never loops; 404 is the last resort.
    if (path === adminHomePath) {
      notFound();
    }

    redirect(adminHomePath);
  }

  redirect(adminLoginPath(path));
}

/**
 * For actions that return result state: a pending password change becomes a
 * user-facing error; anything else still redirects to sign-in.
 */
export async function requireAdminAction(
  options: RequireAdminOptions = {}
): Promise<ActionResult<AdminContext>> {
  const result = await getAdminContext(options);

  if (result.ok) {
    return result;
  }

  if (result.reason === "password_change" || result.reason === "forbidden") {
    return { ok: false, error: result.error };
  }

  redirect(adminLoginPath(await currentAdminPath()));
}

/** requireAdminAction plus the actor email that audit entries record. */
export async function requireAdminActor(
  options: RequireAdminOptions = {}
): Promise<{ ok: true; actor: string; admin: AdminContext } | { ok: false; error: string }> {
  const result = await requireAdminAction(options);

  return result.ok
    ? { ok: true, actor: result.data.user.email ?? "unknown", admin: result.data }
    : result;
}

/**
 * For the sign-in pages (login, two-step setup and verify): an admin who already has a
 * valid session is sent on before anything renders, so the form never flashes.
 */
export async function redirectIfSignedIn(next: string): Promise<void> {
  const result = await getAdminContext({ allowPendingPasswordChange: true });

  if (result.ok) {
    redirect(result.data.mustChangePassword ? adminSecurityPath : sanitizeAdminNext(next));
  }
}
