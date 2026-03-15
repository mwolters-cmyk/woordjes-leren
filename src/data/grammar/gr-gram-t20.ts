// Greek grammar data: Grammatica t/m Les 20 (Argo)
// Betrekkelijk vnw, gemengde groep naamwoorden, conjunctivus

// ─── Types ──────────────────────────────────────────────────────

export type GreekCase = "nom" | "gen" | "dat" | "acc";
export type GreekNumber = "sg" | "pl";
export type GreekGender = "m" | "f" | "n";
export type GreekPerson = 1 | 2 | 3;
export type GreekVoice = "act" | "med";
export type GreekTense = "praes" | "aor";

// ─── Betrekkelijk voornaamwoord ὅς, ἥ, ὅ ───────────────────────

export const RELATIVE_PRONOUN: Record<GreekNumber, Record<GreekCase, Record<GreekGender, string>>> = {
  sg: {
    nom: { m: "ὅς",  f: "ἥ",   n: "ὅ" },
    gen: { m: "οὗ",  f: "ἧς",  n: "οὗ" },
    dat: { m: "ᾧ",   f: "ᾗ",   n: "ᾧ" },
    acc: { m: "ὅν",  f: "ἥν",  n: "ὅ" },
  },
  pl: {
    nom: { m: "οἵ",  f: "αἵ",  n: "ἅ" },
    gen: { m: "ὧν",  f: "ὧν",  n: "ὧν" },
    dat: { m: "οἷς", f: "αἷς", n: "οἷς" },
    acc: { m: "οὕς", f: "ἅς",  n: "ἅ" },
  },
};

// ─── Gemengde groep: πόλις-type ─────────────────────────────────

export interface NounDeclension {
  lemma: string;
  meaning: string;
  article: string;
  forms: Record<GreekNumber, Record<GreekCase, string>>;
}

export const POLIS: NounDeclension = {
  lemma: "πόλις",
  meaning: "stad",
  article: "ἡ",
  forms: {
    sg: { nom: "πόλις", gen: "πόλεως", dat: "πόλει", acc: "πόλιν" },
    pl: { nom: "πόλεις", gen: "πόλεων", dat: "πόλεσι(ν)", acc: "πόλεις" },
  },
};

export const BASILEUS: NounDeclension = {
  lemma: "βασιλεύς",
  meaning: "koning",
  article: "ὁ",
  forms: {
    sg: { nom: "βασιλεύς", gen: "βασιλέως", dat: "βασιλεῖ", acc: "βασιλέα" },
    pl: { nom: "βασιλεῖς", gen: "βασιλέων", dat: "βασιλεῦσι(ν)", acc: "βασιλέας" },
  },
};

export const NAUS: NounDeclension = {
  lemma: "ναῦς",
  meaning: "schip",
  article: "ἡ",
  forms: {
    sg: { nom: "ναῦς", gen: "νεώς", dat: "νηΐ", acc: "ναῦν" },
    pl: { nom: "νῆες", gen: "νεῶν", dat: "ναυσί(ν)", acc: "ναῦς" },
  },
};

export const BOUS: NounDeclension = {
  lemma: "βοῦς",
  meaning: "rund",
  article: "ὁ",
  forms: {
    sg: { nom: "βοῦς", gen: "βοός", dat: "βοΐ", acc: "βοῦν" },
    pl: { nom: "βόες", gen: "βοῶν", dat: "βουσί(ν)", acc: "βοῦς" },
  },
};

export const ALL_NOUNS = [POLIS, BASILEUS, NAUS, BOUS];

// ─── Bijvoeglijk naamwoord ἡδύς ─────────────────────────────────

export const HEDUS: Record<GreekNumber, Record<GreekCase, Record<GreekGender, string>>> = {
  sg: {
    nom: { m: "ἡδύς",   f: "ἡδεῖα",   n: "ἡδύ" },
    gen: { m: "ἡδέος",  f: "ἡδείας",  n: "ἡδέος" },
    dat: { m: "ἡδεῖ",   f: "ἡδείᾳ",   n: "ἡδεῖ" },
    acc: { m: "ἡδύν",   f: "ἡδεῖαν",  n: "ἡδύ" },
  },
  pl: {
    nom: { m: "ἡδεῖς",  f: "ἡδεῖαι",  n: "ἡδέα" },
    gen: { m: "ἡδέων",  f: "ἡδειῶν",  n: "ἡδέων" },
    dat: { m: "ἡδέσι(ν)", f: "ἡδείαις", n: "ἡδέσι(ν)" },
    acc: { m: "ἡδεῖς",  f: "ἡδείας",  n: "ἡδέα" },
  },
};

// ─── Conjunctivus λύω ───────────────────────────────────────────

