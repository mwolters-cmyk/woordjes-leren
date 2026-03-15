// Smart distractor selection for multiple choice questions.
// Instead of purely random wrong answers, pick distractors that are
// plausible — same word type, similar length, same article pattern.

import { Word } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Classify a definition/term by its "shape" for smarter matching
type WordShape = "noun-de" | "noun-het" | "noun-other" | "verb" | "adjective" | "phrase" | "other";

function classifyDutch(s: string): WordShape {
  const lower = s.toLowerCase().trim();
  if (lower.startsWith("de ")) return "noun-de";
  if (lower.startsWith("het ")) return "noun-het";
  if (lower.startsWith("een ")) return "noun-other";
  // Verbs often end in -en or start with (zich)
  if (lower.startsWith("zich ") || lower.endsWith("en") && lower.length > 4 && !lower.includes(" ")) return "verb";
  // Adjectives: short, no articles, no spaces
  if (!lower.includes(" ") && lower.length <= 12) return "adjective";
  if (lower.includes(" ")) return "phrase";
  return "other";
}

function classifyGerman(s: string): WordShape {
  const lower = s.toLowerCase().trim();
  if (lower.startsWith("der ") || lower.startsWith("die ") || lower.startsWith("das ")) return "noun-de"; // reuse tag
  if (lower.startsWith("sich ") || (lower.endsWith("en") && lower.length > 4 && !lower.includes(" "))) return "verb";
  if (!lower.includes(" ") && lower.length <= 12) return "adjective";
  if (lower.includes(" ")) return "phrase";
  return "other";
}

function classify(s: string): WordShape {
  // Detect language by common patterns — works for both term and definition
  if (/^(der|die|das|ein|eine|sich)\s/i.test(s)) return classifyGerman(s);
  return classifyDutch(s);
}

// Score how similar two definitions are (higher = more similar = better distractor)
function similarityScore(target: string, candidate: string): number {
  let score = 0;

  const tShape = classify(target);
  const cShape = classify(candidate);

  // Same word shape: big bonus
  if (tShape === cShape) score += 10;
  // Both nouns (even if different article): bonus
  else if (tShape.startsWith("noun") && cShape.startsWith("noun")) score += 5;

  // Similar length: bonus (shorter distance = higher score)
  const lenDiff = Math.abs(target.length - candidate.length);
  score += Math.max(0, 8 - lenDiff);

  // Same first letter: small bonus (creates confusion)
  if (target[0]?.toLowerCase() === candidate[0]?.toLowerCase()) score += 3;

  // Both have comma-separated alternatives: bonus
  if (target.includes(",") && candidate.includes(",")) score += 2;

  // Small random factor to avoid always picking the same distractors
  score += Math.random() * 4;

  return score;
}

/**
 * Pick smart distractors for a multiple choice question.
 * Returns shuffled array of [correct, ...distractors].
 */
export function getSmartOptions(
  currentWord: Word,
  allWords: Word[],
  count: number = 4
): string[] {
  const correct = currentWord.definition;
  const candidates = allWords
    .filter((w) => w.id !== currentWord.id && w.definition !== correct)
    .map((w) => ({ def: w.definition, score: similarityScore(correct, w.definition) }));

  // Sort by score descending, pick top candidates
  candidates.sort((a, b) => b.score - a.score);

  // Take from top pool (with some randomness already baked into score)
  const distractors = candidates
    .slice(0, count - 1)
    .map((c) => c.def);

  // Ensure we have enough (fallback to random if list is tiny)
  while (distractors.length < count - 1 && candidates.length > distractors.length) {
    const next = candidates[distractors.length];
    if (next) distractors.push(next.def);
  }

  return shuffle([correct, ...distractors]);
}
