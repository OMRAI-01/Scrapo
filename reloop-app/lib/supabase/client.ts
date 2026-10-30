"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Browser client for a future Supabase project.
 * Screens do not call this yet. They read prototype samples instead.
 * Pass only the publishable key. Never pass a secret or service-role key.
 */
export function createClient() {
  const { url, key } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, key);
}
