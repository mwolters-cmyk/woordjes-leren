// German grammar data: Fälle (cases) & Wechselpräpositionen
// Source: Deutsch macht Spass, Kapitel 4+6

// ─── Types ──────────────────────────────────────────────────────

export type Gender = "m" | "f" | "n";
export type Case = "nominativ" | "dativ" | "akkusativ";
export type PrepContext = "wo" | "wohin" | "zeit";

export interface GermanNoun {
  noun: string;
  gender: Gender;
  plural: string;
  /** Does plural already end in -n or -s? (skip extra -n in Dativ plural) */
  pluralEndsNS: boolean;
}

export interface PrepTemplate {
  /** Sentence template — use {blank} for the answer slot */
  template: string;
  prep: string;
  case: Case;
  context: PrepContext;
  /** Which gender noun to pick (null = any) */
  nounGender?: Gender;
}

export interface FesteTemplate {
  template: string;
  prep: string;
  case: "dativ" | "akkusativ";
  nounGender?: Gender;
}

// ─── Nouns (common, concrete nouns students know) ───────────────

export const NOUNS: GermanNoun[] = [
  // Mannelijk
  { noun: "Tisch", gender: "m", plural: "Tische", pluralEndsNS: false },
  { noun: "Stuhl", gender: "m", plural: "Stühle", pluralEndsNS: false },
  { noun: "Hund", gender: "m", plural: "Hunde", pluralEndsNS: false },
  { noun: "Garten", gender: "m", plural: "Gärten", pluralEndsNS: true },
  { noun: "Baum", gender: "m", plural: "Bäume", pluralEndsNS: false },
  { noun: "Bus", gender: "m", plural: "Busse", pluralEndsNS: false },
  { noun: "Schrank", gender: "m", plural: "Schränke", pluralEndsNS: false },
  { noun: "Mann", gender: "m", plural: "Männer", pluralEndsNS: false },
  { noun: "Arzt", gender: "m", plural: "Ärzte", pluralEndsNS: false },
  { noun: "Freund", gender: "m", plural: "Freunde", pluralEndsNS: false },
  // Vrouwelijk
  { noun: "Tasche", gender: "f", plural: "Taschen", pluralEndsNS: true },
  { noun: "Schule", gender: "f", plural: "Schulen", pluralEndsNS: true },
  { noun: "Lampe", gender: "f", plural: "Lampen", pluralEndsNS: true },
  { noun: "Wand", gender: "f", plural: "Wände", pluralEndsNS: false },
  { noun: "Tür", gender: "f", plural: "Türen", pluralEndsNS: true },
  { noun: "Straße", gender: "f", plural: "Straßen", pluralEndsNS: true },
  { noun: "Stadt", gender: "f", plural: "Städte", pluralEndsNS: false },
  { noun: "Frau", gender: "f", plural: "Frauen", pluralEndsNS: true },
  { noun: "Katze", gender: "f", plural: "Katzen", pluralEndsNS: true },
  { noun: "Kirche", gender: "f", plural: "Kirchen", pluralEndsNS: true },
  // Onzijdig
  { noun: "Fenster", gender: "n", plural: "Fenster", pluralEndsNS: false },
  { noun: "Haus", gender: "n", plural: "Häuser", pluralEndsNS: false },
  { noun: "Auto", gender: "n", plural: "Autos", pluralEndsNS: true },
  { noun: "Buch", gender: "n", plural: "Bücher", pluralEndsNS: false },
  { noun: "Bett", gender: "n", plural: "Betten", pluralEndsNS: true },
  { noun: "Kind", gender: "n", plural: "Kinder", pluralEndsNS: false },
  { noun: "Regal", gender: "n", plural: "Regale", pluralEndsNS: false },
  { noun: "Sofa", gender: "n", plural: "Sofas", pluralEndsNS: true },
  { noun: "Krankenhaus", gender: "n", plural: "Krankenhäuser", pluralEndsNS: false },
  { noun: "Bild", gender: "n", plural: "Bilder", pluralEndsNS: false },
];

// ─── Der-Gruppe (definite articles) ─────────────────────────────

export const DER_GRUPPE: Record<Case, Record<Gender | "pl", string>> = {
  nominativ: { m: "der", f: "die", n: "das", pl: "die" },
  dativ:     { m: "dem", f: "der", n: "dem", pl: "den" },
  akkusativ: { m: "den", f: "die", n: "das", pl: "die" },
};

