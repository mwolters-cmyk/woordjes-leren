// German grammar exercise generator: Fälle & Wechselpräpositionen
// Generates random questions from templates — answer is always known beforehand

import {
  NOUNS, DER_GRUPPE, EIN_GRUPPE, POSSESSIVES,
  WECHSEL_TEMPLATES, FESTE_TEMPLATES, CASE_TEMPLATES,
  CONTRACTIONS, EXPANSIONS,
  FESTE_DATIV, FESTE_AKKUSATIV,
  getPossessiveForm,
  type Gender, type Case, type GermanNoun,
} from "@/data/grammar/de-faelle";

// ─── Types ──────────────────────────────────────────────────────

export type GrammarBlock = "A" | "B" | "C" | "D";

export interface GrammarQuestion {
  id: string;
  block: GrammarBlock;
  conceptId: string;
  display: string;       // sentence with ___
  answer: string;        // canonical answer
  altAnswers: string[];  // accepted alternatives (e.g. "an dem" for "am")
  options: string[];     // 4 MC options (shuffled, includes answer)
  hint?: string;
  explanation: string;
}

export interface GrammarConcept {
  id: string;
  block: GrammarBlock;
  label: string;       // human-readable, e.g. "der-Gruppe: Dativ mannelijk → dem"
  shortLabel: string;  // for display, e.g. "dem (Dat. m)"
}

// ─── All concepts (~55 stable IDs for Leitner) ─────────────────

function derConcepts(): GrammarConcept[] {
  const cases: Case[] = ["nominativ", "dativ", "akkusativ"];
  const genders: (Gender | "pl")[] = ["m", "f", "n", "pl"];
  const genderLabels = { m: "mannelijk", f: "vrouwelijk", n: "onzijdig", pl: "meervoud" };
  const caseLabels = { nominativ: "Nom.", dativ: "Dat.", akkusativ: "Akk." };

  return cases.flatMap(c =>
    genders.map(g => ({
      id: `der-${c.slice(0, 3)}-${g}`,
      block: "A" as GrammarBlock,
      label: `der-Gruppe: ${caseLabels[c]} ${genderLabels[g]} → ${DER_GRUPPE[c][g]}`,
      shortLabel: `${DER_GRUPPE[c][g]} (${caseLabels[c]} ${g})`,
    }))
  );
}

function einConcepts(): GrammarConcept[] {
  const cases: Case[] = ["nominativ", "dativ", "akkusativ"];
  const genders: (Gender | "pl")[] = ["m", "f", "n", "pl"];
  const genderLabels = { m: "mannelijk", f: "vrouwelijk", n: "onzijdig", pl: "meervoud" };
  const caseLabels = { nominativ: "Nom.", dativ: "Dat.", akkusativ: "Akk." };

  return cases.flatMap(c =>
    genders.map(g => ({
      id: `ein-${c.slice(0, 3)}-${g}`,
      block: "B" as GrammarBlock,
      label: `ein-Gruppe: ${caseLabels[c]} ${genderLabels[g]} → ${EIN_GRUPPE[c][g]}`,
      shortLabel: `${EIN_GRUPPE[c][g]} (${caseLabels[c]} ${g})`,
    }))
  );
}

function wechselConcepts(): GrammarConcept[] {
  const preps = ["an", "auf", "hinter", "neben", "in", "über", "unter", "vor", "zwischen"];
  return preps.flatMap(p => [
    {
      id: `wechsel-${p}-dat`,
      block: "C" as GrammarBlock,
      label: `${p} + Dativ (wo/locatie)`,
      shortLabel: `${p} + Dat.`,
    },
    {
      id: `wechsel-${p}-akk`,
      block: "C" as GrammarBlock,
      label: `${p} + Akkusativ (wohin/beweging)`,
      shortLabel: `${p} + Akk.`,
    },
  ]);
}