export const CONJUNCTIVUS: Record<GreekTense, Record<GreekVoice, Record<GreekPerson, Record<GreekNumber, string>>>> = {
  praes: {
    act: {
      1: { sg: "λύω",    pl: "λύωμεν" },
      2: { sg: "λύῃς",   pl: "λύητε" },
      3: { sg: "λύῃ",    pl: "λύωσι(ν)" },
    },
    med: {
      1: { sg: "λύωμαι",   pl: "λυώμεθα" },
      2: { sg: "λύῃ",      pl: "λύησθε" },
      3: { sg: "λύηται",   pl: "λύωνται" },
    },
  },
  aor: {
    act: {
      1: { sg: "λύσω",    pl: "λύσωμεν" },
      2: { sg: "λύσῃς",   pl: "λύσητε" },
      3: { sg: "λύσῃ",    pl: "λύσωσι(ν)" },
    },
    med: {
      1: { sg: "λύσωμαι",   pl: "λυσώμεθα" },
      2: { sg: "λύσῃ",      pl: "λύσησθε" },
      3: { sg: "λύσηται",   pl: "λύσωνται" },
    },
  },
};

// ─── Conjunctivus gebruik ───────────────────────────────────────

export interface ConjUsageExample {
  id: string;
  type: string;
  label: string;
  description: string;
  examples: { greek: string; dutch: string }[];
}

export const CONJ_USAGE: ConjUsageExample[] = [
  {
    id: "dubitativus",
    type: "hoofdzin",
    label: "Dubitativus (twijfelvraag)",
    description: "1e persoon, twijfel: 'zal ik...?'",
    examples: [
      { greek: "τί εἴπω;", dutch: "Wat moet ik zeggen?" },
      { greek: "ποῖ φύγωμεν;", dutch: "Waarheen moeten wij vluchten?" },
    ],
  },
  {
    id: "adhortativus",
    type: "hoofdzin",
    label: "Adhortativus (aansporing)",
    description: "1e persoon meervoud: 'laten wij...'",
    examples: [
      { greek: "σπεύδωμεν", dutch: "Laten wij ons haasten" },
      { greek: "ἴωμεν", dutch: "Laten wij gaan" },
    ],
  },
  {
    id: "verbod",
    type: "hoofdzin",
    label: "Verbod (μή + conj. aor.)",
    description: "2e persoon, μή + conjunctivus aoristus",
    examples: [
      { greek: "μὴ τοῦτο ποιήσῃς", dutch: "Doe dit niet!" },
      { greek: "μὴ φύγητε", dutch: "Vlucht niet!" },
    ],
  },
  {
    id: "hina",
    type: "bijzin",
    label: "Doelzin met ἵνα",
    description: "ἵνα + conjunctivus = opdat, om te",
    examples: [
      { greek: "τρέχει ἵνα νικήσῃ", dutch: "Hij rent opdat hij wint" },
    ],
  },
  {
    id: "hopos",
    type: "bijzin",
    label: "Doelzin met ὅπως",
    description: "ὅπως + conjunctivus = opdat, om te",
    examples: [
      { greek: "μάχεται ὅπως τὴν πόλιν σώσῃ", dutch: "Hij vecht om de stad te redden" },
    ],
  },
  {
    id: "hos-conj",
    type: "bijzin",
    label: "Doelzin met ὡς",
    description: "ὡς + conjunctivus = opdat, om te",
    examples: [
      { greek: "πέμπει ἄγγελον ὡς εἴπῃ", dutch: "Hij stuurt een bode om te zeggen" },
    ],
  },
  {
    id: "ean",
    type: "bijzin",
    label: "Voorwaarde met ἐάν",
    description: "ἐάν (= εἰ ἄν) + conjunctivus = als, indien",
    examples: [
      { greek: "ἐὰν ἔλθῃ, χαιρήσομεν", dutch: "Als hij komt, zullen wij blij zijn" },
    ],
  },
  {
    id: "epean",
    type: "bijzin",
    label: "Tijdsbijzin met ἐπεάν",
    description: "ἐπεάν (= ἐπεὶ ἄν) + conjunctivus = wanneer",
    examples: [
      { greek: "ἐπεὰν ἔλθῃ, λέξω", dutch: "Wanneer hij komt, zal ik spreken" },
    ],
  },
];

// ─── Labels ─────────────────────────────────────────────────────

export const CASE_LABELS: Record<GreekCase, string> = {
  nom: "nominatief",
  gen: "genitief",
  dat: "datief",
  acc: "accusatief",
};

export const NUMBER_LABELS: Record<GreekNumber, string> = {
  sg: "enkelvoud",
  pl: "meervoud",
};

export const GENDER_LABELS: Record<GreekGender, string> = {
  m: "mannelijk",
  f: "vrouwelijk",
  n: "onzijdig",
};

export const PERSON_LABELS: Record<GreekPerson, string> = {
  1: "1e persoon",
  2: "2e persoon",
  3: "3e persoon",
};

export const VOICE_LABELS: Record<GreekVoice, string> = {
  act: "actief",
  med: "medium/passief",
};

export const TENSE_LABELS: Record<GreekTense, string> = {
  praes: "praesens",
  aor: "aoristus",
};
