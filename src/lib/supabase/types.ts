/**
 * Database types die overeenkomen met supabase/schema.sql.
 *
 * Later: vervang deze handgeschreven types door auto-generated
 * types via `npx supabase gen types typescript --project-id <ref>
 * > src/lib/supabase/database.types.ts`
 *
 * Voor nu houden we het simpel en handgeschreven.
 */

export interface Student {
  id: string;
  username: string;
  voornaam: string | null;
  klas: string | null;
  jaarlaag: number | null;
  credits_cents: number;
  created_at: string;
  last_login_at: string;
}

export interface BalanceTransaction {
  id: string;
  student_id: string;
  delta_cents: number;
  reason:
    | "tikkie"
    | "mondeling-sessie"
    | "admin-correctie"
    | "welcome-bonus"
    | string;
  description: string | null;
  external_ref: string | null;
  created_at: string;
  created_by: string | null;
}

export interface WordProgressRow {
  student_id: string;
  list_id: string;
  word_id: string;
  box: 1 | 2 | 3 | 4 | 5;
  correct_count: number;
  incorrect_count: number;
  last_seen: string;
  last_promoted_at: string | null;
}

export interface ListProgressMetaRow {
  student_id: string;
  list_id: string;
  practice_days: string[]; // ISO date[]
  sessions_completed: number;
  last_practiced: string | null;
  direction_pref: "vt-nl" | "nl-vt" | "mix" | null;
}

export interface StudentStreakRow {
  student_id: string;
  practice_days: string[]; // ISO date[]
  updated_at: string;
}

export interface MondelingSession {
  id: string;
  student_id: string;
  boek_slug: string;
  niveau: string | null;
  started_at: string;
  finished_at: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  feedback: string | null;
  cost_eur: number;
}

/**
 * Sign-up metadata die we meegeven bij `auth.signUp()`.
 * Wordt door de `handle_new_user`-trigger gelezen om de
 * student-row te vullen.
 */
export interface SignUpMetadata {
  username: string;
  voornaam?: string;
  klas?: string;
  jaarlaag?: number;
}
