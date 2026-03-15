import { WordList, Jaarlaag, Module, Language, ListType } from "@/lib/types";
import { getAdminListData } from "@/lib/adminStorage";

// Import example lists with actual words
import frVoorbeeld from "./lists/fr-voorbeeld.json";
import enVoorbeeld from "./lists/en-voorbeeld.json";
import deVoorbeeld from "./lists/de-voorbeeld.json";
import laVoorbeeld from "./lists/la-voorbeeld.json";
import grVoorbeeld from "./lists/gr-voorbeeld.json";
import nlVoorbeeld from "./lists/nl-voorbeeld.json";
import deKap4 from "./lists/k3-m3-de-kap4.json";
import frDelfA2 from "./lists/k3-m3-fr-delf-a2.json";

// Helper to create a placeholder list (no words yet)
function placeholder(
  id: string,
  title: string,
  lang: Language,
  jaarlaag: Jaarlaag,
  mod: Module | undefined,
  listType: ListType,
  source?: string,
  description?: string
): WordList {
  return {
    id,
    title,
    description: description ?? `${title} - wordt binnenkort aangevuld`,
    language: { from: lang, to: "nl" },
    tags: [
      jaarlaag === "bovenbouw" ? "bovenbouw" : `klas${jaarlaag}`,
      ...(mod ? [`module${mod}`] : []),
      listType,
    ],
    words: [],
    jaarlaag,
    module: mod,
    listType,
    source,
  };
}

// Enrich example lists with new fields
function enrichExample(
  data: Record<string, unknown>,
  jaarlaag: Jaarlaag,
  mod: Module,
  listType: ListType
): WordList {
  return { ...(data as unknown as WordList), jaarlaag, module: mod, listType };
}

// ============================================================
// ALL LISTS REGISTRY
// ============================================================

