import { LeitnerBox, WordProgress, ListProgress, Word } from "./types";

// How many days before a word comes back per box
const BOX_INTERVALS: Record<LeitnerBox, number> = {
  1: 0, // Always practice
  2: 1, // After 1 day
  3: 3, // After 3 days
  4: 7, // After 7 days
  5: 14, // After 14 days (review)
};

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
  };
}

export function promoteWord(progress: WordProgress): WordProgress {
  const newBox = Math.min(progress.box + 1, 5) as LeitnerBox;
  return {
    ...progress,
    box: newBox,
    lastSeen: new Date().toISOString(),
    correctCount: progress.correctCount + 1,
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
  const interval = BOX_INTERVALS[progress.box];
  if (interval === 0) return true;

  const lastSeen = new Date(progress.lastSeen);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSince >= interval;
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

  // Shuffle new words too
  return shuffle([...dueWords, ...shuffle(newWords)].slice(0, maxWords));
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
