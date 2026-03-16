// German grammar data: Alle Tijden (haben/sein/werden + hulpwerkwoord keuze)
// Source: Deutsch macht Spass, Klas 3 Module 1

// ─── Types ──────────────────────────────────────────────────────

export type Person = 1 | 2 | 3;
export type Numerus = "sg" | "pl";
export type Tense = "praesens" | "praeteritum";
export type Verb = "haben" | "sein" | "werden";

export interface ConjugationTable {
  [tense: string]: {
    [person: number]: {
      [numerus: string]: string;
    };
  };
}

// ─── Labels ─────────────────────────────────────────────────────

export const PERSON_LABELS: Record<string, string> = {
  "1sg": "ich",
  "2sg": "du",
  "3sg": "er/sie/es",
  "1pl": "wir",
  "2pl": "ihr",
  "3pl": "sie/Sie",
};

export const TENSE_LABELS: Record<Tense, string> = {
  praesens: "Präsens",
  praeteritum: "Präteritum",
};

export const VERB_LABELS: Record<Verb, string> = {
  haben: "haben",
  sein: "sein",
  werden: "werden",
};

// ─── Conjugation tables ─────────────────────────────────────────

export const CONJUGATIONS: Record<Verb, Record<Tense, Record<Person, Record<Numerus, string>>>> = {
  haben: {
    praesens: {
      1: { sg: "habe", pl: "haben" },
      2: { sg: "hast", pl: "habt" },
      3: { sg: "hat", pl: "haben" },
    },
    praeteritum: {
      1: { sg: "hatte", pl: "hatten" },
      2: { sg: "hattest", pl: "hattet" },
      3: { sg: "hatte", pl: "hatten" },
    },
  },
  sein: {
    praesens: {
      1: { sg: "bin", pl: "sind" },
      2: { sg: "bist", pl: "seid" },
      3: { sg: "ist", pl: "sind" },
    },
    praeteritum: {
      1: { sg: "war", pl: "waren" },
      2: { sg: "warst", pl: "wart" },
      3: { sg: "war", pl: "waren" },
    },
  },
  werden: {
    praesens: {
      1: { sg: "werde", pl: "werden" },
      2: { sg: "wirst", pl: "werdet" },
      3: { sg: "wird", pl: "werden" },
    },
    praeteritum: {
      1: { sg: "wurde", pl: "wurden" },
      2: { sg: "wurdest", pl: "wurdet" },
      3: { sg: "wurde", pl: "wurden" },
    },
  },
};

// ─── Partizip II + hulpwerkwoord keuze ──────────────────────────

export interface PerfektVerb {
  infinitiv: string;
  partizipII: string;
  auxiliary: "haben" | "sein";
  meaning: string;
}

