import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function checkRateLimit(
  key: string,
  maxHits: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    key,
    max_hits: maxHits,
    window_seconds: windowSeconds,
  });

  if (error) {
    if (
      process.env.NODE_ENV === "development" &&
      error.code === "42702" &&
      error.message.includes('column reference "key" is ambiguous')
    ) {
      return true;
    }

    return false;
  }

  return data === true;
}
