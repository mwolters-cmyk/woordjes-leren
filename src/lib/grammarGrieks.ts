// Greek grammar exercise generator: Grammatica t/m Les 20
// Betrekkelijk vnw, gemengde groep, conjunctivus

import {
  RELATIVE_PRONOUN, ALL_NOUNS, HEDUS, CONJUNCTIVUS, CONJ_USAGE,
  CASE_LABELS, NUMBER_LABELS, GENDER_LABELS, PERSON_LABELS, VOICE_LABELS, TENSE_LABELS,
  type GreekCase, type GreekNumber, type GreekGender,
  type GreekPerson, type GreekVoice, type GreekTense,
} from "@/data/grammar/gr-gram-t20";
import type { GrammarQuestion, GrammarConcept, GrammarBlock } from "./grammarTypes";

// ─── Helpers ────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Strip Greek diacritics for lenient comparison */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

/** Clean input for comparison */
function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/\(ν\)$/i, "").replace(/\(ν\)/g, "ν");
}

// ─── Concepts ───────────────────────────────────────────────────

function relativePronounConcepts(): GrammarConcept[] {
  const cases: GreekCase[] = ["nom", "gen", "dat", "acc"];
  const numbers: GreekNumber[] = ["sg", "pl"];
  const genders: GreekGender[] = ["m", "f", "n"];

  return numbers.flatMap(num =>
    cases.flatMap(cas =>
      genders.map(g => ({
        id: `rel-${num}-${cas}-${g}`,
        block: "A" as GrammarBlock,
        label: `ὅς, ἥ, ὅ: ${CASE_LABELS[cas]} ${GENDER_LABELS[g]} ${NUMBER_LABELS[num]}`,
        shortLabel: `${RELATIVE_PRONOUN[num][cas][g]} (${cas}. ${g}. ${num})`,
      }))
    )
  );
}

function nounDeclensionConcepts(): GrammarConcept[] {
  const cases: GreekCase[] = ["nom", "gen", "dat", "acc"];
  const numbers: GreekNumber[] = ["sg", "pl"];
  const concepts: GrammarConcept[] = [];

  // Nouns
  for (const noun of ALL_NOUNS) {
    for (const num of numbers) {
      for (const cas of cases) {
        concepts.push({
          id: `noun-${noun.lemma.replace(/[^a-z]/gi, "")}-${num}-${cas}`,
          block: "B" as GrammarBlock,
          label: `${noun.article} ${noun.lemma}: ${CASE_LABELS[cas]} ${NUMBER_LABELS[num]}`,
          shortLabel: `${noun.forms[num][cas]}`,
        });
      }
    }
  }

  // ἡδύς adjective (only singular, 3 genders, 4 cases = 12)
  const genders: GreekGender[] = ["m", "f", "n"];
  for (const g of genders) {
    for (const cas of cases) {
      concepts.push({
        id: `adj-hedus-sg-${cas}-${g}`,
        block: "B" as GrammarBlock,
        label: `ἡδύς: ${CASE_LABELS[cas]} ${GENDER_LABELS[g]} enkelvoud`,
        shortLabel: `${HEDUS.sg[cas][g]}`,
      });
    }
  }

  return concepts;
}

function conjFormConcepts(): GrammarConcept[] {
  const tenses: GreekTense[] = ["praes", "aor"];
  const voices: GreekVoice[] = ["act", "med"];
  const persons: GreekPerson[] = [1, 2, 3];
  const numbers: GreekNumber[] = ["sg", "pl"];

  return tenses.flatMap(t =>
    voices.flatMap(v =>
      persons.flatMap(p =>
        numbers.map(n => ({
          id: `conj-${t}-${v}-${p}${n}`,
          block: "C" as GrammarBlock,
          label: `Conj. ${TENSE_LABELS[t]} ${VOICE_LABELS[v]}: ${PERSON_LABELS[p]} ${NUMBER_LABELS[n]}`,
          shortLabel: CONJUNCTIVUS[t][v][p][n],
        }))
      )
    )
  );
}

function conjUsageConcepts(): GrammarConcept[] {
  return CONJ_USAGE.map(u => ({
    id: `usage-${u.id}`,
    block: "D" as GrammarBlock,
    label: u.label,
    shortLabel: u.type === "hoofdzin" ? `hoofdzin: ${u.id}` : `bijzin: ${u.id}`,
  }));
}

export const ALL_CONCEPTS: GrammarConcept[] = [
  ...relativePronounConcepts(),
  ...nounDeclensionConcepts(),
  ...conjFormConcepts(),
  ...conjUsageConcepts(),
];