export const ALL_LISTS: WordList[] = [
  // ── Example lists (with actual words) ──────────────────────
  enrichExample(frVoorbeeld, 1, 1, "vocabulary"),
  enrichExample(enVoorbeeld, 1, 1, "vocabulary"),
  enrichExample(deVoorbeeld, 2, 1, "vocabulary"),
  enrichExample(laVoorbeeld, 1, 1, "vocabulary"),
  enrichExample(grVoorbeeld, 1, 1, "vocabulary"),
  enrichExample(nlVoorbeeld, 1, 1, "vocabulary"),

  // ── KLAS 1 ─────────────────────────────────────────────────

  // Klas 1 - Module 1
  placeholder("k1-m1-fr-voc-u0", "Frans - Vocabulaire Unit 0", "fr", 1, 1, "vocabulary", "Grandes Lignes"),
  placeholder("k1-m1-fr-voc-u1", "Frans - Vocabulaire Unit 1", "fr", 1, 1, "vocabulary", "Grandes Lignes"),
  placeholder("k1-m1-fr-gram-u1", "Frans - Grammaire Unit 1", "fr", 1, 1, "grammar", "Grandes Lignes"),
  placeholder("k1-m1-en-ch0", "Engels - Chapter 0", "en", 1, 1, "vocabulary", "Stepping Stones"),
  placeholder("k1-m1-en-ch1", "Engels - Chapter 1", "en", 1, 1, "vocabulary", "Stepping Stones"),
  placeholder("k1-m1-en-ch2", "Engels - Chapter 2", "en", 1, 1, "vocabulary", "Stepping Stones"),
  placeholder("k1-m1-gr-alfabet", "Grieks - Alfabet", "gr", 1, 1, "grammar"),
  placeholder("k1-m1-gr-w1", "Grieks - Woorden Les 1", "gr", 1, 1, "vocabulary"),
  placeholder("k1-m1-la-bw1-3", "Latijn - Basiswoorden Les 1-3", "la", 1, 1, "vocabulary"),
  placeholder("k1-m1-la-bw4-7", "Latijn - Basiswoorden Les 4-7", "la", 1, 1, "vocabulary"),
  placeholder("k1-m1-la-gram1-3", "Latijn - Grammatica Les 1-3", "la", 1, 1, "grammar"),
  placeholder("k1-m1-nl-gram-ab", "Nederlands - Grammatica A-B", "nl", 1, 1, "grammar"),
  placeholder("k1-m1-nl-gram-cd", "Nederlands - Grammatica C-D", "nl", 1, 1, "grammar"),
  placeholder("k1-m1-nl-tv", "Nederlands - Taalverzorging", "nl", 1, 1, "spelling"),

  // Klas 1 - Module 2
  placeholder("k1-m2-fr-voc-u2", "Frans - Vocabulaire Unit 2", "fr", 1, 2, "vocabulary", "Grandes Lignes"),
  placeholder("k1-m2-fr-voc-u3", "Frans - Vocabulaire Unit 3", "fr", 1, 2, "vocabulary", "Grandes Lignes"),
  placeholder("k1-m2-fr-gram-u2-3", "Frans - Grammaire Unit 2-3", "fr", 1, 2, "grammar", "Grandes Lignes"),
  placeholder("k1-m2-en-ch3", "Engels - Chapter 3", "en", 1, 2, "vocabulary", "Stepping Stones"),
  placeholder("k1-m2-en-ch4", "Engels - Chapter 4", "en", 1, 2, "vocabulary", "Stepping Stones"),
  placeholder("k1-m2-gr-w2-4", "Grieks - Woorden Les 2-4", "gr", 1, 2, "vocabulary"),
  placeholder("k1-m2-gr-w5-7", "Grieks - Woorden Les 5-7", "gr", 1, 2, "vocabulary"),
  placeholder("k1-m2-gr-gram", "Grieks - Grammatica", "gr", 1, 2, "grammar"),
  placeholder("k1-m2-la-les8-10", "Latijn - Les 8-10", "la", 1, 2, "vocabulary"),
  placeholder("k1-m2-la-les11-15", "Latijn - Les 11-15", "la", 1, 2, "vocabulary"),
  placeholder("k1-m2-nl-gram-fh", "Nederlands - Grammatica F-H", "nl", 1, 2, "grammar"),
  placeholder("k1-m2-nl-gram-ij", "Nederlands - Grammatica I-J", "nl", 1, 2, "grammar"),

  // Klas 1 - Module 3
  placeholder("k1-m3-fr-voc-u4", "Frans - Vocabulaire Unit 4", "fr", 1, 3, "vocabulary", "Grandes Lignes"),
  placeholder("k1-m3-fr-gram-u4", "Frans - Grammaire Unit 4", "fr", 1, 3, "grammar", "Grandes Lignes"),
  placeholder("k1-m3-en-ch6", "Engels - Chapter 6 (Health & Sport)", "en", 1, 3, "vocabulary", "Stepping Stones"),
  placeholder("k1-m3-en-ch7", "Engels - Chapter 7 (Travel)", "en", 1, 3, "vocabulary", "Stepping Stones"),
  placeholder("k1-m3-en-ch8", "Engels - Chapter 8 (Nature)", "en", 1, 3, "vocabulary", "Stepping Stones"),
  placeholder("k1-m3-gr-w6-7", "Grieks - Woorden Les 6-7", "gr", 1, 3, "vocabulary", "Argo"),
  placeholder("k1-m3-gr-w8-9", "Grieks - Woorden Les 8-9", "gr", 1, 3, "vocabulary", "Argo"),
  placeholder("k1-m3-gr-gram-thema2", "Grieks - Grammatica Thema 2 (dativus, genitivus)", "gr", 1, 3, "grammar", "Argo"),
  placeholder("k1-m3-la-w16-19", "Latijn - Woorden Les 16-19", "la", 1, 3, "vocabulary", "SPQR"),
  placeholder("k1-m3-la-w-tm20", "Latijn - Woorden t/m Les 20 (PW)", "la", 1, 3, "vocabulary", "SPQR"),
  placeholder("k1-m3-la-gram-thema3", "Latijn - Grammatica Thema 3", "la", 1, 3, "grammar", "SPQR"),

  // ── KLAS 2 ─────────────────────────────────────────────────

  // Klas 2 - Module 1
  placeholder("k2-m1-de-kap1-3", "Duits - Kapitel 1-3", "de", 2, 1, "vocabulary"),
  placeholder("k2-m1-de-sterk", "Duits - Sterke Werkwoorden", "de", 2, 1, "grammar"),
  placeholder("k2-m1-en-u1-2", "Engels - Unit 1-2", "en", 2, 1, "vocabulary", "Stepping Stones"),
  placeholder("k2-m1-fr-voc-l1-2", "Frans - Vocabulaire Les 1-2", "fr", 2, 1, "vocabulary", "Grandes Lignes"),
  placeholder("k2-m1-gr-w-th1-2", "Grieks - Woorden Thema 1-2", "gr", 2, 1, "vocabulary"),
  placeholder("k2-m1-gr-verb", "Grieks - Verbuigingsgroepen", "gr", 2, 1, "grammar"),
  placeholder("k2-m1-la-w18-22", "Latijn - Woorden Les 18-22", "la", 2, 1, "vocabulary"),
  placeholder("k2-m1-la-voeg-vraag", "Latijn - Voegwoorden + Vraagwoorden", "la", 2, 1, "grammar"),
  placeholder("k2-m1-nl-tc", "Nederlands - Taal en Cultuur", "nl", 2, 1, "vocabulary"),

  // Klas 2 - Module 2
  placeholder("k2-m2-de-kap4-5", "Duits - Kapitel 4-5", "de", 2, 2, "vocabulary"),
  placeholder("k2-m2-de-gram", "Duits - Grammatik (Naamvallen)", "de", 2, 2, "grammar"),
  placeholder("k2-m2-en-u3-4", "Engels - Unit 3-4", "en", 2, 2, "vocabulary", "Stepping Stones"),
  placeholder("k2-m2-fr-voc-u2-3", "Frans - Vocabulaire Unit 2-3", "fr", 2, 2, "vocabulary", "Grandes Lignes"),
  placeholder("k2-m2-fr-gram-u2-3", "Frans - Grammaire Unit 2-3", "fr", 2, 2, "grammar", "Grandes Lignes"),
  placeholder("k2-m2-gr-w12-18", "Grieks - Woorden Les 12-18", "gr", 2, 2, "vocabulary"),
  placeholder("k2-m2-gr-diag", "Grieks - Diagnostische Grammatica", "gr", 2, 2, "grammar"),
  placeholder("k2-m2-la-les24-30", "Latijn - Les 24-30", "la", 2, 2, "vocabulary"),
  placeholder("k2-m2-la-gram", "Latijn - Grammatica (naamvallen)", "la", 2, 2, "grammar"),
  placeholder("k2-m2-nl-wws", "Nederlands - Werkwoordspelling", "nl", 2, 2, "spelling"),

  // Klas 2 - Module 3
  placeholder("k2-m3-de-kap7", "Duits - Kapitel 7 Wortschatz", "de", 2, 3, "vocabulary", "Deutsch macht Spass"),
  placeholder("k2-m3-de-kap8", "Duits - Kapitel 8 Wortschatz", "de", 2, 3, "vocabulary", "Deutsch macht Spass"),
  placeholder("k2-m3-de-gram-k789", "Duits - Grammatik K7+8 + Dativ K9", "de", 2, 3, "grammar", "Deutsch macht Spass"),
  placeholder("k2-m3-en-u6", "Engels - Unit 6", "en", 2, 3, "vocabulary", "Focus on the Wider World"),
  placeholder("k2-m3-en-u7", "Engels - Unit 7", "en", 2, 3, "vocabulary", "Focus on the Wider World"),
  placeholder("k2-m3-en-u8", "Engels - Unit 8", "en", 2, 3, "vocabulary", "Focus on the Wider World"),
  placeholder("k2-m3-fr-voc-m3", "Frans - Vocabulaire Module 3", "fr", 2, 3, "vocabulary", "Grandes Lignes"),
  placeholder("k2-m3-gr-w-m3", "Grieks - Woorden Module 3", "gr", 2, 3, "vocabulary"),
  placeholder("k2-m3-la-w30-31", "Latijn - Woorden Les 30-31", "la", 2, 3, "vocabulary", "SPQR"),
  placeholder("k2-m3-la-w30-36", "Latijn - Woorden Les 30-36 (PW)", "la", 2, 3, "vocabulary", "SPQR"),
  placeholder("k2-m3-la-gram-32-36", "Latijn - Grammatica Les 32-36", "la", 2, 3, "grammar", "SPQR"),

  // ── KLAS 3 ─────────────────────────────────────────────────

  // Klas 3 - Module 1
  placeholder("k3-m1-de-tijden", "Duits - Alle Tijden (haben/sein/werden)", "de", 3, 1, "grammar"),
  placeholder("k3-m1-de-kap1-2", "Duits - Kapitel 1-2", "de", 3, 1, "vocabulary"),
  placeholder("k3-m1-en-ch1-2", "Engels - Chapter 1-2", "en", 3, 1, "vocabulary", "Stepping Stones"),
  placeholder("k3-m1-en-stones1-2", "Engels - Stones Chapter 1-2", "en", 3, 1, "sentences", "Stepping Stones"),
  placeholder("k3-m1-fr-voc-u1-2", "Frans - Vocabulaire Unit 1-2", "fr", 3, 1, "vocabulary", "Grandes Lignes"),
  placeholder("k3-m1-gr-w8-13", "Grieks - Woorden Les 8-13", "gr", 3, 1, "vocabulary"),
  placeholder("k3-m1-gr-praes-imp", "Grieks - Praesens/Imperfectum", "gr", 3, 1, "grammar"),
  placeholder("k3-m1-la-d31-38", "Latijn - Woorden D31-38", "la", 3, 1, "vocabulary"),
  placeholder("k3-m1-la-naamval", "Latijn - Naamvalsfuncties", "la", 3, 1, "grammar"),
  placeholder("k3-m1-nl-lees", "Nederlands - Leesvaardigheid", "nl", 3, 1, "sentences"),

  // Klas 3 - Module 2
  placeholder("k3-m2-de-kap3-8", "Duits - Kapitel 3-8", "de", 3, 2, "vocabulary"),
  placeholder("k3-m2-en-ch3-4", "Engels - Chapter 3-4", "en", 3, 2, "vocabulary", "Stepping Stones"),
  placeholder("k3-m2-en-stones3-4", "Engels - Stones Chapter 3-4", "en", 3, 2, "sentences", "Stepping Stones"),
  placeholder("k3-m2-fr-voc-u3", "Frans - Vocabulaire Unit 3", "fr", 3, 2, "vocabulary", "Grandes Lignes"),
  placeholder("k3-m2-gr-w9-18", "Grieks - Woorden Les 9-18", "gr", 3, 2, "vocabulary"),
  placeholder("k3-m2-gr-diag", "Grieks - Diagnostische Toets", "gr", 3, 2, "grammar"),
  placeholder("k3-m2-la-les40-48", "Latijn - Les 40-48", "la", 3, 2, "vocabulary"),
  placeholder("k3-m2-la-pred-attr", "Latijn - Predikaat/Attribuut", "la", 3, 2, "grammar"),
  placeholder("k3-m2-nl-schrijven", "Nederlands - Creatief Schrijven", "nl", 3, 2, "sentences"),

  // Klas 3 - Module 3
  enrichExample(deKap4, 3, 3, "vocabulary"),
  placeholder("k3-m3-de-kap6", "Duits - Kapitel 6 Wortschatz", "de", 3, 3, "vocabulary", "Deutsch macht Spass"),
  placeholder("k3-m3-de-gram-k46", "Duits - Grammatik K4+6 (Fälle, Wechselpräpositionen)", "de", 3, 3, "grammar", "Deutsch macht Spass"),
  placeholder("k3-m3-en-ch6", "Engels - Chapter 6 (Good Health)", "en", 3, 3, "vocabulary", "Focus on the Wider World"),
  placeholder("k3-m3-en-ch7", "Engels - Chapter 7 (Entertain Me)", "en", 3, 3, "vocabulary", "Focus on the Wider World"),
  placeholder("k3-m3-en-ch8", "Engels - Chapter 8 (Modern Society)", "en", 3, 3, "vocabulary", "Focus on the Wider World"),
  enrichExample(frDelfA2, 3, 3, "vocabulary"),
  placeholder("k3-m3-gr-w19-20", "Grieks - Woorden Les 19-20", "gr", 3, 3, "vocabulary", "Argo"),
  placeholder("k3-m3-gr-gram-t20", "Grieks - Grammatica t/m Les 20", "gr", 3, 3, "grammar", "Argo"),
  placeholder("k3-m3-gr-odyssee", "Grieks - Odyssee Receptie", "gr", 3, 3, "sentences", "Argo"),
  placeholder("k3-m3-la-w44-45", "Latijn - Woorden Les 44-45", "la", 3, 3, "vocabulary", "SPQR"),
  placeholder("k3-m3-la-w41-48", "Latijn - Woorden Les 41-48 (PW)", "la", 3, 3, "vocabulary", "SPQR"),
  placeholder("k3-m3-la-conjunct", "Latijn - Conjunctivus", "la", 3, 3, "grammar", "SPQR"),
  placeholder("k3-m3-nl-betoog", "Nederlands - Betoog", "nl", 3, 3, "sentences"),

  // ── BOVENBOUW ──────────────────────────────────────────────
  placeholder("bb-fr-voc", "Frans - Bovenbouw Woordenschat", "fr", "bovenbouw", undefined, "vocabulary", "Grandes Lignes"),
  placeholder("bb-en-voc", "Engels - Bovenbouw Woordenschat", "en", "bovenbouw", undefined, "vocabulary"),
  placeholder("bb-de-voc", "Duits - Bovenbouw Woordenschat", "de", "bovenbouw", undefined, "vocabulary"),
  placeholder("bb-la-voc", "Latijn - Bovenbouw Woordenschat", "la", "bovenbouw", undefined, "vocabulary"),
  placeholder("bb-gr-voc", "Grieks - Bovenbouw Woordenschat", "gr", "bovenbouw", undefined, "vocabulary"),
  placeholder("bb-nl-voc", "Nederlands - Bovenbouw Woordenschat", "nl", "bovenbouw", undefined, "vocabulary"),
];