export const PERFEKT_VERBS: PerfektVerb[] = [
  // met "haben"
  { infinitiv: "machen", partizipII: "gemacht", auxiliary: "haben", meaning: "maken" },
  { infinitiv: "spielen", partizipII: "gespielt", auxiliary: "haben", meaning: "spelen" },
  { infinitiv: "kaufen", partizipII: "gekauft", auxiliary: "haben", meaning: "kopen" },
  { infinitiv: "lernen", partizipII: "gelernt", auxiliary: "haben", meaning: "leren" },
  { infinitiv: "sagen", partizipII: "gesagt", auxiliary: "haben", meaning: "zeggen" },
  { infinitiv: "essen", partizipII: "gegessen", auxiliary: "haben", meaning: "eten" },
  { infinitiv: "trinken", partizipII: "getrunken", auxiliary: "haben", meaning: "drinken" },
  { infinitiv: "lesen", partizipII: "gelesen", auxiliary: "haben", meaning: "lezen" },
  { infinitiv: "schreiben", partizipII: "geschrieben", auxiliary: "haben", meaning: "schrijven" },
  { infinitiv: "finden", partizipII: "gefunden", auxiliary: "haben", meaning: "vinden" },
  { infinitiv: "schlafen", partizipII: "geschlafen", auxiliary: "haben", meaning: "slapen" },
  { infinitiv: "sehen", partizipII: "gesehen", auxiliary: "haben", meaning: "zien" },
  { infinitiv: "helfen", partizipII: "geholfen", auxiliary: "haben", meaning: "helpen" },
  { infinitiv: "nehmen", partizipII: "genommen", auxiliary: "haben", meaning: "nemen/pakken" },
  { infinitiv: "sprechen", partizipII: "gesprochen", auxiliary: "haben", meaning: "spreken" },
  { infinitiv: "singen", partizipII: "gesungen", auxiliary: "haben", meaning: "zingen" },
  { infinitiv: "bringen", partizipII: "gebracht", auxiliary: "haben", meaning: "brengen" },
  { infinitiv: "denken", partizipII: "gedacht", auxiliary: "haben", meaning: "denken" },
  { infinitiv: "wissen", partizipII: "gewusst", auxiliary: "haben", meaning: "weten" },
  // met "sein" (beweging/toestandsverandering)
  { infinitiv: "gehen", partizipII: "gegangen", auxiliary: "sein", meaning: "gaan/lopen" },
  { infinitiv: "kommen", partizipII: "gekommen", auxiliary: "sein", meaning: "komen" },
  { infinitiv: "fahren", partizipII: "gefahren", auxiliary: "sein", meaning: "rijden" },
  { infinitiv: "laufen", partizipII: "gelaufen", auxiliary: "sein", meaning: "rennen/lopen" },
  { infinitiv: "fliegen", partizipII: "geflogen", auxiliary: "sein", meaning: "vliegen" },
  { infinitiv: "schwimmen", partizipII: "geschwommen", auxiliary: "sein", meaning: "zwemmen" },
  { infinitiv: "fallen", partizipII: "gefallen", auxiliary: "sein", meaning: "vallen" },
  { infinitiv: "sterben", partizipII: "gestorben", auxiliary: "sein", meaning: "sterven" },
  { infinitiv: "bleiben", partizipII: "geblieben", auxiliary: "sein", meaning: "blijven" },
  { infinitiv: "werden", partizipII: "geworden", auxiliary: "sein", meaning: "worden" },
  { infinitiv: "sein", partizipII: "gewesen", auxiliary: "sein", meaning: "zijn" },
];

// ─── Sentence templates for conjugation practice ────────────────

export interface TenseTemplate {
  /** Template with {blank} for the verb form */
  template: string;
  verb: Verb;
  person: Person;
  numerus: Numerus;
}

