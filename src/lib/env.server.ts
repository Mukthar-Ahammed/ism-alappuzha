import "server-only";

import { serverEnvSchema, type ServerEnv } from "@/lib/env";

function formatServerEnvError(error: Error): string {
  return error.message.replace("Invalid input: ", "");
}

export function parseServerEnv(env: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${formatServerEnvError(parsed.error)}`
    );
  }

  return parsed.data;
}

export const serverEnv = parseServerEnv(process.env);
