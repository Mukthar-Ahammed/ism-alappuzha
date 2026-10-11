"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addAdminSchema,
  changeRoleSchema,
  confirmedTargetAdminSchema,
  ownPasswordSchema,
} from "@/features/team/schemas";
import { findAuthUserByEmail } from "@/features/team/server/data";
import { generateTemporaryPassword } from "@/features/team/server/password";
import { adminAuditDetail, totpFactorIdsForReset } from "@/features/team/workflow";
import type { TeamActionState } from "@/features/team/types";

const genericTeamError = "Could not save this change. Please refresh and try again.";

function parseForm<T extends z.ZodType>(schema: T, formData: FormData) {
  return schema.safeParse(Object.fromEntries(formData));
}

function actorEmail(email: string | undefined): string {
  return email?.trim().toLowerCase() || "unknown";
}

function teamError(message?: string): string {
  if (message === "self_removal" || message === "self_role_change") {
    return "You cannot make that change to your own account.";
  }

  if (message === "last_admin") {
    return "At least one admin must remain.";
  }

  if (message === "admin_not_found") {
    return "That admin was not found.";
  }

  return genericTeamError;
}

async function ensureTeamAdmin(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const admin = await requireAdminAction({ roles: ["admin"] });

  if (!admin.ok) {
    return admin;
  }

  return { ok: true, email: actorEmail(admin.data.user.email) };
}

async function setMustChangePassword(email: string, value: boolean): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("admins")
    .update({ must_change_password: value })
    .ilike("email", email);

  return !error;
}

async function auditAdminEvent(input: {
  actor: string;
  action: string;
  targetEmail: string;
  detail?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase.rpc("admin_audit_admin_event", {
    p_actor_email: input.actor,
    p_action: input.action,
    p_target_email: input.targetEmail,
    p_detail: adminAuditDetail(input.detail ?? {}),
  });
}

export async function addAdminAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(addAdminSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid admin." };
  }

  const guard = await ensureTeamAdmin();

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const actor = guard.email;
  const supabase = createSupabaseAdminClient();

  const { data: existingAllowlist } = await supabase
    .from("admins")
    .select("email")
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (existingAllowlist) {
    return { ok: false, error: "That email is already on the admin allowlist." };
  }

  const existingAuthUser = await findAuthUserByEmail(parsed.data.email);
  const temporaryPassword = existingAuthUser ? null : generateTemporaryPassword();

  if (!existingAuthUser && temporaryPassword) {
    const created = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (created.error) {
      const duplicateAuthUser = await findAuthUserByEmail(parsed.data.email);

      if (!duplicateAuthUser) {
        return { ok: false, error: "Could not create the auth user." };
      }
    }
  }

  const allowlist = await supabase.rpc("admin_add_admin_allowlist", {
    p_target_email: parsed.data.email,
    p_role: parsed.data.role,
    p_actor_email: actor,
  });

  if (allowlist.error) {
    console.error("[addAdminAction] admin_add_admin_allowlist error:", allowlist.error.message, allowlist.error);
    return { ok: false, error: teamError(allowlist.error.message) };
  }

  revalidatePath("/admin/team");

  if (temporaryPassword) {
    if (!(await setMustChangePassword(parsed.data.email, true))) {
      return {
        ok: false,
        error:
          "Admin added, but the password change requirement could not be saved. Use Reset password for this admin.",
      };
    }

    return {
      ok: true,
      message: "Admin added. Share this temporary password through a secure channel.",
      temporaryPassword,
      targetEmail: parsed.data.email,
    };
  }

  return {
    ok: true,
    message:
      "Auth user already exists. The allowlist entry is ready; no password was changed.",
    targetEmail: parsed.data.email,
  };
}

export async function changeRoleAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(changeRoleSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid role." };
  }

  const guard = await ensureTeamAdmin();

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const actor = guard.email;

  if (actor === parsed.data.email) {
    return { ok: false, error: "You cannot make that change to your own account." };
  }

  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_set_admin_role", {
    p_target_email: parsed.data.email,
    p_new_role: parsed.data.role,
    p_actor_email: actor,
  });

  if (result.error) {
    return { ok: false, error: teamError(result.error.message) };
  }

  revalidatePath("/admin/team");
  return { ok: true, message: "Role updated.", targetEmail: parsed.data.email };
}

