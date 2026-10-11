import { z } from "zod";
import { adminRoles } from "@/lib/auth/types";

export const adminEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const addAdminSchema = z.object({
  email: adminEmailSchema,
  role: z.enum(adminRoles),
});

export const targetAdminSchema = z.object({
  email: adminEmailSchema,
});

export const changeRoleSchema = targetAdminSchema.extend({
  role: z.enum(adminRoles),
});

export const confirmedTargetAdminSchema = targetAdminSchema.extend({
  confirm: z.string().trim(),
});

export const ownPasswordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string().min(12, "Confirm the new password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
