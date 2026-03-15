import { ListProgress, WordProgress, SessionResult } from "./types";
import { getInitialProgress } from "./leitner";
import { pushProgress, getToken } from "./sync";

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

  saveStorage(all);
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
