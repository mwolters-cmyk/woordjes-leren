/**
 * Lichtgewicht sync-laag tussen localStorage en Supabase.
 *
 * Strategie voor MVP:
 *   - localStorage blijft single source-of-truth voor RUNTIME
 *     (synchroon, snel, geen await nodig in alle storage-calls)
 *   - Schrijfacties worden ook async naar Supabase geupload
 *   - Bij login op nieuw apparaat: pull eerst van Supabase naar
 *     localStorage (zie migrate.ts pull-mode, later toe te voegen)
 *
 * Voordeel: bestaande storage.ts hoeft NIET async te worden.
 * Nadeel: korte fout-window als sync naar Supabase faalt
 *         (lokaal goed, server out-of-date) — bij volgende login
 *         opnieuw te synchroniseren.
 */

import { getSupabaseBrowser, isSupabaseConfigured } from "./client";
import type { WordProgress } from "../types";

let cachedStudentId: string | null = null;

/** Set/clear current student ID (called by AuthProvider) */
export function setCurrentStudentId(studentId: string | null) {
  cachedStudentId = studentId;
}

export function getCurrentStudentId(): string | null {
  return cachedStudentId;
}

/**
 * Schrijf word_progress naar Supabase. Fire-and-forget — fouten worden
 * gelogd maar onderbreken de UI niet.
 */
export function syncWordProgress(listId: string, wp: WordProgress) {
  if (!isSupabaseConfigured() || !cachedStudentId) return;

  const supabase = getSupabaseBrowser();
  supabase
    .from("word_progress")
    .upsert(
      {
        student_id: cachedStudentId,
        list_id: listId,
        word_id: wp.wordId,
        box: wp.box,
        correct_count: wp.correctCount,
        incorrect_count: wp.incorrectCount,
        last_seen: wp.lastSeen,
        last_promoted_at: wp.lastPromotedAt ?? null,
      },
      { onConflict: "student_id,list_id,word_id" }
    )
    .then(({ error }) => {
      if (error) console.warn("syncWordProgress:", error.message);
    });
}

/**
 * Schrijf practice-day naar global streak. Fire-and-forget.
 * Zorgt dat de DATE niet dubbel in de array komt door eerst
 * te lezen en dan te updaten.
 */
export function syncStreakDay(today: string) {
  if (!isSupabaseConfigured() || !cachedStudentId) return;
  const studentId = cachedStudentId;
  const supabase = getSupabaseBrowser();

  // Lees huidige streak, voeg today toe als die er nog niet is
  supabase
    .from("student_streak")
    .select("practice_days")
    .eq("student_id", studentId)
    .maybeSingle()
    .then(({ data }) => {
      const existing = (data?.practice_days ?? []) as string[];
      if (existing.includes(today)) return;
      const updated = [...existing, today].sort();

      supabase
        .from("student_streak")
        .upsert(
          {
            student_id: studentId,
            practice_days: updated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        )
        .then(({ error }) => {
          if (error) console.warn("syncStreakDay:", error.message);
        });
    });
}

/**
 * Schrijf list-meta naar Supabase (sessions completed, practice days,
 * direction pref). Fire-and-forget.
 */
export function syncListMeta(
  listId: string,
  meta: {
    practiceDays?: string[];
    sessionsCompleted?: number;
    lastPracticed?: string;
    directionPref?: "vt-nl" | "nl-vt" | "mix" | null;
  }
) {
  if (!isSupabaseConfigured() || !cachedStudentId) return;

  const supabase = getSupabaseBrowser();
  supabase
    .from("list_progress_meta")
    .upsert(
      {
        student_id: cachedStudentId,
        list_id: listId,
        practice_days: meta.practiceDays ?? [],
        sessions_completed: meta.sessionsCompleted ?? 0,
        last_practiced: meta.lastPracticed ?? null,
        direction_pref: meta.directionPref ?? null,
      },
      { onConflict: "student_id,list_id" }
    )
    .then(({ error }) => {
      if (error) console.warn("syncListMeta:", error.message);
    });
}