function festeConcepts(): GrammarConcept[] {
  const datConcepts = FESTE_DATIV.map(p => ({
    id: `fest-${p}-dat`,
    block: "D" as GrammarBlock,
    label: `${p} + Dativ (altijd)`,
    shortLabel: `${p} + Dat.`,
  }));
  const akkConcepts = FESTE_AKKUSATIV.map(p => ({
    id: `fest-${p}-akk`,
    block: "D" as GrammarBlock,
    label: `${p} + Akkusativ (altijd)`,
    shortLabel: `${p} + Akk.`,
  }));
  return [...datConcepts, ...akkConcepts];
}

export const ALL_CONCEPTS: GrammarConcept[] = [
  ...derConcepts(),
  ...einConcepts(),
  ...wechselConcepts(),
  ...festeConcepts(),
];

export function getConceptsByBlock(block: GrammarBlock): GrammarConcept[] {
  return ALL_CONCEPTS.filter(c => c.block === block);
}

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

function getNounsByGender(gender: Gender): GermanNoun[] {
  return NOUNS.filter(n => n.gender === gender);
}

function contract(prep: string, article: string): { display: string; alt: string | null } {
  const full = `${prep} ${article}`;
  const contracted = CONTRACTIONS[full];
  if (contracted) return { display: contracted, alt: full };
  return { display: full, alt: null };
}

function dativPluralNoun(noun: GermanNoun): string {
  if (noun.pluralEndsNS) return noun.plural;
  return noun.plural + "n";
}

// ─── Block A: Der-Gruppe ────────────────────────────────────────

function generateDerQuestion(conceptId: string): GrammarQuestion {
  // Parse concept: "der-nom-m" → case=nominativ, gender=m
  const parts = conceptId.split("-");
  const caseAbbr = parts[1]; // nom/dat/akk
  const genderKey = parts[2] as Gender | "pl";

  const caseMap: Record<string, Case> = { nom: "nominativ", dat: "dativ", akk: "akkusativ" };
  const cas = caseMap[caseAbbr];
  const answer = DER_GRUPPE[cas][genderKey];

  // Pick a random template and noun
  const templates = CASE_TEMPLATES.filter(t => t.blankRole === cas);
  const tmpl = pick(templates);

  let display: string;
  let nounDisplay: string;

  if (genderKey === "pl") {
    const noun = pick(NOUNS);
    nounDisplay = cas === "dativ" ? dativPluralNoun(noun) : noun.plural;
    display = tmpl.template.replace("{blank}", `___ ${nounDisplay}`);
  } else {
    const nouns = getNounsByGender(genderKey);
    const noun = pick(nouns);
    nounDisplay = noun.noun;
    display = tmpl.template.replace("{blank}", `___ ${nounDisplay}`);
  }

  // MC options: all articles that could fit this position
  const allArticles = Object.values(DER_GRUPPE[cas]);
  const extraArticles = ["der", "die", "das", "dem", "den"];
  const optionPool = [...new Set([...allArticles, ...extraArticles])];
  const distractors = optionPool.filter(a => a !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  const caseLabels = { nominativ: "Nominativ", dativ: "Dativ", akkusativ: "Akkusativ" };
  const genderLabels: Record<string, string> = { m: "mannelijk", f: "vrouwelijk", n: "onzijdig", pl: "meervoud" };

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "A",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    explanation: `${caseLabels[cas]} ${genderLabels[genderKey]} → ${answer}`,
  };
}

// ─── Block B: Ein-Gruppe ────────────────────────────────────────

