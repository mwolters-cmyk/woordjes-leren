// Shared types for grammar exercise generators (all languages)

export type GrammarBlock = "A" | "B" | "C" | "D";

export interface GrammarQuestion {
  id: string;
  block: GrammarBlock;
  conceptId: string;
  display: string;       // question text (sentence with ___ or prompt)
  answer: string;        // canonical answer
  altAnswers: string[];  // accepted alternatives
  options: string[];     // 4 MC options (shuffled, includes answer)
  hint?: string;
  explanation: string;
}

export interface GrammarConcept {
  id: string;
  block: GrammarBlock;
  label: string;       // human-readable description
  shortLabel: string;  // compact display
}

export interface GrammarGenerator {
  ALL_CONCEPTS: GrammarConcept[];
  GRAMMAR_BLOCKS: { block: GrammarBlock; title: string; description: string; icon: string }[];
  generateBlock(block: GrammarBlock): GrammarQuestion[];
  generateSession(conceptIds: string[]): GrammarQuestion[];
  checkGrammarAnswer(input: string, question: GrammarQuestion): boolean;
  getConceptsByBlock(block: GrammarBlock): GrammarConcept[];
  getConceptsAsWords(): { id: string; term: string; definition: string }[];
}
