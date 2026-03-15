// Central registry for grammar exercise generators
// Maps list IDs to their generator modules

import * as deutsch from "./grammarDeutsch";
import * as grieks from "./grammarGrieks";
import type { GrammarGenerator } from "./grammarTypes";

const GENERATORS: Record<string, GrammarGenerator> = {
  "k3-m3-de-gram-k46": deutsch,
  "k3-m3-gr-gram-t20": grieks,
};

// ── Auto-register bovenbouw grammar aggregates ──────────────
// For each language that has grammar generators in onderbouw,
// register a bb-{lang}-gram alias so the bovenbouw grammar
// exercise page works with the same generator(s).
// When a new grammar generator is added for a language, the
// bovenbouw version automatically picks it up.
(function registerBovenbouwGrammar() {
  const byLang: Record<string, GrammarGenerator[]> = {};
  for (const [id, gen] of Object.entries(GENERATORS)) {
    if (id.startsWith("bb-")) continue;
    const lang = id.split("-")[2]; // "k3-m3-de-gram-k46" → "de"
    if (!byLang[lang]) byLang[lang] = [];
    byLang[lang].push(gen);
  }
  for (const [lang, gens] of Object.entries(byLang)) {
    if (gens.length === 1) {
      // Single generator: alias directly
      GENERATORS[`bb-${lang}-gram`] = gens[0];
    }
    // TODO: when multiple generators exist for one language,
    // build a combined generator that merges blocks/concepts
  }
})();

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