export function getConceptsByBlock(block: GrammarBlock): GrammarConcept[] {
  return ALL_CONCEPTS.filter(c => c.block === block);
}

// ─── Block A: Betrekkelijk voornaamwoord ────────────────────────

function generateRelPronounQ(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  const num = parts[1] as GreekNumber;
  const cas = parts[2] as GreekCase;
  const gender = parts[3] as GreekGender;

  const answer = RELATIVE_PRONOUN[num][cas][gender];

  const display = `Betrekkelijk vnw: ${CASE_LABELS[cas]} ${GENDER_LABELS[gender]} ${NUMBER_LABELS[num]}`;

  // Options: other forms from the same number
  const allForms = new Set<string>();
  const genders: GreekGender[] = ["m", "f", "n"];
  const cases: GreekCase[] = ["nom", "gen", "dat", "acc"];
  for (const c of cases) {
    for (const g of genders) {
      allForms.add(RELATIVE_PRONOUN[num][c][g]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "A",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint: `ὅς, ἥ, ὅ (die/dat, wie/wat)`,
    explanation: `${CASE_LABELS[cas]} ${GENDER_LABELS[gender]} ${NUMBER_LABELS[num]} → ${answer}`,
  };
}

// ─── Block B: Gemengde groep naamwoorden + ἡδύς ─────────────────

function generateNounQ(conceptId: string): GrammarQuestion {
  if (conceptId.startsWith("adj-hedus-")) {
    return generateHedusQ(conceptId);
  }

  const parts = conceptId.split("-");
  // noun-polis-sg-nom → parts: ["noun", "polis", "sg", "nom"]
  const nounKey = parts[1];
  const num = parts[2] as GreekNumber;
  const cas = parts[3] as GreekCase;

  const noun = ALL_NOUNS.find(n => n.lemma.replace(/[^a-z]/gi, "") === nounKey)!;
  const answer = noun.forms[num][cas];

  const display = `${noun.article} ${noun.lemma} (${noun.meaning}): ${CASE_LABELS[cas]} ${NUMBER_LABELS[num]}`;

  // Options: other forms of the same noun
  const allForms = new Set<string>();
  const cases: GreekCase[] = ["nom", "gen", "dat", "acc"];
  const numbers: GreekNumber[] = ["sg", "pl"];
  for (const n of numbers) {
    for (const c of cases) {
      allForms.add(noun.forms[n][c]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "B",
    conceptId,
    display,
    answer,
    altAnswers: answer.includes("(ν)") ? [answer.replace("(ν)", ""), answer.replace("(ν)", "ν")] : [],
    options,
    explanation: `${noun.article} ${noun.lemma}: ${CASE_LABELS[cas]} ${NUMBER_LABELS[num]} → ${answer}`,
  };
}

function generateHedusQ(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  // adj-hedus-sg-nom-m
  const cas = parts[3] as GreekCase;
  const gender = parts[4] as GreekGender;

  const answer = HEDUS.sg[cas][gender];

  const display = `ἡδύς (aangenaam): ${CASE_LABELS[cas]} ${GENDER_LABELS[gender]} enkelvoud`;

  const allForms = new Set<string>();
  const genders: GreekGender[] = ["m", "f", "n"];
  const cases: GreekCase[] = ["nom", "gen", "dat", "acc"];
  for (const c of cases) {
    for (const g of genders) {
      allForms.add(HEDUS.sg[c][g]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "B",
    conceptId,
    display,
    answer,
    altAnswers: answer.includes("(ν)") ? [answer.replace("(ν)", ""), answer.replace("(ν)", "ν")] : [],
    options,
    explanation: `ἡδύς: ${CASE_LABELS[cas]} ${GENDER_LABELS[gender]} ev. → ${answer}`,
  };
}

// ─── Block C: Conjunctivus vorming ──────────────────────────────

function generateConjFormQ(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  // conj-praes-act-1sg
  const tense = parts[1] as GreekTense;
  const voice = parts[2] as GreekVoice;
  const person = parseInt(parts[3][0]) as GreekPerson;
  const number = parts[3].slice(1) as GreekNumber;

  const answer = CONJUNCTIVUS[tense][voice][person][number];

  const display = `Conjunctivus ${TENSE_LABELS[tense]} ${VOICE_LABELS[voice]}: ${PERSON_LABELS[person]} ${NUMBER_LABELS[number]} van λύω`;

  // Options: other forms from same tense+voice
  const allForms = new Set<string>();
  const persons: GreekPerson[] = [1, 2, 3];
  const numbers: GreekNumber[] = ["sg", "pl"];
  for (const p of persons) {
    for (const n of numbers) {
      allForms.add(CONJUNCTIVUS[tense][voice][p][n]);
    }
  }
  // Also add some from the other tense for confusion
  const otherTense: GreekTense = tense === "praes" ? "aor" : "praes";
  for (const p of persons) {
    for (const n of numbers) {
      allForms.add(CONJUNCTIVUS[otherTense][voice][p][n]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "C",
    conceptId,
    display,
    answer,
    altAnswers: answer.includes("(ν)") ? [answer.replace("(ν)", ""), answer.replace("(ν)", "ν")] : [],
    options,
    hint: "Kenmerk conjunctivus: lange klinker ω/η in de uitgang",
    explanation: `Conj. ${TENSE_LABELS[tense]} ${VOICE_LABELS[voice]}, ${PERSON_LABELS[person]} ${NUMBER_LABELS[number]} → ${answer}`,
  };
}

// ─── Block D: Conjunctivus gebruik ──────────────────────────────

function generateConjUsageQ(conceptId: string): GrammarQuestion {
  const usageId = conceptId.replace("usage-", "");
  const usage = CONJ_USAGE.find(u => u.id === usageId)!;
  const example = pick(usage.examples);

  // Type 1: given a sentence, identify the conjunctivus type
  const isIdentify = Math.random() > 0.5;

  if (isIdentify) {
    const display = `Welk type conjunctivus? "${example.greek}"`;
    const answer = usage.label;

    const allLabels = CONJ_USAGE.map(u => u.label);
    const distractors = allLabels.filter(l => l !== answer);
    const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

    return {
      id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      block: "D",
      conceptId,
      display,
      answer,
      altAnswers: [],
      options,
      hint: `"${example.dutch}"`,
      explanation: `${usage.label}: ${usage.description}`,
    };
  } else {
    // Type 2: what does this construction mean?
    const display = `${usage.label}: wat betekent "${example.greek}"?`;
    const answer = example.dutch;

    // Generate plausible wrong translations
    const otherExamples = CONJ_USAGE
      .filter(u => u.id !== usageId)
      .flatMap(u => u.examples.map(e => e.dutch));
    const distractors = shuffle(otherExamples).slice(0, 3);
    const options = shuffle([answer, ...distractors]);

    return {
      id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      block: "D",
      conceptId,
      display,
      answer,
      altAnswers: [],
      options,
      explanation: `${usage.label}: ${usage.description}`,
    };
  }
}

// ─── Public API ─────────────────────────────────────────────────

const GENERATORS: Record<GrammarBlock, (conceptId: string) => GrammarQuestion> = {
  A: generateRelPronounQ,
  B: generateNounQ,
  C: generateConjFormQ,
  D: generateConjUsageQ,
};

export function generateQuestion(conceptId: string): GrammarQuestion {
  const concept = ALL_CONCEPTS.find(c => c.id === conceptId);
  if (!concept) throw new Error(`Unknown concept: ${conceptId}`);
  return GENERATORS[concept.block](conceptId);
}

export function generateSession(conceptIds: string[]): GrammarQuestion[] {
  return conceptIds.map(id => generateQuestion(id));
}

export function generateBlock(block: GrammarBlock): GrammarQuestion[] {
  const concepts = getConceptsByBlock(block);
  return shuffle(concepts).map(c => generateQuestion(c.id));
}

export function checkGrammarAnswer(userInput: string, question: GrammarQuestion): boolean {
  const input = clean(userInput);
  const answer = clean(question.answer);

  // Exact match
  if (input === answer) return true;

  // Check alternatives
  if (question.altAnswers.some(alt => clean(alt) === input)) return true;

  // Lenient: strip diacritics
  if (stripDiacritics(input) === stripDiacritics(answer)) return true;

  // Check alt answers with stripped diacritics too
  if (question.altAnswers.some(alt => stripDiacritics(clean(alt)) === stripDiacritics(input))) return true;

  return false;
}

export const GRAMMAR_BLOCKS: { block: GrammarBlock; title: string; description: string; icon: string }[] = [
  { block: "A", title: "Betrekkelijk vnw", description: "ὅς, ἥ, ὅ — verbuiging", icon: "📖" },
  { block: "B", title: "Gemengde groep", description: "πόλις, βασιλεύς, ἡδύς — verbuiging", icon: "📝" },
  { block: "C", title: "Conjunctivus vorming", description: "λύω — praesens + aoristus", icon: "🔤" },
  { block: "D", title: "Conjunctivus gebruik", description: "Hoofd- en bijzinnen", icon: "📌" },
];

export function getConceptsAsWords() {
  return ALL_CONCEPTS.map(c => ({
    id: c.id,
    term: c.label,
    definition: c.shortLabel,
  }));
}
