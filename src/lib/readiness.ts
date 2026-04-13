import { Word, ListProgress } from "./types";

export type ReadinessLevel =
  | "niet_klaar"
  | "begin"
  | "bijna"
  | "goed"
  | "klaar";

export interface ReadinessResult {
  score: number; // 0-100
  level: ReadinessLevel;
  label: string;
  color: string;
  advice: string;
  // Sub-scores for transparency
  boxScore: number; // 0-1
  coverageScore: number; // 0-1
  accuracyScore: number; // 0-1
  practiceDays: number;
}

const LEVEL_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; min: number }
> = {
  niet_klaar: { label: "Nog niet klaar", color: "#e74c3c", min: 0 },
  begin: { label: "Je bent op weg", color: "#e67e22", min: 26 },
  bijna: { label: "Bijna klaar!", color: "#f1c40f", min: 51 },
  goed: { label: "Goed voorbereid", color: "#2980b9", min: 76 },
  klaar: { label: "Toetsklaar!", color: "#27ae60", min: 90 },
};

function getLevel(score: number): ReadinessLevel {
  if (score >= 90) return "klaar";
  if (score >= 76) return "goed";
  if (score >= 51) return "bijna";
  if (score >= 26) return "begin";
  return "niet_klaar";
}

export function calculateReadiness(
  words: Word[],
  listProgress: ListProgress | null
): ReadinessResult {
  const totalWords = words.length;

  if (!listProgress || totalWords === 0) {
    return {
      score: 0,
      level: "niet_klaar",
      label: LEVEL_CONFIG.niet_klaar.label,
      color: LEVEL_CONFIG.niet_klaar.color,
      advice: "Begin met oefenen!",
      boxScore: 0,
      coverageScore: 0,
      accuracyScore: 0,
      practiceDays: 0,
    };
  }

  // 1. Box score (50%) — weighted average of box positions
  let boxSum = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    if (wp) {
      boxSum += wp.box;
    }
  }
  const boxScore = boxSum / (totalWords * 5);

  // 2. Coverage (25%) — what percentage of words has been practiced at least once?
  let practiced = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    if (wp) practiced++;
  }
  const coverageScore = practiced / totalWords;

  // 3. Accuracy (25%) — of practiced words, what fraction is correct more than incorrect?
  let accurate = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    if (wp && wp.correctCount > wp.incorrectCount) {
      accurate++;
    }
  }
  const accuracyScore = practiced > 0 ? accurate / practiced : 0;

  // Combined score
  const rawScore = 0.50 * boxScore + 0.25 * coverageScore + 0.25 * accuracyScore;
  const score = Math.round(rawScore * 100);
  const level = getLevel(score);
  const config = LEVEL_CONFIG[level];

  const advice = generateAdvice(boxScore, coverageScore, accuracyScore, totalWords, practiced);

  return {
    score,
    level,
    label: config.label,
    color: config.color,
    advice,
    boxScore,
    coverageScore,
    accuracyScore,
    practiceDays: listProgress.practiceDays?.length ?? 0,
  };
}

function generateAdvice(
  boxScore: number,
  coverageScore: number,
  accuracyScore: number,
  totalWords: number,
  practiced: number,
): string {
  if (practiced === 0) {
    return "Begin met oefenen!";
  }

  const remaining = totalWords - practiced;

  if (coverageScore < 0.5) {
    return `Nog ${remaining} woorden niet geoefend`;
  }

  if (boxScore < 0.4) {
    return "Oefen je rode en oranje woorden extra";
  }

  if (accuracyScore < 0.6) {
    return "Veel fouten — oefen rustig verder";
  }

  if (coverageScore < 1) {
    return `Nog ${remaining} woorden te gaan`;
  }

  if (boxScore > 0.8 && accuracyScore > 0.8) {
    return "Je bent goed voorbereid!";
  }

  return "Blijf oefenen, je bent op de goede weg!";
}
