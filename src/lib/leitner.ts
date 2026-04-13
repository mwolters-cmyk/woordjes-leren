import { LeitnerBox, WordProgress, ListProgress, Word } from "./types";

// Minutes to wait before a word comes back per box.
// Short cooldowns so students cycle through ALL words, not just the same 20.
// Box 1 = always due, higher boxes = brief cooldown after correct answer.
const BOX_COOLDOWN_MINUTES: Record<LeitnerBox, number> = {
  1: 0,    // incorrect/new: always practice
  2: 3,    // just got it right once: back in 3 min
  3: 10,   // got it right twice: back in 10 min
  4: 30,   // solid: back in 30 min
  5: 60,   // mastered: back in 1 hour
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addCorrectDay(days: string[] | undefined): string[] {
  const today = todayString();
  const existing = days ?? [];
  if (existing.includes(today)) return existing;
  return [...existing, today];
}

/** Check if promotion cooldown has passed — always allowed now */
function canPromote(_progress: WordProgress): boolean {
  return true;
}

export function getInitialProgress(
  wordId: string,
  listId: string
): WordProgress {
  return {
    wordId,
    listId,
    box: 1,
    lastSeen: new Date().toISOString(),
    correctCount: 0,
    incorrectCount: 0,
    correctDays: [],
    lastPromotedAt: undefined,
  };
}

export function promoteWord(progress: WordProgress): WordProgress {
  const now = new Date().toISOString();
  const promoted = canPromote(progress);
  const newBox = promoted
    ? (Math.min(progress.box + 1, 5) as LeitnerBox)
    : progress.box;

  return {
    ...progress,
    box: newBox,
    lastSeen: now,
    correctCount: progress.correctCount + 1,
    correctDays: addCorrectDay(progress.correctDays),
    lastPromotedAt: promoted && newBox !== progress.box ? now : progress.lastPromotedAt,
  };
}

export function demoteWord(progress: WordProgress): WordProgress {
  return {
    ...progress,
    box: 1,
    lastSeen: new Date().toISOString(),
    incorrectCount: progress.incorrectCount + 1,
  };
}

export function isDueForReview(progress: WordProgress): boolean {
  const cooldown = BOX_COOLDOWN_MINUTES[progress.box];
  if (cooldown === 0) return true;

  const lastSeen = new Date(progress.lastSeen);
  const now = new Date();
  const minutesSince = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

  return minutesSince >= cooldown;
}

export function getWordsForSession(
  words: Word[],
  listProgress: ListProgress | null,
  maxWords: number = 20
): Word[] {
  if (!listProgress) {
    // First time: shuffle and take first batch
    return shuffle(words).slice(0, maxWords);
  }

  // Priority: due words first, then new words
  const dueWords: Word[] = [];
  const newWords: Word[] = [];

  for (const word of words) {
    const progress = listProgress.wordProgress[word.id];
    if (!progress) {
      newWords.push(word);
    } else if (isDueForReview(progress)) {
      dueWords.push(word);
    }
  }

  // Sort due words by box (lowest first = most urgent), then shuffle within same box
  dueWords.sort((a, b) => {
    const boxA = listProgress.wordProgress[a.id]?.box ?? 1;
    const boxB = listProgress.wordProgress[b.id]?.box ?? 1;
    return boxA - boxB || Math.random() - 0.5;
  });

  // Always mix in some new words if available (at least 5 or fill remaining slots)
  const shuffledNew = shuffle(newWords);
  const minNew = Math.min(5, shuffledNew.length);
  const dueSlots = maxWords - minNew;
  const selectedDue = dueWords.slice(0, dueSlots);
  const remainingSlots = maxWords - selectedDue.length;
  const selectedNew = shuffledNew.slice(0, remainingSlots);

  return shuffle([...selectedDue, ...selectedNew]);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getListStats(words: Word[], listProgress: ListProgress | null) {
  if (!listProgress) {
    return { total: words.length, learned: 0, inProgress: 0, new: words.length, percentage: 0 };
  }

  let learned = 0;
  let inProgress = 0;
  let newCount = 0;

  for (const word of words) {
    const progress = listProgress.wordProgress[word.id];
    if (!progress) {
      newCount++;
    } else if (progress.box >= 4) {
      learned++;
    } else {
      inProgress++;
    }
  }

  const percentage = words.length > 0 ? Math.round((learned / words.length) * 100) : 0;

  return { total: words.length, learned, inProgress, new: newCount, percentage };
}

export function getBoxDistribution(
  words: Word[],
  listProgress: ListProgress | null
): Record<LeitnerBox | 0, number> {
  const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const word of words) {
    const progress = listProgress?.wordProgress[word.id];
    if (!progress) {
      dist[0]++; // "new" = box 0
    } else {
      dist[progress.box]++;
    }
  }

  return dist as Record<LeitnerBox | 0, number>;
}

// Legacy export for readiness.ts (intervals in days, kept for score calculation)
const BOX_INTERVALS: Record<LeitnerBox, number> = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
};
export { BOX_INTERVALS };
