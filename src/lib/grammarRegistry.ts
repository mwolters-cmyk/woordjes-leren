// Central registry for grammar exercise generators
// Maps list IDs to their generator modules

import * as deutsch from "./grammarDeutsch";
import * as grieks from "./grammarGrieks";
import type { GrammarGenerator } from "./grammarTypes";

const GENERATORS: Record<string, GrammarGenerator> = {
  "k3-m3-de-gram-k46": deutsch,
  "k3-m3-gr-gram-t20": grieks,
};

/** Check if a list uses generated grammar exercises */
export function hasGrammarGenerator(listId: string): boolean {
  return listId in GENERATORS;
}

/** Get the grammar generator for a list */
export function getGrammarGenerator(listId: string): GrammarGenerator | null {
  return GENERATORS[listId] ?? null;
}

/** Get concepts as pseudo-Word objects for a grammar list */
export function getGrammarConceptsAsWords(listId: string) {
  const gen = GENERATORS[listId];
  return gen ? gen.getConceptsAsWords() : [];
}
