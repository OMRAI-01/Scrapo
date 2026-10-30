import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Server client for a future Supabase project.
 * Not used by the prototype screens. Wire it from a Server Component
 * or a Route Handler when queries replace the files in lib/mock.
 * Store roles in app_metadata. Do not trust user_metadata for access checks.
 */
export async function createClient() {
  const { url, key } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. Middleware/proxy can refresh the session later.
        }
      },
    },
  });
}
