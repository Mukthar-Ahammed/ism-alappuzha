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
    // Fails closed: a broken check refuses the attempt. Logged so it is never mistaken
    // for a wrong password (supabase/fix-rate-limit-combined.sql repairs error 42702).
    console.error("[rate-limit] check_rate_limit RPC failed:", error.code, error.message);
    return false;
  }

  return data === true;
}
