export type Language = "fr" | "en" | "de" | "la" | "gr" | "nl";

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: "Frans",
  en: "Engels",
  de: "Duits",
  la: "Latijn",
  gr: "Grieks",
  nl: "Nederlands",
};

export const LANGUAGE_EMOJI: Record<Language, string> = {
  fr: "\u{1F1EB}\u{1F1F7}",
  en: "\u{1F1EC}\u{1F1E7}",
  de: "\u{1F1E9}\u{1F1EA}",
  la: "\u{1F3DB}\u{FE0F}",
  gr: "\u{03A9}",
  nl: "\u{1F1F3}\u{1F1F1}",
};

// Class levels
export type Jaarlaag = 1 | 2 | 3 | "bovenbouw";
export type Module = 1 | 2 | 3;

export const JAARLAAG_LABELS: Record<string, string> = {
  "1": "Klas 1",
  "2": "Klas 2",
  "3": "Klas 3",
  bovenbouw: "Bovenbouw",
};

export const MODULE_LABELS: Record<Module, string> = {
  1: "Module 1",
  2: "Module 2",
  3: "Module 3",
};

// List types
export type ListType = "vocabulary" | "grammar" | "sentences" | "spelling";

export const LIST_TYPE_LABELS: Record<ListType, string> = {
  vocabulary: "Woordjes",
  grammar: "Grammatica",
  sentences: "Zinnen",
  spelling: "Spelling",
};

export interface Word {
  id: string;
  term: string;
  definition: string;
  hint?: string;
  extra?: string; // for Latin/Greek: declension info, gender, etc.
}

export interface WordList {
  id: string;
  title: string;
  description?: string;
  language: {
    from: Language;
    to: Language;
  };
  tags: string[];
  words: Word[];
  // New: class/module organization
  jaarlaag: Jaarlaag;
  module?: Module; // undefined for bovenbouw
  listType: ListType;
  source?: string; // e.g. "Grandes Lignes", "Stepping Stones"
}

// Leitner box: 1-5
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface WordProgress {
  wordId: string;
  listId: string;
  box: LeitnerBox;
  lastSeen: string; // ISO date
  correctCount: number;
  incorrectCount: number;
}

export interface ListProgress {
  listId: string;
  wordProgress: Record<string, WordProgress>;
  lastPracticed: string; // ISO date
  sessionsCompleted: number;
}

export type ExerciseMode = "flashcards" | "schrijven" | "meerkeuze" | "toets";

export interface ExerciseResult {
  wordId: string;
  correct: boolean;
  userAnswer?: string;
  correctAnswer: string;
}

export interface SessionResult {
  listId: string;
  mode: ExerciseMode;
  date: string;
  results: ExerciseResult[];
  score: number; // percentage
  duration: number; // seconds
}