export async function removeAdminAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(confirmedTargetAdminSchema, formData);

  if (!parsed.success || parsed.data.confirm !== "REMOVE") {
    return { ok: false, error: "Type REMOVE to confirm." };
  }

  const guard = await ensureTeamAdmin();

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const actor = guard.email;

  if (actor === parsed.data.email) {
    return { ok: false, error: "You cannot make that change to your own account." };
  }

  const supabase = createSupabaseAdminClient();
  const user = await findAuthUserByEmail(parsed.data.email);
  const removed = await supabase.rpc("admin_remove_admin_allowlist", {
    p_target_email: parsed.data.email,
    p_actor_email: actor,
  });

  if (removed.error) {
    return { ok: false, error: teamError(removed.error.message) };
  }


  if (user) {
    await supabase.rpc("admin_revoke_user_sessions", {
      target_user_id: user.id,
    });

    const deleted = await supabase.auth.admin.deleteUser(user.id);

    if (deleted.error) {
      await auditAdminEvent({
        actor,
        action: "admin_auth_delete_failed",
        targetEmail: parsed.data.email,
      });

      return {
        ok: false,
        error:
          "Access was removed from the allowlist, but the auth user could not be deleted.",
      };
    }
  }

  revalidatePath("/admin/team");
  return { ok: true, message: "Admin removed.", targetEmail: parsed.data.email };
}

export async function resetAuthenticatorAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(confirmedTargetAdminSchema, formData);

  if (!parsed.success || parsed.data.confirm !== "RESET") {
    return { ok: false, error: "Type RESET to confirm." };
  }

  const guard = await ensureTeamAdmin();

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const actor = guard.email;

  if (actor === parsed.data.email) {
    return { ok: false, error: "Use Security to manage your own devices." };
  }

  const supabase = createSupabaseAdminClient();
  const user = await findAuthUserByEmail(parsed.data.email);

  if (!user) {
    return { ok: false, error: "That auth user was not found." };
  }

  const factors = await supabase.auth.admin.mfa.listFactors({ userId: user.id });

  if (factors.error) {
    return { ok: false, error: "Could not read authenticator devices." };
  }

  const factorIds = totpFactorIdsForReset(factors.data.factors);

  for (const factorId of factorIds) {
    const deleted = await supabase.auth.admin.mfa.deleteFactor({
      userId: user.id,
      id: factorId,
    });

    if (deleted.error) {
      return { ok: false, error: "Could not reset all authenticator devices." };
    }
  }

  await supabase.rpc("admin_revoke_user_sessions", {
    target_user_id: user.id,
  });

  await auditAdminEvent({
    actor,
    action: "admin_authenticator_reset",
    targetEmail: parsed.data.email,
    detail: { removed_factors: factorIds.length },
  });

  revalidatePath("/admin/team");
  return {
    ok: true,
    message:
      "Authenticator reset and active sessions revoked. At next sign-in, this admin will enrol a new authenticator.",
    targetEmail: parsed.data.email,
  };
}

export async function resetPasswordAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(confirmedTargetAdminSchema, formData);

  if (!parsed.success || parsed.data.confirm !== "PASSWORD") {
    return { ok: false, error: "Type PASSWORD to confirm." };
  }

  const guard = await ensureTeamAdmin();

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const actor = guard.email;

  if (actor === parsed.data.email) {
    return { ok: false, error: "Use Security to change your own password." };
  }

  const supabase = createSupabaseAdminClient();
  const user = await findAuthUserByEmail(parsed.data.email);

  if (!user) {
    return { ok: false, error: "That auth user was not found." };
  }

  // Flag first: if the password update then fails, the only cost is an extra password change.
  if (!(await setMustChangePassword(parsed.data.email, true))) {
    return { ok: false, error: "Could not reset the password." };
  }

  const temporaryPassword = generateTemporaryPassword();
  const updated = await supabase.auth.admin.updateUserById(user.id, {
    password: temporaryPassword,
  });

  if (updated.error) {
    return { ok: false, error: "Could not reset the password." };
  }

  await supabase.rpc("admin_revoke_user_sessions", {
    target_user_id: user.id,
  });

  await auditAdminEvent({
    actor,
    action: "admin_password_reset",
    targetEmail: parsed.data.email,
  });

  revalidatePath("/admin/team");
  return {
    ok: true,
    message: "Password reset and active sessions revoked. Share this temporary password through a secure channel.",
    temporaryPassword,
    targetEmail: parsed.data.email,
  };
}

export async function changeOwnPasswordAction(
  _state: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const parsed = parseForm(ownPasswordSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const guard = await requireAdminAction({ allowPendingPasswordChange: true });

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const admin = guard.data;
  const supabase = createSupabaseAdminClient();
  const updated = await supabase.auth.admin.updateUserById(admin.user.id, {
    password: parsed.data.password,
  });

  if (updated.error) {
    return { ok: false, error: "Could not change your password." };
  }

  if (
    admin.mustChangePassword &&
    !(await setMustChangePassword(actorEmail(admin.user.email), false))
  ) {
    return {
      ok: false,
      error: "Your password was changed, but the page could not be unlocked. Refresh and try again.",
    };
  }

  const userSupabase = await createSupabaseServerClient();
  await userSupabase.auth.signOut({ scope: "others" });

  await auditAdminEvent({
    actor: actorEmail(admin.user.email),
    action: "admin_own_password_changed",
    targetEmail: actorEmail(admin.user.email),
  });

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Password changed. Other active sessions have been signed out." };
}

