import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateAdminGuard } from "@/lib/auth/guard-core";
import { adminLoginPath } from "@/lib/auth/redirect";
import type { ActionResult, AdminContext, AdminRole } from "@/lib/auth/types";

type RequireAdminOptions = {
  roles?: readonly AdminRole[];
};

async function loadAdminContext(
  rolesKey: string,
  roles?: readonly AdminRole[]
): Promise<ActionResult<AdminContext>> {
  void rolesKey;

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { ok: false, error: "Please sign in again." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    return { ok: false, error: "Please sign in again." };
  }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal.error) {
    return { ok: false, error: "Please verify your authenticator code." };
  }

  const adminClient = createSupabaseAdminClient();
  const { data: adminRow } = await adminClient
    .from("admins")
    .select("role")
    .ilike("email", userData.user.email)
    .maybeSingle();

  const result = evaluateAdminGuard({
    user: userData.user,
    aal: aal.data.currentLevel,
    currentAuthenticationMethods: aal.data.currentAuthenticationMethods,
    allowlistedRole: adminRow?.role ?? null,
    sessionIssuedAt: claimsData.claims.iat,
    roles,
  });

  if (!result.ok) {
    return { ok: false, error: "You do not have access to this admin area." };
  }

  return { ok: true, data: result.data };
}

const cachedLoadAdminContext = cache(loadAdminContext);

export async function getAdminContext(
  options: RequireAdminOptions = {}
): Promise<ActionResult<AdminContext>> {
  const rolesKey = options.roles ? [...options.roles].sort().join(",") : "*";

  return cachedLoadAdminContext(rolesKey, options.roles);
}

export async function requireAdmin(
  options: RequireAdminOptions = {}
): Promise<AdminContext> {
  const result = await getAdminContext(options);

  if (!result.ok) {
    redirect(adminLoginPath("/admin"));
  }

  return result.data;
}
