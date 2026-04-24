import { ListProgress, WordProgress, SessionResult, RekentoetsBlockResult, RekentoetsProgress } from "./types";
import { getInitialProgress } from "./leitner";
import { pushProgress, getToken } from "./sync";
import { syncWordProgress, syncListMeta, syncStreakDay } from "./supabase/sync";

const PROGRESS_KEY = "woordjes-leren-progress";
const SESSIONS_KEY = "woordjes-leren-sessions";

// Debounced server sync — max once per 5 seconds
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync() {
  if (typeof window === "undefined") return;
  if (!getToken()) return; // not logged in
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushProgress().catch(() => {});
    syncTimer = null;
  }, 5_000);
}

function getStorage(): Record<string, ListProgress> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveStorage(data: Record<string, ListProgress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  scheduleSync();
}

export function getListProgress(listId: string): ListProgress | null {
  const all = getStorage();
  return all[listId] ?? null;
}

export function getWordProgress(
  listId: string,
  wordId: string
): WordProgress | null {
  const list = getListProgress(listId);
  return list?.wordProgress[wordId] ?? null;
}

export function updateWordProgress(
  listId: string,
  wordProgress: WordProgress
) {
  const all = getStorage();
  if (!all[listId]) {
    all[listId] = {
      listId,
      wordProgress: {},
      lastPracticed: new Date().toISOString(),
      sessionsCompleted: 0,
    };
  }
  all[listId].wordProgress[wordProgress.wordId] = wordProgress;
  all[listId].lastPracticed = new Date().toISOString();

  // Track unique practice days
  const today = new Date().toISOString().slice(0, 10);
  const days = all[listId].practiceDays ?? [];
  if (!days.includes(today)) {
    all[listId].practiceDays = [...days, today];
  }

  // Track global streak
  trackGlobalPracticeDay(today);

  saveStorage(all);

  // Sync naar Supabase als ingelogd (fire-and-forget)
  syncWordProgress(listId, wordProgress);
  syncListMeta(listId, {
    practiceDays: all[listId].practiceDays,
    sessionsCompleted: all[listId].sessionsCompleted,
    lastPracticed: all[listId].lastPracticed,
  });
}

export function incrementSessionCount(listId: string) {
  const all = getStorage();
  if (all[listId]) {
    all[listId].sessionsCompleted++;
    saveStorage(all);
  }
}

export function saveSessionResult(result: SessionResult) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(SESSIONS_KEY);
  const sessions: SessionResult[] = raw ? JSON.parse(raw) : [];
  sessions.push(result);
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.splice(0, sessions.length - 100);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  scheduleSync();
}

export function getSessionHistory(listId?: string): SessionResult[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SESSIONS_KEY);
  const sessions: SessionResult[] = raw ? JSON.parse(raw) : [];
  if (listId) return sessions.filter((s) => s.listId === listId);
  return sessions;
}

export function getAllProgress(): Record<string, ListProgress> {
  return getStorage();
}

export function ensureWordProgress(
  listId: string,
  wordId: string
): WordProgress {
  const existing = getWordProgress(listId, wordId);
  if (existing) return existing;
  const initial = getInitialProgress(wordId, listId);
  updateWordProgress(listId, initial);
  return initial;
}

// ── Rekentoets progress ──────────────────────────────────────────

const REKEN_KEY = "woordjes-leren-rekentoets";

function getRekenStorage(): RekentoetsProgress {
  if (typeof window === "undefined")
    return { blockResults: {}, practiceDays: [] };
  const raw = localStorage.getItem(REKEN_KEY);
  return raw
    ? JSON.parse(raw)
    : { blockResults: {}, practiceDays: [] };
}

function saveRekenStorage(data: RekentoetsProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REKEN_KEY, JSON.stringify(data));
  scheduleSync();
}

export function saveRekentoetsResult(result: RekentoetsBlockResult) {
  const data = getRekenStorage();
  const key = String(result.block);
  if (!data.blockResults[key]) data.blockResults[key] = [];
  data.blockResults[key].push(result);
  // Keep last 10 per block
  if (data.blockResults[key].length > 10) {
    data.blockResults[key] = data.blockResults[key].slice(-10);
  }
  // Track practice day
  const today = new Date().toISOString().slice(0, 10);
  if (!data.practiceDays.includes(today)) {
    data.practiceDays.push(today);
  }
  saveRekenStorage(data);
}

export function getRekentoetsProgress(): RekentoetsProgress {
  return getRekenStorage();
}

// ─── Global streak tracking ────────────────────────────────────

const STREAK_KEY = "woordjes-leren-streak";

interface StreakData {
  days: string[]; // sorted ISO date strings of all practice days
}

function getStreakData(): StreakData {
  if (typeof window === "undefined") return { days: [] };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { days: [] };
    return JSON.parse(raw);
  } catch {
    return { days: [] };
  }
}

function saveStreakData(data: StreakData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

/** Record today as a practice day (called from saveWordProgress) */
export function trackGlobalPracticeDay(today?: string) {
  const day = today ?? new Date().toISOString().slice(0, 10);
  const data = getStreakData();
  if (!data.days.includes(day)) {
    data.days.push(day);
    data.days.sort();
    saveStreakData(data);
  }
  // Sync naar Supabase als ingelogd
  syncStreakDay(day);
}

/** Calculate current streak (consecutive days ending today or yesterday) */
export function getStreak(): { current: number; longest: number; todayDone: boolean } {
  const data = getStreakData();
  if (data.days.length === 0) return { current: 0, longest: 0, todayDone: false };

  const today = new Date().toISOString().slice(0, 10);
  const todayDone = data.days.includes(today);

  // Calculate current streak (counting backwards from today or yesterday)
  const sorted = [...data.days].sort().reverse();
  let current = 0;
  const startDate = todayDone ? today : yesterday(today);

  // Check if streak is still alive (practiced today or yesterday)
  if (!data.days.includes(startDate)) {
    // No practice today or yesterday = streak broken
    return { current: 0, longest: calcLongest(data.days), todayDone };
  }

  let checkDate = startDate;
  while (data.days.includes(checkDate)) {
    current++;
    checkDate = yesterday(checkDate);
  }

  return { current, longest: Math.max(current, calcLongest(data.days)), todayDone };
}

function yesterday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function calcLongest(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  return longest;
}