// ─── Ein-Gruppe (indefinite articles) ───────────────────────────

export const EIN_GRUPPE: Record<Case, Record<Gender | "pl", string>> = {
  nominativ: { m: "ein",   f: "eine",  n: "ein",   pl: "keine" },
  dativ:     { m: "einem", f: "einer", n: "einem", pl: "keinen" },
  akkusativ: { m: "einen", f: "eine",  n: "ein",   pl: "keine" },
};

// Possessive pronouns follow ein-Gruppe pattern
export const POSSESSIVES = ["mein", "dein", "sein", "ihr", "unser", "euer"] as const;

/** Get possessive form for given case + gender */
export function getPossessiveForm(
  possessive: string,
  cas: Case,
  gender: Gender | "pl"
): string {
  const suffix = EIN_GRUPPE[cas][gender].replace(/^(k?ein)/, "");
  // "euer" drops the inner -e- when adding suffix
  if (possessive === "euer" && suffix) return "eur" + suffix;
  return possessive + suffix;
}

// ─── Contracted forms (Verschmelzung) ───────────────────────────

export const CONTRACTIONS: Record<string, string> = {
  "an dem": "am",
  "in dem": "im",
  "an das": "ans",
  "in das": "ins",
  "von dem": "vom",
  "zu dem": "zum",
  "zu der": "zur",
  "bei dem": "beim",
};

// Reverse: am → an dem, etc.
export const EXPANSIONS: Record<string, string> = {};
for (const [expanded, contracted] of Object.entries(CONTRACTIONS)) {
  EXPANSIONS[contracted] = expanded;
}

// ─── Wechselpräpositionen ──────────────────────────────────────

export const WECHSEL_PREPS = [
  { prep: "an",       nl: "aan, bij" },
  { prep: "auf",      nl: "op" },
  { prep: "hinter",   nl: "achter" },
  { prep: "neben",    nl: "naast" },
  { prep: "in",       nl: "in" },
  { prep: "über",     nl: "boven, over" },
  { prep: "unter",    nl: "onder" },
  { prep: "vor",      nl: "voor" },
  { prep: "zwischen", nl: "tussen" },
] as const;

// Sentence templates for Wechselpräpositionen
// {blank} = where the answer goes (prep + article)
// {noun} = replaced with a random noun of the right gender
export const WECHSEL_TEMPLATES: PrepTemplate[] = [
  // an
  { template: "Ich stehe {blank} {noun}", prep: "an", case: "dativ", context: "wo", nounGender: "n" },
  { template: "Ich stelle mich {blank} {noun}", prep: "an", case: "akkusativ", context: "wohin", nounGender: "n" },
  { template: "Das Bild hängt {blank} {noun}", prep: "an", case: "dativ", context: "wo", nounGender: "f" },
  { template: "Ich hänge das Bild {blank} {noun}", prep: "an", case: "akkusativ", context: "wohin", nounGender: "f" },
  // auf
  { template: "Das Heft liegt {blank} {noun}", prep: "auf", case: "dativ", context: "wo", nounGender: "m" },
  { template: "Ich lege das Heft {blank} {noun}", prep: "auf", case: "akkusativ", context: "wohin", nounGender: "m" },
  { template: "Die Katze sitzt {blank} {noun}", prep: "auf", case: "dativ", context: "wo", nounGender: "m" },
  { template: "Die Katze springt {blank} {noun}", prep: "auf", case: "akkusativ", context: "wohin", nounGender: "m" },
  // in
  { template: "Ich bin {blank} {noun}", prep: "in", case: "dativ", context: "wo", nounGender: "f" },
  { template: "Ich gehe {blank} {noun}", prep: "in", case: "akkusativ", context: "wohin", nounGender: "f" },
  { template: "Die Kinder spielen {blank} {noun}", prep: "in", case: "dativ", context: "wo", nounGender: "m" },
  { template: "Die Kinder laufen {blank} {noun}", prep: "in", case: "akkusativ", context: "wohin", nounGender: "m" },
  // hinter
  { template: "Der Hund steht {blank} {noun}", prep: "hinter", case: "dativ", context: "wo" },
  { template: "Der Hund läuft {blank} {noun}", prep: "hinter", case: "akkusativ", context: "wohin" },
  // neben
  { template: "Der Wagen steht {blank} {noun}", prep: "neben", case: "dativ", context: "wo" },
  { template: "Ich stelle den Wagen {blank} {noun}", prep: "neben", case: "akkusativ", context: "wohin" },
  // über
  { template: "Die Lampe hängt {blank} {noun}", prep: "über", case: "dativ", context: "wo", nounGender: "m" },
  { template: "Ich hänge die Lampe {blank} {noun}", prep: "über", case: "akkusativ", context: "wohin", nounGender: "m" },
  // unter
  { template: "Der Teppich liegt {blank} {noun}", prep: "unter", case: "dativ", context: "wo", nounGender: "m" },
  { template: "Ich lege den Teppich {blank} {noun}", prep: "unter", case: "akkusativ", context: "wohin", nounGender: "m" },
  // vor
  { template: "Das Auto steht {blank} {noun}", prep: "vor", case: "dativ", context: "wo" },
  { template: "Sie fährt das Auto {blank} {noun}", prep: "vor", case: "akkusativ", context: "wohin" },
  // zwischen
  { template: "Er sitzt {blank} {noun}", prep: "zwischen", case: "dativ", context: "wo" },
  { template: "Er setzt sich {blank} {noun}", prep: "zwischen", case: "akkusativ", context: "wohin" },
  // Tijdsbepalingen (always Dativ)
  { template: "Er kommt {blank} Woche", prep: "in", case: "dativ", context: "zeit" },
  { template: "Es geschah {blank} Jahr", prep: "vor", case: "dativ", context: "zeit" },
];

