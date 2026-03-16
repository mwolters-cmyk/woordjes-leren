// German grammar exercise generator: Alle Tijden (haben/sein/werden)
// Präsens, Präteritum, Perfekt (hulpwerkwoord keuze), Futur I

import {
  CONJUGATIONS, PERFEKT_VERBS, TENSE_TEMPLATES, FUTUR_TEMPLATES,
  PERSON_LABELS, TENSE_LABELS, VERB_LABELS,
  type Person, type Numerus, type Tense, type Verb,
} from "@/data/grammar/de-tijden";

import type { GrammarQuestion, GrammarConcept, GrammarBlock } from "./grammarTypes";
export type { GrammarQuestion, GrammarConcept, GrammarBlock } from "./grammarTypes";

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

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Concepts ───────────────────────────────────────────────────

const PERSONS: { p: Person; n: Numerus }[] = [
  { p: 1, n: "sg" }, { p: 2, n: "sg" }, { p: 3, n: "sg" },
  { p: 1, n: "pl" }, { p: 2, n: "pl" }, { p: 3, n: "pl" },
];

const VERBS: Verb[] = ["haben", "sein", "werden"];
const TENSES: Tense[] = ["praesens", "praeteritum"];

// Block A: Präsens (3 verbs × 6 persons = 18)
function praesensConcepts(): GrammarConcept[] {
  return VERBS.flatMap(verb =>
    PERSONS.map(({ p, n }) => ({
      id: `praes-${verb}-${p}${n}`,
      block: "A" as GrammarBlock,
      label: `Präsens ${verb}: ${PERSON_LABELS[`${p}${n}`]}`,
      shortLabel: `${PERSON_LABELS[`${p}${n}`]} ${CONJUGATIONS[verb].praesens[p][n]}`,
    }))
  );
}

// Block B: Präteritum (3 verbs × 6 persons = 18)
function praeteritumConcepts(): GrammarConcept[] {
  return VERBS.flatMap(verb =>
    PERSONS.map(({ p, n }) => ({
      id: `praet-${verb}-${p}${n}`,
      block: "B" as GrammarBlock,
      label: `Präteritum ${verb}: ${PERSON_LABELS[`${p}${n}`]}`,
      shortLabel: `${PERSON_LABELS[`${p}${n}`]} ${CONJUGATIONS[verb].praeteritum[p][n]}`,
    }))
  );
}

// Block C: Perfekt — hulpwerkwoord keuze (haben of sein) + Partizip II
function perfektConcepts(): GrammarConcept[] {
  return PERFEKT_VERBS.map(v => ({
    id: `perfekt-${v.infinitiv.replace(/[^a-z]/gi, "")}`,
    block: "C" as GrammarBlock,
    label: `Perfekt: ${v.infinitiv} (${v.meaning})`,
    shortLabel: `${v.auxiliary === "haben" ? "hat" : "ist"} ${v.partizipII}`,
  }));
}

// Block D: Futur I + Tijdherkenning
function futurConcepts(): GrammarConcept[] {
  const futurPersons: GrammarConcept[] = PERSONS.map(({ p, n }) => ({
    id: `futur-${p}${n}`,
    block: "D" as GrammarBlock,
    label: `Futur I: ${PERSON_LABELS[`${p}${n}`]} + werden`,
    shortLabel: `${PERSON_LABELS[`${p}${n}`]} ${CONJUGATIONS.werden.praesens[p][n]} ... (Infinitiv)`,
  }));

  // Tijdherkenning concepts: identify which tense a form belongs to
  const herkenning: GrammarConcept[] = VERBS.map(verb => ({
    id: `herken-${verb}`,
    block: "D" as GrammarBlock,
    label: `Tijdherkenning: ${verb}`,
    shortLabel: `Welke tijd is deze vorm van ${verb}?`,
  }));

  return [...futurPersons, ...herkenning];
}

export const ALL_CONCEPTS: GrammarConcept[] = [
  ...praesensConcepts(),
  ...praeteritumConcepts(),
  ...perfektConcepts(),
  ...futurConcepts(),
];

export function getConceptsByBlock(block: GrammarBlock): GrammarConcept[] {
  return ALL_CONCEPTS.filter(c => c.block === block);
}

// ─── Block A: Präsens ───────────────────────────────────────────

