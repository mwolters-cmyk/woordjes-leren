/**
 * Supabase clients voor server-omgeving (Next.js Route Handlers,
 * Server Components, Server Actions).
 *
 * Twee varianten:
 *   - getSupabaseServer(): respecteert RLS, leest auth uit cookies
 *   - getSupabaseAdmin():  service role key, BYPASS RLS, alleen
 *                          gebruiken voor admin-acties (bv. migratie)
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side client met cookie-gebaseerde auth.
 * Respecteert RLS-policies (gebruikt anon key + JWT uit cookie).
 */
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreekt"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component context — set wordt elders gehandled
        }
      },
    },
  });
}

/**
 * Admin client met service role key — BYPASS RLS.
 *
 * ⚠️ Alleen gebruiken voor:
 *  - Eerste-keer-migraties (bulk localStorage import)
 *  - Cron jobs / system tasks
 *  - Server Actions die expliciet admin-rechten nodig hebben
 *
 * NOOIT vanuit Route Handlers die door clients aangeroepen kunnen
 * worden zonder server-side authenticatie-check.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt"
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
