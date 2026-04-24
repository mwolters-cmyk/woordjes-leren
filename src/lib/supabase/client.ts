/**
 * Supabase client voor browser-omgeving.
 *
 * Gebruikt de anonieme key (mag client-side bekend zijn).
 * RLS-policies zorgen voor data-isolatie per gebruiker.
 *
 * Gebruik:
 *   const supabase = getSupabaseBrowser();
 *   const { data, error } = await supabase.from('students').select();
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreekt in .env.local"
    );
  }

  cached = createBrowserClient(url, anonKey);
  return cached;
}

/**
 * Check of Supabase geconfigureerd is. Handig voor graceful
 * fallback naar localStorage als er nog geen credentials zijn.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