function generatePraesensQ(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  // praes-haben-1sg
  const verb = parts[1] as Verb;
  const person = parseInt(parts[2][0]) as Person;
  const numerus = parts[2].slice(1) as Numerus;

  const answer = CONJUGATIONS[verb].praesens[person][numerus];
  const pronoun = PERSON_LABELS[`${person}${numerus}`];

  // Pick a matching template or use simple prompt
  const matchingTemplates = TENSE_TEMPLATES.filter(
    t => t.person === person && t.numerus === numerus
  );
  let display: string;
  if (matchingTemplates.length > 0) {
    const tmpl = pick(matchingTemplates);
    display = tmpl.template.replace("{blank}", "___");
    display = `Präsens ${verb}: ${display}`;
  } else {
    display = `Präsens ${verb}: ${pronoun} ___`;
  }

  // Options: all forms of this verb in Präsens + some from other verbs
  const allForms = new Set<string>();
  for (const { p, n } of PERSONS) {
    allForms.add(CONJUGATIONS[verb].praesens[p][n]);
  }
  // Add some from other verbs for more challenge
  for (const otherVerb of VERBS) {
    if (otherVerb !== verb) {
      allForms.add(CONJUGATIONS[otherVerb].praesens[person][numerus]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${uid()}`,
    block: "A",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint: `${VERB_LABELS[verb]} — Präsens`,
    explanation: `Präsens ${verb}: ${pronoun} ${answer}`,
  };
}

// ─── Block B: Präteritum ────────────────────────────────────────

function generatePraeteritumQ(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  const verb = parts[1] as Verb;
  const person = parseInt(parts[2][0]) as Person;
  const numerus = parts[2].slice(1) as Numerus;

  const answer = CONJUGATIONS[verb].praeteritum[person][numerus];
  const pronoun = PERSON_LABELS[`${person}${numerus}`];

  const display = `Präteritum ${verb}: ${pronoun} ___`;

  // Options
  const allForms = new Set<string>();
  for (const { p, n } of PERSONS) {
    allForms.add(CONJUGATIONS[verb].praeteritum[p][n]);
  }
  for (const otherVerb of VERBS) {
    if (otherVerb !== verb) {
      allForms.add(CONJUGATIONS[otherVerb].praeteritum[person][numerus]);
    }
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${uid()}`,
    block: "B",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint: `${VERB_LABELS[verb]} — Präteritum`,
    explanation: `Präteritum ${verb}: ${pronoun} ${answer}`,
  };
}

// ─── Block C: Perfekt (hulpwerkwoord + Partizip II) ─────────────

function generatePerfektQ(conceptId: string): GrammarQuestion {
  const verbKey = conceptId.replace("perfekt-", "");
  const verb = PERFEKT_VERBS.find(v => v.infinitiv.replace(/[^a-z]/gi, "") === verbKey)!;

  // Two question types: ask for auxiliary OR ask for Partizip II
  const askAuxiliary = Math.random() > 0.4;

  if (askAuxiliary) {
    // "Welk hulpwerkwoord? Er ___ nach Berlin gefahren."
    const person = pick([1, 2, 3] as Person[]);
    const numerus = pick(["sg", "pl"] as Numerus[]);
    const pronoun = PERSON_LABELS[`${person}${numerus}`];

    const habenForm = CONJUGATIONS.haben.praesens[person][numerus];
    const seinForm = CONJUGATIONS.sein.praesens[person][numerus];
    const answer = verb.auxiliary === "haben" ? habenForm : seinForm;

    // Capitalize first letter of pronoun for sentence start
    const capitalPronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    const display = `${capitalPronoun} ___ ${verb.partizipII}. (${verb.meaning})`;

    const options = shuffle([habenForm, seinForm,
      // Add some Präteritum forms as distractors
      CONJUGATIONS.haben.praeteritum[person][numerus],
      CONJUGATIONS.sein.praeteritum[person][numerus],
    ].filter((v, i, arr) => arr.indexOf(v) === i)).slice(0, 4);
    if (!options.includes(answer)) {
      options[3] = answer;
    }

    return {
      id: `${conceptId}-${uid()}`,
      block: "C",
      conceptId,
      display,
      answer,
      altAnswers: [],
      options: shuffle(options),
      hint: `Perfekt: haben of sein?`,
      explanation: `${verb.infinitiv} → Perfekt met "${verb.auxiliary}" (${verb.auxiliary === "sein" ? "beweging/toestandsverandering" : "overige werkwoorden"})`,
    };
  } else {
    // Ask for Partizip II
    const display = `Partizip II van "${verb.infinitiv}" (${verb.meaning})`;
    const answer = verb.partizipII;

    // Distractors: other Partizip II forms
    const otherPartizips = PERFEKT_VERBS
      .filter(v => v.infinitiv !== verb.infinitiv)
      .map(v => v.partizipII);
    const options = shuffle([answer, ...shuffle(otherPartizips).slice(0, 3)]);

    return {
      id: `${conceptId}-${uid()}`,
      block: "C",
      conceptId,
      display,
      answer,
      altAnswers: [],
      options,
      hint: `Partizip II`,
      explanation: `${verb.infinitiv} → ${verb.partizipII} (met ${verb.auxiliary})`,
    };
  }
}

// ─── Block D: Futur I + Tijdherkenning ──────────────────────────

function generateFuturQ(conceptId: string): GrammarQuestion {
  if (conceptId.startsWith("herken-")) {
    return generateHerkenningQ(conceptId);
  }

  // Futur I: fill in the correct form of "werden"
  const parts = conceptId.split("-");
  const person = parseInt(parts[1][0]) as Person;
  const numerus = parts[1].slice(1) as Numerus;

  const answer = CONJUGATIONS.werden.praesens[person][numerus];
  const pronoun = PERSON_LABELS[`${person}${numerus}`];

  // Pick a Futur template if available
  const matchingFutur = FUTUR_TEMPLATES.filter(t => {
    const subjects: Record<string, { p: Person; n: Numerus }> = {
      "Ich": { p: 1, n: "sg" }, "Du": { p: 2, n: "sg" }, "Er": { p: 3, n: "sg" },
      "Wir": { p: 1, n: "pl" }, "Ihr": { p: 2, n: "pl" }, "Sie": { p: 3, n: "pl" },
    };
    const firstWord = t.template.split(" ")[0];
    const match = subjects[firstWord];
    return match && match.p === person && match.n === numerus;
  });

  let display: string;
  if (matchingFutur.length > 0) {
    const tmpl = pick(matchingFutur);
    display = `Futur I: ${tmpl.template}`;
  } else {
    const capitalPronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    display = `Futur I: ${capitalPronoun} ___ das machen.`;
  }

  // Options: all forms of werden Präsens
  const allForms = new Set<string>();
  for (const { p, n } of PERSONS) {
    allForms.add(CONJUGATIONS.werden.praesens[p][n]);
  }
  const distractors = [...allForms].filter(f => f !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  return {
    id: `${conceptId}-${uid()}`,
    block: "D",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint: "Futur I = werden + Infinitiv",
    explanation: `Futur I: ${pronoun} ${answer} + Infinitiv`,
  };
}

function generateHerkenningQ(conceptId: string): GrammarQuestion {
  const verb = conceptId.replace("herken-", "") as Verb;

  // Pick a random person/number and tense
  const { p, n } = pick(PERSONS);
  const tense = pick(TENSES);
  const form = CONJUGATIONS[verb][tense][p][n];
  const pronoun = PERSON_LABELS[`${p}${n}`];

  const display = `Welke tijd? "${pronoun} ${form}"`;
  const answer = TENSE_LABELS[tense];

  const options = shuffle([
    TENSE_LABELS.praesens,
    TENSE_LABELS.praeteritum,
    "Perfekt",
    "Futur I",
  ]);

  return {
    id: `${conceptId}-${uid()}`,
    block: "D",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint: `${VERB_LABELS[verb]}`,
    explanation: `${pronoun} ${form} = ${TENSE_LABELS[tense]} van ${verb}`,
  };
}

// ─── Public API ─────────────────────────────────────────────────

const BLOCK_GENERATORS: Record<GrammarBlock, (conceptId: string) => GrammarQuestion> = {
  A: generatePraesensQ,
  B: generatePraeteritumQ,
  C: generatePerfektQ,
  D: generateFuturQ,
};

export function generateQuestion(conceptId: string): GrammarQuestion {
  const concept = ALL_CONCEPTS.find(c => c.id === conceptId);
  if (!concept) throw new Error(`Unknown concept: ${conceptId}`);
  return BLOCK_GENERATORS[concept.block](conceptId);
}

export function generateSession(conceptIds: string[]): GrammarQuestion[] {
  return conceptIds.map(id => generateQuestion(id));
}

export function generateBlock(block: GrammarBlock): GrammarQuestion[] {
  const concepts = getConceptsByBlock(block);
  return shuffle(concepts).map(c => generateQuestion(c.id));
}

export function checkGrammarAnswer(userInput: string, question: GrammarQuestion): boolean {
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const input = clean(userInput);
  if (input === clean(question.answer)) return true;
  return question.altAnswers.some(alt => input === clean(alt));
}

export const GRAMMAR_BLOCKS: { block: GrammarBlock; title: string; description: string; icon: string }[] = [
  { block: "A", title: "Präsens", description: "haben, sein, werden — tegenwoordige tijd", icon: "🔵" },
  { block: "B", title: "Präteritum", description: "haben, sein, werden — verleden tijd", icon: "🟤" },
  { block: "C", title: "Perfekt", description: "Hulpwerkwoord (haben/sein) + Partizip II", icon: "🟢" },
  { block: "D", title: "Futur I & Herkenning", description: "werden + Infinitiv, tijdherkenning", icon: "🔮" },
];

export function getConceptsAsWords() {
  return ALL_CONCEPTS.map(c => ({
    id: c.id,
    term: c.label,
    definition: c.shortLabel,
  }));
}
