import { z } from "zod";

const supabaseUrlSchema = z
  .string()
  .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL")
  .refine(
    (value) => !value.includes("your-project-id"),
    "NEXT_PUBLIC_SUPABASE_URL must not use a placeholder value"
  )
  .transform((value) => new URL(value).origin);

const supabaseKeySchema = z
  .string()
  .min(20, "Supabase keys must not be empty or placeholder values")
  .refine(
    (value) => !value.toLowerCase().includes("placeholder"),
    "Supabase keys must not use placeholder values"
  );

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKeySchema,
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SECRET_KEY: supabaseKeySchema,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatEnvError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function parsePublicEnv(env: NodeJS.ProcessEnv): PublicEnv {
  const parsed = publicEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`Invalid public environment: ${formatEnvError(parsed.error)}`);
  }

  return parsed.data;
}

export const publicEnv = parsePublicEnv(process.env);
