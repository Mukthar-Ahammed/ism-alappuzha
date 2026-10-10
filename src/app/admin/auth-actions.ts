"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { sanitizeAdminNext } from "@/lib/auth/redirect";
import {
  genericLoginError,
  type ActionResult,
  type AdminRole,
} from "@/lib/auth/types";
import { requireAdmin } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  next: z.string().optional(),
});

const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
  factorId: z.string().uuid(),
  next: z.string().optional(),
});

const nextSchema = z.object({
  next: z.string().optional(),
});

const factorSchema = z.object({
  factorId: z.string().uuid(),
});

export type LoginState = {
  error?: string;
};

export type SetupFactor = {
  factorId: string;
  qrSvg: string;
  secret: string;
};

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headerStore.get("x-real-ip") || "unknown";
}

async function isAllowlisted(email: string): Promise<AdminRole | null> {
  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("admins")
    .select("role")
    .ilike("email", email)
    .maybeSingle();

  return data?.role ?? null;
}

export async function signInAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: genericLoginError };
  }

  const email = parsed.data.email.toLowerCase();
  const clientIp = await getClientIp();
  const allowed = await checkRateLimit(
    `admin:login:${clientIp}:${email}`,
    5,
    15 * 60
  );

  if (!allowed) {
    return { error: genericLoginError };
  }

  const supabase = await createSupabaseServerClient();
  const signIn = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (signIn.error || !signIn.data.user.email) {
    return { error: genericLoginError };
  }

  const role = await isAllowlisted(signIn.data.user.email);

  if (!role) {
    await supabase.auth.signOut();
    return { error: genericLoginError };
  }

  const factors = await supabase.auth.mfa.listFactors();

  if (factors.error) {
    await supabase.auth.signOut();
    return { error: genericLoginError };
  }

  const next = encodeURIComponent(sanitizeAdminNext(parsed.data.next));

  if (factors.data.totp.length === 0) {
    redirect(`/admin/login/setup?next=${next}`);
  }

  redirect(`/admin/login/verify?next=${next}`);
}

export async function verifyTotpAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = codeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: genericLoginError };
  }

  const supabase = await createSupabaseServerClient();
  const user = await supabase.auth.getUser();

  if (user.error || !user.data.user) {
    return { error: genericLoginError };
  }

  const allowed = await checkRateLimit(
    `admin:verify:${user.data.user.id}`,
    5,
    10 * 60
  );

  if (!allowed) {
    return { error: genericLoginError };
  }

  const verified = await supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });

  if (verified.error) {
    return { error: genericLoginError };
  }

  redirect(sanitizeAdminNext(parsed.data.next));
}

export async function beginTotpSetupAction(): Promise<ActionResult<SetupFactor>> {
  const supabase = await createSupabaseServerClient();
  const user = await supabase.auth.getUser();

  if (user.error || !user.data.user?.email) {
    return { ok: false, error: genericLoginError };
  }

  const role = await isAllowlisted(user.data.user.email);

  if (!role) {
    await supabase.auth.signOut();
    return { ok: false, error: genericLoginError };
  }

  const factors = await supabase.auth.mfa.listFactors();

  if (!factors.error) {
    await Promise.all(
      factors.data.all
        .filter(
          (factor) =>
            factor.factor_type === "totp" && factor.status === "unverified"
        )
        .map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id }))
    );
  }

  const enrolled = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Google Authenticator",
  });

  if (enrolled.error) {
    return { ok: false, error: genericLoginError };
  }

  return {
    ok: true,
    data: {
      factorId: enrolled.data.id,
      qrSvg: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    },
  };
}

export async function confirmSetupAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  return verifyTotpAction(_state, formData);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function removeFactorAction(formData: FormData): Promise<void> {
  const parsed = factorSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/admin/security?error=remove");
  }

  const admin = await requireAdmin();
  const adminClient = createSupabaseAdminClient();
  const factors = await adminClient.auth.admin.mfa.listFactors({
    userId: admin.user.id,
  });

  if (factors.error) {
    redirect("/admin/security?error=remove");
  }

  const verifiedTotp = factors.data.factors.filter(
    (factor) => factor.factor_type === "totp" && factor.status === "verified"
  );

  if (verifiedTotp.length <= 1) {
    redirect("/admin/security?error=last-device");
  }

  const target = verifiedTotp.find((factor) => factor.id === parsed.data.factorId);

  if (!target) {
    redirect("/admin/security?error=remove");
  }

  await adminClient.auth.admin.mfa.deleteFactor({
    userId: admin.user.id,
    id: target.id,
  });

  redirect("/admin/security?removed=1");
}

export async function getSafeNextFromForm(
  formData: FormData
): Promise<string> {
  const parsed = nextSchema.safeParse(Object.fromEntries(formData));

  return sanitizeAdminNext(parsed.success ? parsed.data.next : undefined);
}
