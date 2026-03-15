import { Word, ListProgress } from "./types";
import { isDueForReview, BOX_INTERVALS } from "./leitner";

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
  daySpread: number; // 0-1
  retentionScore: number; // 0-1
  practiceDays: number;
}

const TARGET_CORRECT_DAYS = 3;

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
      daySpread: 0,
      retentionScore: 0,
      practiceDays: 0,
    };
  }

  // 1. Box score (40%) — weighted average of box positions
  let boxSum = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    if (wp) {
      boxSum += wp.box;
    }
    // new words contribute 0
  }
  const boxScore = boxSum / (totalWords * 5);

  // 2. Day spread (35%) — how many distinct days each word was correct
  let daySpreadSum = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    const days = wp?.correctDays?.length ?? 0;
    daySpreadSum += Math.min(days, TARGET_CORRECT_DAYS) / TARGET_CORRECT_DAYS;
  }
  const daySpread = daySpreadSum / totalWords;

  // 3. Retention score (25%) — of words in box 3+, how many are NOT overdue?
  let inBox3Plus = 0;
  let notOverdue = 0;
  for (const word of words) {
    const wp = listProgress.wordProgress[word.id];
    if (wp && wp.box >= 3) {
      inBox3Plus++;
      if (!isDueForReview(wp)) {
        notOverdue++;
      }
    }
  }
  const retentionScore = inBox3Plus > 0 ? notOverdue / inBox3Plus : 0;

  // Combined score
  const rawScore = 0.4 * boxScore + 0.35 * daySpread + 0.25 * retentionScore;
  const score = Math.round(rawScore * 100);
  const level = getLevel(score);
  const config = LEVEL_CONFIG[level];

  // Generate advice based on weakest factor
  const advice = generateAdvice(boxScore, daySpread, retentionScore, listProgress);

  return {
    score,
    level,
    label: config.label,
    color: config.color,
    advice,
    boxScore,
    daySpread,
    retentionScore,
    practiceDays: listProgress.practiceDays?.length ?? 0,
  };
}

function generateAdvice(
  boxScore: number,
  daySpread: number,
  retentionScore: number,
  listProgress: ListProgress
): string {
  const practiceDays = listProgress.practiceDays?.length ?? 0;

  // Find the weakest factor
  const min = Math.min(boxScore, daySpread, retentionScore);

  if (boxScore === 0 && daySpread === 0) {
    return "Begin met oefenen!";
  }

  if (min === daySpread && practiceDays < TARGET_CORRECT_DAYS) {
    const remaining = TARGET_CORRECT_DAYS - practiceDays;
    return `Oefen nog op ${remaining} andere dag${remaining === 1 ? "" : "en"}`;
  }

  if (min === boxScore) {
    return "Oefen je rode en oranje woorden extra";
  }

  if (min === retentionScore) {
    return "Herhaal je geleerde woorden";
  }

  // All good
  if (boxScore > 0.8 && daySpread > 0.8) {
    return "Je bent goed voorbereid!";
  }

  return "Blijf oefenen, je bent op de goede weg!";
}