function generateEinQuestion(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  const caseAbbr = parts[1];
  const genderKey = parts[2] as Gender | "pl";

  const caseMap: Record<string, Case> = { nom: "nominativ", dat: "dativ", akk: "akkusativ" };
  const cas = caseMap[caseAbbr];

  // Randomly choose ein/kein or a possessive
  const usePossessive = Math.random() > 0.4;
  let answer: string;
  let prefix: string;

  if (usePossessive && genderKey !== "pl") {
    prefix = pick(POSSESSIVES);
    answer = getPossessiveForm(prefix, cas, genderKey);
  } else {
    prefix = genderKey === "pl" ? "kein" : "ein";
    answer = EIN_GRUPPE[cas][genderKey];
  }

  const templates = CASE_TEMPLATES.filter(t => t.blankRole === cas);
  const tmpl = pick(templates);

  let nounDisplay: string;
  if (genderKey === "pl") {
    const noun = pick(NOUNS);
    nounDisplay = cas === "dativ" ? dativPluralNoun(noun) : noun.plural;
  } else {
    const noun = pick(getNounsByGender(genderKey));
    nounDisplay = noun.noun;
  }

  const display = tmpl.template.replace("{blank}", `___ ${nounDisplay}`);

  // Hint: show which possessive/article to use
  const hint = usePossessive ? `Gebruik: ${prefix}` : undefined;

  // MC options: generate alternatives with same prefix but different endings
  const cases: Case[] = ["nominativ", "dativ", "akkusativ"];
  const genders: (Gender | "pl")[] = ["m", "f", "n", "pl"];
  const optionPool = new Set<string>();
  for (const c of cases) {
    for (const g of genders) {
      if (usePossessive && genderKey !== "pl") {
        optionPool.add(getPossessiveForm(prefix, c, g));
      } else {
        optionPool.add(EIN_GRUPPE[c][g]);
      }
    }
  }
  const distractors = [...optionPool].filter(a => a !== answer);
  const options = shuffle([answer, ...shuffle(distractors).slice(0, 3)]);

  const caseLabels = { nominativ: "Nominativ", dativ: "Dativ", akkusativ: "Akkusativ" };
  const genderLabels: Record<string, string> = { m: "mannelijk", f: "vrouwelijk", n: "onzijdig", pl: "meervoud" };

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "B",
    conceptId,
    display,
    answer,
    altAnswers: [],
    options,
    hint,
    explanation: `${caseLabels[cas]} ${genderLabels[genderKey]} → ${answer}`,
  };
}

// ─── Block C: Wechselpräpositionen ─────────────────────────────

function generateWechselQuestion(conceptId: string): GrammarQuestion {
  // Parse: "wechsel-an-dat" → prep=an, case=dativ
  const parts = conceptId.split("-");
  const prep = parts[1];
  const caseAbbr = parts[2];
  const cas: Case = caseAbbr === "dat" ? "dativ" : "akkusativ";

  // Find matching templates
  const templates = WECHSEL_TEMPLATES.filter(t => t.prep === prep && t.case === cas);
  if (templates.length === 0) {
    // Fallback: generate a generic sentence
    return generateWechselFallback(conceptId, prep, cas);
  }

  const tmpl = pick(templates);

  // Pick noun based on template's gender preference
  let noun: GermanNoun;
  let article: string;

  if (tmpl.context === "zeit") {
    // Time expressions: use fixed noun from template
    const timeArticle = cas === "dativ" ? (tmpl.template.includes("Woche") ? "einer" : "einem") : "";
    return {
      id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      block: "C",
      conceptId,
      display: tmpl.template.replace("{blank}", "___"),
      answer: timeArticle ? `${prep} ${timeArticle}` : prep,
      altAnswers: [],
      options: generateWechselOptions(prep, cas),
      hint: "Tijdsbepaling → altijd Dativ",
      explanation: `Tijdsbepalingen na een keuzevoorzetsel staan altijd in de Dativ`,
    };
  }

  if (tmpl.nounGender) {
    noun = pick(getNounsByGender(tmpl.nounGender));
    article = DER_GRUPPE[cas][tmpl.nounGender];
  } else {
    noun = pick(NOUNS);
    article = DER_GRUPPE[cas][noun.gender];
  }

  const { display: answerStr, alt } = contract(prep, article);
  const altAnswers = alt ? [alt] : [];
  // Also add the expanded form if answer is contracted
  if (EXPANSIONS[answerStr]) altAnswers.push(EXPANSIONS[answerStr]);

  const display = tmpl.template
    .replace("{blank}", "___")
    .replace("{noun}", noun.noun);

  const contextLabel = tmpl.context === "wo" ? "Wo? → Dativ (locatie)" : "Wohin? → Akkusativ (beweging)";

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "C",
    conceptId,
    display,
    answer: answerStr,
    altAnswers,
    options: generateWechselOptions(prep, cas, noun.gender),
    hint: "Wo? (locatie) → Dativ / Wohin? (beweging) → Akkusativ",
    explanation: contextLabel,
  };
}

