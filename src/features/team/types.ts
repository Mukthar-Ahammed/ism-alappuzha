import type { AdminRole } from "@/lib/auth/types";

export type TeamMember = {
  email: string;
  role: AdminRole;
  createdAt: string;
  userId: string | null;
  hasVerifiedAuthenticator: boolean;
  verifiedAuthenticatorCount: number;
};

export type TeamActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  temporaryPassword?: string;
  targetEmail?: string;
};
