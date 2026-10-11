import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TeamMember } from "@/features/team/types";

type AdminRow = {
  email: string;
  role: "admin" | "reviewer";
  created_at: string;
};

async function listAuthUsers(): Promise<User[]> {
  const supabase = createSupabaseAdminClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });

    if (result.error) {
      return users;
    }

    users.push(...result.data.users);

    if (result.data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await listAuthUsers();

  return (
    users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ??
    null
  );
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const supabase = createSupabaseAdminClient();
  const [{ data: admins, error }, users] = await Promise.all([
    supabase
      .from("admins")
      .select("email, role, created_at")
      .order("created_at", { ascending: true }),
    listAuthUsers(),
  ]);

  if (error || !admins) {
    return [];
  }

  const usersByEmail = new Map(
    users
      .filter((user) => Boolean(user.email))
      .map((user) => [user.email?.trim().toLowerCase() ?? "", user])
  );

  return Promise.all(
    (admins satisfies AdminRow[]).map(async (admin) => {
      const user = usersByEmail.get(admin.email.trim().toLowerCase()) ?? null;
      const factors =
        user === null
          ? null
          : await supabase.auth.admin.mfa.listFactors({ userId: user.id });
      const verifiedTotp =
        factors?.error || !factors?.data
          ? []
          : factors.data.factors.filter(
              (factor) =>
                factor.factor_type === "totp" && factor.status === "verified"
            );

      return {
        email: admin.email,
        role: admin.role,
        createdAt: admin.created_at,
        userId: user?.id ?? null,
        hasVerifiedAuthenticator: verifiedTotp.length > 0,
        verifiedAuthenticatorCount: verifiedTotp.length,
      };
    })
  );
}
