import { RekentoetsProgress, RekentoetsBlockResult } from "./types";

export interface RekenBlockReadiness {
  block: number;
  score: number; // 0-100
  label: string;
  color: string;
  attempts: number;
  recentScores: number[]; // last 5 percentages
  mastered: boolean;
}

export interface RekenReadiness {
  totalScore: number; // 0-100
  label: string;
  color: string;
  blocks: RekenBlockReadiness[];
  practiceDays: number;
  advice: string;
}

const REQUIRED_ATTEMPTS = 3;
const MASTERY_THRESHOLD = 80; // % correct
const REQUIRED_PASSING = 3; // out of last 5

function calcBlockReadiness(
  results: RekentoetsBlockResult[] | undefined,
  block: number
): RekenBlockReadiness {
  if (!results || results.length === 0) {
    return {
      block,
      score: 0,
      label: "Nog niet geoefend",
      color: "#95a5a6",
      attempts: 0,
      recentScores: [],
      mastered: false,
    };
  }

  const recent = results.slice(-5);
  const recentScores = recent.map((r) => r.percentage);
  const passing = recentScores.filter((s) => s >= MASTERY_THRESHOLD).length;
  const uniqueDays = new Set(results.map((r) => r.date)).size;

  // Score based on: passing rate (60%) + multi-day spread (40%)
  const passRate = passing / REQUIRED_PASSING;
  const daySpread = Math.min(uniqueDays, 3) / 3;
  const rawScore = 0.6 * passRate + 0.4 * daySpread;
  const score = Math.round(Math.min(rawScore, 1) * 100);

  const mastered = passing >= REQUIRED_PASSING && uniqueDays >= 2;

  let label: string;
  let color: string;
  if (mastered) {
    label = "Beheerst!";
    color = "#27ae60";
  } else if (score >= 50) {
    label = "Bijna!";
    color = "#f1c40f";
  } else if (results.length > 0) {
    label = "Oefenen";
    color = "#e67e22";
  } else {
    label = "Nog niet geoefend";
    color = "#95a5a6";
  }

  return { block, score, label, color, attempts: results.length, recentScores, mastered };
}

export function calculateRekenReadiness(
  progress: RekentoetsProgress
): RekenReadiness {
  const blocks = [1, 2, 3, 4].map((b) =>
    calcBlockReadiness(progress.blockResults[String(b)], b)
  );

  const totalScore = Math.round(
    blocks.reduce((sum, b) => sum + b.score, 0) / 4
  );
  const practiceDays = progress.practiceDays?.length ?? 0;
  const masteredCount = blocks.filter((b) => b.mastered).length;

  let label: string;
  let color: string;
  if (masteredCount === 4) {
    label = "Rekentoets-klaar!";
    color = "#27ae60";
  } else if (totalScore >= 60) {
    label = "Bijna klaar";
    color = "#2980b9";
  } else if (totalScore > 0) {
    label = "Op weg";
    color = "#e67e22";
  } else {
    label = "Begin met oefenen";
    color = "#95a5a6";
  }

  // Generate advice
  const weakest = blocks
    .filter((b) => !b.mastered)
    .sort((a, b) => a.score - b.score);

  let advice: string;
  if (masteredCount === 4) {
    advice = "Je beheerst alle blokken!";
  } else if (weakest.length > 0 && weakest[0].attempts === 0) {
    advice = `Blok ${weakest[0].block} nog niet geoefend`;
  } else if (practiceDays < 2) {
    advice = "Oefen op meerdere dagen voor beter resultaat";
  } else if (weakest.length > 0) {
    advice = `Blok ${weakest[0].block} heeft extra oefening nodig`;
  } else {
    advice = "Blijf oefenen!";
  }

  return { totalScore, label, color, blocks, practiceDays, advice };
}
