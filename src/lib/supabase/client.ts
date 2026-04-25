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

import { createClient } from "@supabase/supabase-js";
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

  // Gebruik standaard createClient (niet @supabase/ssr) voor browser:
  // - Onze app heeft geen OAuth/PKCE-flow nodig (alleen username+password)
  // - localStorage-gebaseerde sessie ipv cookies — werkt direct in client
  //   components zonder server-cookie-roundtrip
  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "overhoorme-auth",
    },
  });
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
