// Central registry for grammar exercise generators
// Maps list IDs to their generator modules

import * as deutsch from "./grammarDeutsch";
import * as deutschTijden from "./grammarDeutschTijden";
import * as grieks from "./grammarGrieks";
import type { GrammarGenerator, GrammarBlock, GrammarQuestion, GrammarConcept } from "./grammarTypes";

const GENERATORS: Record<string, GrammarGenerator> = {
  "k3-m3-de-gram-k46": deutsch,
  "k3-m1-de-tijden": deutschTijden,
  "k3-m3-gr-gram-t20": grieks,
};

// ── Combined generator for bovenbouw (merges multiple generators) ──

function buildCombinedGenerator(gens: GrammarGenerator[]): GrammarGenerator {
  // Re-label blocks per generator to avoid collisions: A,B,C,D for gen[0], then continue
  // Since GrammarBlock is limited to A-D, just combine concepts and delegate
  // For bovenbouw we pick the first generator's blocks (simplified approach)
  // A more complete version would merge all blocks, but blocks are A-D max
  if (gens.length === 1) return gens[0];

  const allConcepts = gens.flatMap(g => g.ALL_CONCEPTS);
  const allBlocks = gens.flatMap(g => g.GRAMMAR_BLOCKS);
  // Deduplicate blocks by block letter (first wins)
  const seenBlocks = new Set<GrammarBlock>();
  const mergedBlocks = allBlocks.filter(b => {
    if (seenBlocks.has(b.block)) return false;
    seenBlocks.add(b.block);
    return true;
  });

  // Build a concept→generator lookup
  const conceptToGen = new Map<string, GrammarGenerator>();
  for (const gen of gens) {
    for (const c of gen.ALL_CONCEPTS) {
      conceptToGen.set(c.id, gen);
    }
  }

  return {
    ALL_CONCEPTS: allConcepts,
    GRAMMAR_BLOCKS: mergedBlocks,
    generateBlock(block: GrammarBlock): GrammarQuestion[] {
      // Delegate to whichever generator owns concepts in this block
      const questions: GrammarQuestion[] = [];
      for (const gen of gens) {
        const blockConcepts = gen.getConceptsByBlock(block);
        if (blockConcepts.length > 0) {
          questions.push(...gen.generateBlock(block));
        }
      }
      return questions;
    },
    generateSession(conceptIds: string[]): GrammarQuestion[] {
      return conceptIds.map(id => {
        const gen = conceptToGen.get(id);
        if (!gen) throw new Error(`Unknown concept: ${id}`);
        return gen.generateSession([id])[0];
      });
    },
    checkGrammarAnswer(input: string, question: GrammarQuestion): boolean {
      // Try all generators
      return gens.some(g => g.checkGrammarAnswer(input, question));
    },
    getConceptsByBlock(block: GrammarBlock): GrammarConcept[] {
      return allConcepts.filter(c => c.block === block);
    },
    getConceptsAsWords() {
      return allConcepts.map(c => ({
        id: c.id,
        term: c.label,
        definition: c.shortLabel,
      }));
    },
  };
}

// ── Auto-register bovenbouw grammar aggregates ──────────────
(function registerBovenbouwGrammar() {
  const byLang: Record<string, GrammarGenerator[]> = {};
  for (const [id, gen] of Object.entries(GENERATORS)) {
    if (id.startsWith("bb-")) continue;
    const lang = id.split("-")[2]; // "k3-m3-de-gram-k46" → "de"
    if (!byLang[lang]) byLang[lang] = [];
    byLang[lang].push(gen);
  }
  for (const [lang, gens] of Object.entries(byLang)) {
    GENERATORS[`bb-${lang}-gram`] = gens.length === 1
      ? gens[0]
      : buildCombinedGenerator(gens);
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