function generateWechselFallback(conceptId: string, prep: string, cas: Case): GrammarQuestion {
  const noun = pick(NOUNS);
  const article = DER_GRUPPE[cas][noun.gender];
  const { display: answerStr, alt } = contract(prep, article);
  const verb = cas === "dativ" ? pick(["steht", "liegt", "sitzt", "ist"]) : pick(["geht", "stellt", "legt", "kommt"]);

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "C",
    conceptId,
    display: `Es ${verb} ___ ${noun.noun}`,
    answer: answerStr,
    altAnswers: alt ? [alt] : [],
    options: generateWechselOptions(prep, cas, noun.gender),
    hint: "Wo? (locatie) → Dativ / Wohin? (beweging) → Akkusativ",
    explanation: cas === "dativ" ? "Wo? → Dativ (locatie)" : "Wohin? → Akkusativ (beweging)",
  };
}

function generateWechselOptions(prep: string, cas: Case, gender?: Gender): string[] {
  const g = gender ?? pick(["m", "f", "n"] as Gender[]);
  const datArt = DER_GRUPPE.dativ[g];
  const akkArt = DER_GRUPPE.akkusativ[g];
  const datFull = `${prep} ${datArt}`;
  const akkFull = `${prep} ${akkArt}`;
  const datDisplay = CONTRACTIONS[datFull] ?? datFull;
  const akkDisplay = CONTRACTIONS[akkFull] ?? akkFull;

  // Add some other preps as distractors
  const otherPreps = ["an", "auf", "in", "über", "unter", "vor"].filter(p => p !== prep);
  const otherPrep = pick(otherPreps);
  const otherDat = `${otherPrep} ${datArt}`;
  const otherAkk = `${otherPrep} ${akkArt}`;

  const correct = cas === "dativ" ? datDisplay : akkDisplay;
  const wrong1 = cas === "dativ" ? akkDisplay : datDisplay;
  const wrong2 = CONTRACTIONS[otherDat] ?? otherDat;
  const wrong3 = CONTRACTIONS[otherAkk] ?? otherAkk;

  const pool = [correct, wrong1, wrong2, wrong3];
  // Deduplicate
  const unique = [...new Set(pool)];
  while (unique.length < 4) {
    const randomPrep = pick(otherPreps);
    const randomArt = pick(["dem", "der", "den", "die", "das"]);
    const opt = CONTRACTIONS[`${randomPrep} ${randomArt}`] ?? `${randomPrep} ${randomArt}`;
    if (!unique.includes(opt)) unique.push(opt);
  }
  return shuffle(unique.slice(0, 4));
}

// ─── Block D: Feste Präpositionen ──────────────────────────────

