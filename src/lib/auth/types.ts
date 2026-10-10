import type { User } from "@supabase/supabase-js";

export const adminRoles = ["admin", "reviewer"] as const;

export type AdminRole = (typeof adminRoles)[number];

export type AdminContext = {
  user: User;
  role: AdminRole;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const genericLoginError =
  "We could not sign you in. Check your details and try again.";
