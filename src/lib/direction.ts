// Exercise direction: which language is the question, which is the answer?
// "vt-nl" = foreign → Dutch (default, term is question)
// "nl-vt" = Dutch → foreign (definition is question, term is answer)
// "mix"   = random per word

import { Word } from "./types";

export type Direction = "vt-nl" | "nl-vt" | "mix";

// Languages that support direction choice (modern languages only)
export const DIRECTION_LANGUAGES = ["fr", "en", "de"] as const;

export function supportsDirection(langFrom: string): boolean {
  return (DIRECTION_LANGUAGES as readonly string[]).includes(langFrom);
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  "vt-nl": "Vreemde taal → Nederlands",
  "nl-vt": "Nederlands → Vreemde taal",
  "mix": "Gemengd",
};

export const DIRECTION_SHORT: Record<Direction, string> = {
  "vt-nl": "VT → NL",
  "nl-vt": "NL → VT",
  "mix": "Mix",
};

/** Apply direction to a single word: returns [question, answer] */
export function applyDirection(word: Word, direction: Direction): { question: string; answer: string } {
  if (direction === "nl-vt") {
    return { question: word.definition, answer: word.term };
  }
  if (direction === "mix") {
    const reverse = Math.random() < 0.5;
    return reverse
      ? { question: word.definition, answer: word.term }
      : { question: word.term, answer: word.definition };
  }
  // default: vt-nl
  return { question: word.term, answer: word.definition };
}

/**
 * Apply direction to an array of words by swapping term/definition.
 * For "mix", each word is randomly assigned a direction once (stable per session).
 * Returns new Word[] objects — all exercise code that uses word.term/word.definition
 * will automatically work in the correct direction without any other changes.
 */
export function applyDirectionToWords(words: Word[], direction: Direction): Word[] {
  if (direction === "vt-nl") return words;
  return words.map((w) => {
    const reverse = direction === "nl-vt" || (direction === "mix" && Math.random() < 0.5);
    if (reverse) {
      return { ...w, term: w.definition, definition: w.term };
    }
    return w;
  });
}

/** Parse direction from URL search params */
export function parseDirection(param: string | null): Direction {
  if (param === "nl-vt" || param === "mix") return param;
  return "vt-nl";
}