export const TENSE_TEMPLATES: TenseTemplate[] = [
  // ── haben ──
  // ich
  { template: "Ich {blank} einen neuen Computer.", verb: "haben", person: 1, numerus: "sg" },
  { template: "Ich {blank} Hunger.", verb: "haben", person: 1, numerus: "sg" },
  { template: "Ich {blank} keine Zeit.", verb: "haben", person: 1, numerus: "sg" },
  // du
  { template: "Du {blank} ein gutes Buch.", verb: "haben", person: 2, numerus: "sg" },
  { template: "{blank} du einen Hund?", verb: "haben", person: 2, numerus: "sg" },
  { template: "Du {blank} recht.", verb: "haben", person: 2, numerus: "sg" },
  // er/sie/es
  { template: "Er {blank} viele Freunde.", verb: "haben", person: 3, numerus: "sg" },
  { template: "Sie {blank} eine Katze.", verb: "haben", person: 3, numerus: "sg" },
  { template: "Er {blank} Angst.", verb: "haben", person: 3, numerus: "sg" },
  // wir
  { template: "Wir {blank} viel Spaß.", verb: "haben", person: 1, numerus: "pl" },
  { template: "Wir {blank} morgen frei.", verb: "haben", person: 1, numerus: "pl" },
  // ihr
  { template: "{blank} ihr morgen Zeit?", verb: "haben", person: 2, numerus: "pl" },
  { template: "Ihr {blank} Glück gehabt.", verb: "haben", person: 2, numerus: "pl" },
  // sie/Sie
  { template: "Sie {blank} viel Geduld.", verb: "haben", person: 3, numerus: "pl" },
  { template: "Sie {blank} drei Kinder.", verb: "haben", person: 3, numerus: "pl" },

  // ── sein ──
  // ich
  { template: "Ich {blank} sehr müde.", verb: "sein", person: 1, numerus: "sg" },
  { template: "Ich {blank} heute zu Hause.", verb: "sein", person: 1, numerus: "sg" },
  { template: "Ich {blank} 15 Jahre alt.", verb: "sein", person: 1, numerus: "sg" },
  // du
  { template: "Du {blank} sehr nett.", verb: "sein", person: 2, numerus: "sg" },
  { template: "{blank} du krank?", verb: "sein", person: 2, numerus: "sg" },
  { template: "Du {blank} mein bester Freund.", verb: "sein", person: 2, numerus: "sg" },
  // er/sie/es
  { template: "Sie {blank} eine gute Lehrerin.", verb: "sein", person: 3, numerus: "sg" },
  { template: "Es {blank} kalt draußen.", verb: "sein", person: 3, numerus: "sg" },
  { template: "Er {blank} Schauspieler.", verb: "sein", person: 3, numerus: "sg" },
  // wir
  { template: "Wir {blank} in Berlin.", verb: "sein", person: 1, numerus: "pl" },
  { template: "Wir {blank} sehr froh.", verb: "sein", person: 1, numerus: "pl" },
  // ihr
  { template: "Ihr {blank} sehr fleißig.", verb: "sein", person: 2, numerus: "pl" },
  { template: "{blank} ihr fertig?", verb: "sein", person: 2, numerus: "pl" },
  // sie/Sie
  { template: "Sie {blank} in der Schweiz.", verb: "sein", person: 3, numerus: "pl" },
  { template: "Sie {blank} sehr freundlich.", verb: "sein", person: 3, numerus: "pl" },

  // ── werden ──
  // ich
  { template: "Ich {blank} morgen 15 Jahre alt.", verb: "werden", person: 1, numerus: "sg" },
  { template: "Ich {blank} Arzt.", verb: "werden", person: 1, numerus: "sg" },
  // du
  { template: "Du {blank} bestimmt Arzt.", verb: "werden", person: 2, numerus: "sg" },
  { template: "Du {blank} immer besser.", verb: "werden", person: 2, numerus: "sg" },
  // er/sie/es
  { template: "Er {blank} Schauspieler.", verb: "werden", person: 3, numerus: "sg" },
  { template: "Es {blank} langsam dunkel.", verb: "werden", person: 3, numerus: "sg" },
  { template: "Sie {blank} Lehrerin.", verb: "werden", person: 3, numerus: "sg" },
  // wir
  { template: "Wir {blank} alle älter.", verb: "werden", person: 1, numerus: "pl" },
  { template: "Wir {blank} nächstes Jahr 16.", verb: "werden", person: 1, numerus: "pl" },
  // ihr
  { template: "Ihr {blank} bestimmt gute Schüler.", verb: "werden", person: 2, numerus: "pl" },
  { template: "Ihr {blank} immer besser.", verb: "werden", person: 2, numerus: "pl" },
  // sie/Sie
  { template: "Sie {blank} nächstes Jahr studieren.", verb: "werden", person: 3, numerus: "pl" },
  { template: "Die Tage {blank} kürzer.", verb: "werden", person: 3, numerus: "pl" },
];

// ─── Futur I templates ──────────────────────────────────────────

export interface FuturTemplate {
  template: string;
  infinitiv: string;
  meaning: string;
}

export const FUTUR_TEMPLATES: FuturTemplate[] = [
  { template: "Ich ___ morgen nach Berlin fahren.", infinitiv: "fahren", meaning: "Ik zal morgen naar Berlijn rijden." },
  { template: "Du ___ das bestimmt schaffen.", infinitiv: "schaffen", meaning: "Jij zult dat zeker halen." },
  { template: "Er ___ nächste Woche kommen.", infinitiv: "kommen", meaning: "Hij zal volgende week komen." },
  { template: "Wir ___ zusammen lernen.", infinitiv: "lernen", meaning: "Wij zullen samen leren." },
  { template: "Ihr ___ das Spiel gewinnen.", infinitiv: "gewinnen", meaning: "Jullie zullen het spel winnen." },
  { template: "Sie ___ uns helfen.", infinitiv: "helfen", meaning: "Zij zullen ons helpen." },
];
