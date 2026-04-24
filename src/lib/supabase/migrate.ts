/**
 * Eenmalige migratie van localStorage-voortgang naar Supabase.
 *
 * Wanneer aangeroepen:
 *   - Direct na succesvolle login of register
 *   - Idempotent: kijkt eerst of er al data in Supabase zit; zo ja,
 *     skipt het en flagt de migratie als gedaan
 *   - Lokale localStorage blijft staan als fallback / mirror
 *
 * Wat wordt gemigreerd:
 *   - word_progress (per (list, word))
 *   - list meta (practice_days, sessions_completed, direction_pref)
 *   - global streak (practice_days)
 */

import { getSupabaseBrowser } from "./client";
import type { ListProgress } from "../types";

const STORAGE_KEY = "woordjes-leren-progress";
const STREAK_KEY = "woordjes-leren-streak";
const MIGRATION_DONE_KEY = "woordjes-leren-migrated-to-supabase";

interface MigrationResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  wordsUploaded?: number;
  listsUploaded?: number;
}

export async function migrateLocalStorageToSupabase(
  studentId: string
): Promise<MigrationResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Client-only" };
  }

  // Al gemigreerd?
  if (localStorage.getItem(MIGRATION_DONE_KEY)) {
    return { ok: true, skipped: true };
  }

  const supabase = getSupabaseBrowser();

  // Check: is er al server-data? Zo ja, lokaal flaggen en exit.
  const { count, error: countErr } = await supabase
    .from("word_progress")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId);

  if (countErr) {
    return { ok: false, error: countErr.message };
  }

  if ((count ?? 0) > 0) {
    // User heeft al server-data — niet overschrijven met localStorage
    localStorage.setItem(MIGRATION_DONE_KEY, new Date().toISOString());
    return { ok: true, skipped: true };
  }

  // Lees lokale data
  const progressRaw = localStorage.getItem(STORAGE_KEY);
  const streakRaw = localStorage.getItem(STREAK_KEY);

  if (!progressRaw && !streakRaw) {
    localStorage.setItem(MIGRATION_DONE_KEY, new Date().toISOString());
    return { ok: true, skipped: true };
  }

  let wordsUploaded = 0;
  let listsUploaded = 0;

  // Migrate word progress per lijst
  if (progressRaw) {
    try {
      const allLists = JSON.parse(progressRaw) as Record<string, ListProgress>;

      for (const [listId, lp] of Object.entries(allLists)) {
        // Words
        const wordRows = Object.values(lp.wordProgress).map((wp) => ({
          student_id: studentId,
          list_id: listId,
          word_id: wp.wordId,
          box: wp.box,
          correct_count: wp.correctCount,
          incorrect_count: wp.incorrectCount,
          last_seen: wp.lastSeen,
          last_promoted_at: wp.lastPromotedAt ?? null,
        }));

        if (wordRows.length > 0) {
          const { error: wordErr } = await supabase
            .from("word_progress")
            .upsert(wordRows, { onConflict: "student_id,list_id,word_id" });
          if (wordErr) {
            return { ok: false, error: `word_progress: ${wordErr.message}` };
          }
          wordsUploaded += wordRows.length;
        }

        // List meta
        const { error: metaErr } = await supabase
          .from("list_progress_meta")
          .upsert({
            student_id: studentId,
            list_id: listId,
            practice_days: lp.practiceDays ?? [],
            sessions_completed: lp.sessionsCompleted ?? 0,
            last_practiced: lp.lastPracticed ?? null,
            direction_pref: null, // niet uit oude localStorage te halen
          }, { onConflict: "student_id,list_id" });

        if (metaErr) {
          return { ok: false, error: `list_meta: ${metaErr.message}` };
        }
        listsUploaded++;
      }
    } catch (e) {
      return {
        ok: false,
        error: `progress parse: ${e instanceof Error ? e.message : "?"}`,
      };
    }
  }

  // Migrate streak
  if (streakRaw) {
    try {
      const streak = JSON.parse(streakRaw) as { days: string[] };
      if (streak.days?.length > 0) {
        const { error: streakErr } = await supabase
          .from("student_streak")
          .upsert({
            student_id: studentId,
            practice_days: streak.days,
            updated_at: new Date().toISOString(),
          }, { onConflict: "student_id" });
        if (streakErr) {
          return { ok: false, error: `streak: ${streakErr.message}` };
        }
      }
    } catch {
      // Streak parse fail is niet kritiek
    }
  }

  localStorage.setItem(MIGRATION_DONE_KEY, new Date().toISOString());
  return { ok: true, wordsUploaded, listsUploaded };
}

/** Reset migration flag — voor debugging / re-import */
export function resetMigrationFlag() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MIGRATION_DONE_KEY);
}