function generateFesteQuestion(conceptId: string): GrammarQuestion {
  const parts = conceptId.split("-");
  const prep = parts[1];
  const caseAbbr = parts[2];
  const cas: Case = caseAbbr === "dat" ? "dativ" : "akkusativ";

  // Find matching template
  const templates = FESTE_TEMPLATES.filter(t => t.prep === prep);
  const tmpl = templates.length > 0 ? pick(templates) : null;

  let display: string;
  let answer: string;
  const altAnswers: string[] = [];

  if (tmpl) {
    const gender = tmpl.nounGender ?? pick(["m", "f", "n"] as Gender[]);
    const noun = pick(getNounsByGender(gender));
    const article = DER_GRUPPE[cas][gender];
    const { display: answerStr, alt } = contract(prep, article);
    answer = answerStr;
    if (alt) altAnswers.push(alt);
    if (EXPANSIONS[answerStr]) altAnswers.push(EXPANSIONS[answerStr]);

    display = tmpl.template
      .replace("{blank}", "___")
      .replace("{noun}", noun.noun)
      .replace("Freund", noun.noun)
      .replace("Hause", noun.noun);
  } else {
    // Fallback
    const noun = pick(NOUNS);
    const article = DER_GRUPPE[cas][noun.gender];
    const { display: answerStr, alt } = contract(prep, article);
    answer = answerStr;
    if (alt) altAnswers.push(alt);
    display = `___ ${noun.noun}`;
  }

  const caseLabel = cas === "dativ" ? "Dativ" : "Akkusativ";

  // MC options
  const allPreps = [...FESTE_DATIV, ...FESTE_AKKUSATIV];
  const otherPreps = allPreps.filter(p => p !== prep);
  // Use same article but different preps
  const articlePart = answer.includes(" ") ? answer.split(" ").slice(1).join(" ") : "";
  const options: string[] = [answer];
  for (const op of shuffle([...otherPreps]).slice(0, 3)) {
    if (articlePart) {
      const full = `${op} ${articlePart}`;
      options.push(CONTRACTIONS[full] ?? full);
    } else {
      options.push(op);
    }
  }

  return {
    id: `${conceptId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    block: "D",
    conceptId,
    display,
    answer,
    altAnswers,
    options: shuffle(options),
    hint: `${prep} → altijd ${caseLabel}`,
    explanation: `"${prep}" staat altijd met de ${caseLabel}`,
  };
}

// ─── Public API ─────────────────────────────────────────────────

const GENERATORS: Record<GrammarBlock, (conceptId: string) => GrammarQuestion> = {
  A: generateDerQuestion,
  B: generateEinQuestion,
  C: generateWechselQuestion,
  D: generateFesteQuestion,
};

/** Generate a question for a specific concept */
export function generateQuestion(conceptId: string): GrammarQuestion {
  const concept = ALL_CONCEPTS.find(c => c.id === conceptId);
  if (!concept) throw new Error(`Unknown concept: ${conceptId}`);
  return GENERATORS[concept.block](conceptId);
}

/** Generate questions for a list of concept IDs */
export function generateSession(conceptIds: string[]): GrammarQuestion[] {
  return conceptIds.map(id => generateQuestion(id));
}

/** Generate all questions for a block */
export function generateBlock(block: GrammarBlock): GrammarQuestion[] {
  const concepts = getConceptsByBlock(block);
  return shuffle(concepts).map(c => generateQuestion(c.id));
}

/** Check if user answer matches */
export function checkGrammarAnswer(userInput: string, question: GrammarQuestion): boolean {
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const input = clean(userInput);
  if (input === clean(question.answer)) return true;
  return question.altAnswers.some(alt => input === clean(alt));
}

// ─── Block metadata ─────────────────────────────────────────────

export const GRAMMAR_BLOCKS: { block: GrammarBlock; title: string; description: string; icon: string }[] = [
  { block: "A", title: "Der-Gruppe", description: "Lidwoorden: der/die/das → dem/den/der", icon: "📖" },
  { block: "B", title: "Ein-Gruppe", description: "ein/eine/kein + bezittelijk voornaamwoord", icon: "📝" },
  { block: "C", title: "Wechselpräpositionen", description: "Wo (Dativ) of Wohin (Akkusativ)?", icon: "🔄" },
  { block: "D", title: "Feste Präpositionen", description: "Voorzetsels met vast naamval", icon: "📌" },
];

// ─── Registry helper ────────────────────────────────────────────

/** IDs of lists that have a grammar generator */
export const GRAMMAR_GENERATOR_LISTS = ["k3-m3-de-gram-k46"];

/** Check if a list uses generated grammar exercises */
export function hasGrammarGenerator(listId: string): boolean {
  return GRAMMAR_GENERATOR_LISTS.includes(listId);
}

/** Get concepts as pseudo-Word objects for Leitner compatibility */
export function getConceptsAsWords() {
  return ALL_CONCEPTS.map(c => ({
    id: c.id,
    term: c.label,
    definition: c.shortLabel,
  }));
}
