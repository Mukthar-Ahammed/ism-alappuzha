import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { withAuthCookieOptions } from "@/lib/auth/session-policy";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, withAuthCookieOptions(options));
            });
          } catch {
            // Server Components cannot set cookies; Server Actions and routes can.
          }
        },
      },
    }
  );
}

export const getSupabaseServerClient = createSupabaseServerClient;