// ============================================================
// QUERY FUNCTIONS
// ============================================================

export function getAllLists(): WordList[] {
  return ALL_LISTS.map(mergeAdminData);
}

export function getListById(id: string): WordList | undefined {
  const list = ALL_LISTS.find((list) => list.id === id);
  if (!list) return undefined;
  return mergeAdminData(list);
}

function mergeAdminData(list: WordList): WordList {
  const adminData = getAdminListData(list.id);
  if (!adminData || adminData.words.length === 0) return list;
  // Admin words replace static words entirely
  return { ...list, words: adminData.words };
}

export function getListsByJaarlaag(jaarlaag: Jaarlaag): WordList[] {
  return ALL_LISTS.filter((list) => list.jaarlaag === jaarlaag).map(mergeAdminData);
}

export function getListsByModule(jaarlaag: Jaarlaag, mod: Module): WordList[] {
  return ALL_LISTS.filter(
    (list) => list.jaarlaag === jaarlaag && list.module === mod
  ).map(mergeAdminData);
}

export function getListsByLanguage(lang: Language): WordList[] {
  return ALL_LISTS.filter((list) => list.language.from === lang).map(mergeAdminData);
}

export function isPlaceholder(list: WordList): boolean {
  return list.words.length === 0;
}

export function getAvailableJaarlagen(): Jaarlaag[] {
  const set = new Set(ALL_LISTS.map((l) => l.jaarlaag));
  return ([1, 2, 3, "bovenbouw"] as Jaarlaag[]).filter((j) => set.has(j));
}

export function getLanguagesForModule(
  jaarlaag: Jaarlaag,
  mod: Module
): Language[] {
  const lists = getListsByModule(jaarlaag, mod);
  const set = new Set(lists.map((l) => l.language.from));
  // Return in consistent order
  return (["fr", "en", "de", "la", "gr", "nl"] as Language[]).filter((l) =>
    set.has(l)
  );
}
