import type { User } from "@supabase/supabase-js";

export const adminRoles = ["admin", "reviewer"] as const;

export type AdminRole = (typeof adminRoles)[number];

export type AdminContext = {
  user: User;
  role: AdminRole;
  mustChangePassword: boolean;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const genericLoginError =
  "We could not sign you in. Check your details and try again.";

/** Result of a form action that reports a message; null before the first submit. */
export type MessageActionState = ActionResult<{ message: string }> | null;