// ─── Feste Präpositionen ────────────────────────────────────────

export const FESTE_DATIV = ["aus", "bei", "mit", "nach", "seit", "von", "zu"] as const;
export const FESTE_AKKUSATIV = ["bis", "durch", "für", "gegen", "ohne", "um"] as const;

export const FESTE_TEMPLATES: FesteTemplate[] = [
  // Dativ
  { template: "Ich komme {blank} {noun}", prep: "aus", case: "dativ" },
  { template: "Ich wohne {blank} Freund", prep: "bei", case: "dativ", nounGender: "m" },
  { template: "Ich fahre {blank} {noun}", prep: "mit", case: "dativ", nounGender: "m" },
  { template: "Er geht {blank} Hause", prep: "nach", case: "dativ" },
  { template: "Ich warte {blank} einer Stunde", prep: "seit", case: "dativ" },
  { template: "Das Geschenk ist {blank} {noun}", prep: "von", case: "dativ" },
  { template: "Ich gehe {blank} {noun}", prep: "zu", case: "dativ" },
  { template: "Wir fahren {blank} {noun}", prep: "zu", case: "dativ" },
  // Akkusativ
  { template: "Ich laufe {blank} {noun}", prep: "durch", case: "akkusativ" },
  { template: "Das Geschenk ist {blank} {noun}", prep: "für", case: "akkusativ" },
  { template: "Er spielt {blank} {noun}", prep: "gegen", case: "akkusativ" },
  { template: "Ich gehe {blank} {noun} spazieren", prep: "ohne", case: "akkusativ" },
  { template: "Wir sitzen {blank} {noun}", prep: "um", case: "akkusativ", nounGender: "m" },
];

// ─── Case identification: sentence templates ───────────────────

export interface CaseTemplate {
  template: string;
  blankRole: Case;
  nounGender?: Gender;
}

export const CASE_TEMPLATES: CaseTemplate[] = [
  // Nominativ (onderwerp)
  { template: "{blank} ist groß", blankRole: "nominativ" },
  { template: "{blank} kommt morgen", blankRole: "nominativ" },
  { template: "{blank} spielt im Garten", blankRole: "nominativ" },
  { template: "{blank} ist sehr freundlich", blankRole: "nominativ" },
  // Akkusativ (lijdend voorwerp)
  { template: "Ich sehe {blank}", blankRole: "akkusativ" },
  { template: "Sie hat {blank}", blankRole: "akkusativ" },
  { template: "Wir besuchen {blank}", blankRole: "akkusativ" },
  { template: "Er kauft {blank}", blankRole: "akkusativ" },
  { template: "Ich finde {blank} nett", blankRole: "akkusativ" },
  // Dativ (meewerkend voorwerp)
  { template: "Ich helfe {blank}", blankRole: "dativ" },
  { template: "Das Buch gehört {blank}", blankRole: "dativ" },
  { template: "Ich gebe {blank} das Buch", blankRole: "dativ" },
  { template: "Er antwortet {blank}", blankRole: "dativ" },
  { template: "Ich danke {blank}", blankRole: "dativ" },
];
