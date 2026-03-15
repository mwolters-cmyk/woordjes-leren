/**
 * Proefwerk stof → registry list matching engine.
 *
 * Matches the free-text `stof` field from proefwerken.json to
 * word list IDs in the registry, using pattern extraction + manual overrides.
 */

import { Jaarlaag, Module, Language } from "./types";
import { Proefwerk, vakKortToLanguage } from "./proefwerken";
import { ALL_LISTS, isPlaceholder } from "@/data/registry";

// ── Result type ────────────────────────────────────────────────

export interface MatchResult {
  proefwerk: Proefwerk;
  language: Language | null;
  matchedLists: string[]; // registry IDs
  coverage: "full" | "partial" | "none";
  missingTopics: string[]; // topics from stof not matched to any list
  readyCount: number; // lists with actual words
  totalCount: number; // total matched lists
}

// ── Manual overrides ───────────────────────────────────────────
// Key: "vak_kort:jaarlaag:module" → list IDs
// Use for edge cases where pattern matching fails.

const MANUAL_OVERRIDES: Record<string, string[]> = {
  // Klas 3 Module 3 Frans: DELF A2 prep is special
  "Fr:3:3": ["k3-m3-fr-delf-a2"],
};

// ── Pattern extraction ─────────────────────────────────────────

interface ExtractedRef {
  type: "kapitel" | "unit" | "chapter" | "les" | "woorden" | "grammatica" | "thema";
  numbers: number[];
}

/**
 * Extract structural references from a stof string.
 * E.g. "Kapitel 1 en 3" → [{type: "kapitel", numbers: [1, 3]}]
 */
function extractRefs(stof: string): ExtractedRef[] {
  const refs: ExtractedRef[] = [];
  const lower = stof.toLowerCase();

  // Kapitel N, K{N} — German
  const kapitelPatterns = [
    /kapitel\s+(\d+(?:\s*(?:en|und|,|&|–|-|\+)\s*\d+)*)/gi,
    /\bk(\d+)\b/gi,
  ];
  for (const pattern of kapitelPatterns) {
    let match;
    while ((match = pattern.exec(stof)) !== null) {
      const nums = extractNumbers(match[1] ?? match[0]);
      if (nums.length > 0) refs.push({ type: "kapitel", numbers: nums });
    }
  }

  // Unité/Unit N — French
  const unitePatterns = [
    /unit[eé]\s+(\d+(?:\s*(?:en|et|,|&|–|-|\+)\s*\d+)*)/gi,
    /\bu(\d+)\b/gi,
  ];
  for (const pattern of unitePatterns) {
    let match;
    while ((match = pattern.exec(stof)) !== null) {
      const nums = extractNumbers(match[1] ?? match[0]);
      if (nums.length > 0) refs.push({ type: "unit", numbers: nums });
    }
  }

  // Chapter N — English
  const chapterPatterns = [
    /chapter\s+(\d+(?:\s*(?:en|and|,|&|–|-|\+)\s*\d+)*)/gi,
    /\bch\.?\s*(\d+)\b/gi,
  ];
  for (const pattern of chapterPatterns) {
    let match;
    while ((match = pattern.exec(stof)) !== null) {
      const nums = extractNumbers(match[1] ?? match[0]);
      if (nums.length > 0) refs.push({ type: "chapter", numbers: nums });
    }
  }

  // Les N, Woorden les N, t/m les N — Latin/Greek
  const lesPatterns = [
    /(?:les|hoofdstuk)\s+(\d+)\s*(?:t\/m|–|-|tot)\s*(\d+)/gi,
    /(?:les|hoofdstuk)\s+(\d+(?:\s*(?:en|,|&|–|-|\+)\s*\d+)*)/gi,
    /\bd(\d+)\s*(?:–|-)\s*d?(\d+)\b/gi, // d31-38
  ];
  for (const pattern of lesPatterns) {
    let match;
    while ((match = pattern.exec(stof)) !== null) {
      if (match[2]) {
        // Range: les 8 t/m 15
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        const nums: number[] = [];
        for (let i = start; i <= end; i++) nums.push(i);
        refs.push({ type: "les", numbers: nums });
      } else {
        const nums = extractNumbers(match[1]);
        if (nums.length > 0) refs.push({ type: "les", numbers: nums });
      }
    }
  }

  // Detect grammar/vocab keywords
  if (/gramm|grammaire|grammati/i.test(stof)) {
    refs.push({ type: "grammatica", numbers: [] });
  }
  if (/vocabul|woor|wortschatz|woordenschat/i.test(stof)) {
    refs.push({ type: "woorden", numbers: [] });
  }
  if (/thema\s+(\d+)/gi.test(stof)) {
    const themaMatch = /thema\s+(\d+)/gi.exec(stof);
    if (themaMatch) {
      refs.push({ type: "thema", numbers: extractNumbers(themaMatch[1]) });
    }
  }

  return refs;
}

/** Extract all numbers from a string like "1 en 3" or "4-5" */
function extractNumbers(s: string): number[] {
  const nums: number[] = [];
  const matches = s.match(/\d+/g);
  if (matches) {
    for (const m of matches) nums.push(parseInt(m));
  }
  return nums;
}

// ── List ID matching ───────────────────────────────────────────

/**
 * Find registry list IDs that match extracted refs for a given language + jaarlaag + module.
 */
function findMatchingLists(
  lang: Language,
  jaarlaag: Jaarlaag,
  mod: Module,
  refs: ExtractedRef[]
): string[] {
  const prefix = jaarlaag === "bovenbouw" ? "bb-" : `k${jaarlaag}-m${mod}-`;
  const langPrefix = `${prefix}${lang}-`;

  // Get all lists for this jaarlaag/module/language
  const candidates = ALL_LISTS.filter(
    (l) =>
      l.id.startsWith(prefix) &&
      l.language.from === lang &&
      l.module === mod &&
      l.jaarlaag === jaarlaag
  );

  if (candidates.length === 0) return [];

  // If no structural refs extracted, return all candidates for this language
  if (refs.length === 0 || refs.every((r) => r.numbers.length === 0)) {
    return candidates.map((c) => c.id);
  }

  const matched = new Set<string>();

  for (const ref of refs) {
    for (const candidate of candidates) {
      const id = candidate.id;
      const idLower = id.toLowerCase();

      // Extract numbers from the list ID
      const idNums = extractNumbers(id.replace(langPrefix, ""));

      switch (ref.type) {
        case "kapitel":
          if (idLower.includes("kap") && ref.numbers.some((n) => idNums.includes(n))) {
            matched.add(id);
          }
          // Also match grammar lists that reference these Kapitel
          if (idLower.includes("gram") && ref.numbers.some((n) => {
            // Check if the gram list ID references any of these Kapitel numbers
            return idNums.includes(n);
          })) {
            matched.add(id);
          }
          break;

        case "unit":
          if ((idLower.includes("voc") || idLower.includes("gram") || idLower.includes("u")) &&
            ref.numbers.some((n) => idNums.includes(n))) {
            matched.add(id);
          }
          break;

        case "chapter":
          if ((idLower.includes("ch") || idLower.includes("stones")) &&
            ref.numbers.some((n) => idNums.includes(n))) {
            matched.add(id);
          }
          break;

        case "les":
          // Match if any of the referenced lesson numbers fall within the list's range
          if (idNums.length >= 2) {
            const [start, end] = [Math.min(...idNums), Math.max(...idNums)];
            if (ref.numbers.some((n) => n >= start && n <= end)) {
              matched.add(id);
            }
          } else if (idNums.length === 1) {
            if (ref.numbers.includes(idNums[0])) {
              matched.add(id);
            }
          }
          break;

        case "grammatica":
          if (idLower.includes("gram") || idLower.includes("naamval") ||
            idLower.includes("conjunct") || idLower.includes("pred") ||
            idLower.includes("praes") || idLower.includes("sterk") ||
            idLower.includes("voeg") || idLower.includes("verb") ||
            idLower.includes("diag")) {
            matched.add(id);
          }
          break;

        case "woorden":
          if (!idLower.includes("gram") && !idLower.includes("naamval") &&
            !idLower.includes("conjunct")) {
            matched.add(id);
          }
          break;
      }
    }
  }

  // If pattern matching found nothing, fall back to all candidates
  return matched.size > 0 ? Array.from(matched) : candidates.map((c) => c.id);
}

// ── Main matching function ─────────────────────────────────────

/**
 * Match a proefwerk's stof to registry word lists.
 */
export function matchProefwerk(
  proefwerk: Proefwerk,
  jaarlaag: Jaarlaag,
  mod: Module
): MatchResult {
  const lang = vakKortToLanguage(proefwerk.vak_kort);

  if (!lang) {
    return {
      proefwerk,
      language: null,
      matchedLists: [],
      coverage: "none",
      missingTopics: [proefwerk.stof],
      readyCount: 0,
      totalCount: 0,
    };
  }

  // Check manual overrides first
  const overrideKey = `${proefwerk.vak_kort}:${jaarlaag}:${mod}`;
  let listIds: string[];

  if (MANUAL_OVERRIDES[overrideKey]) {
    listIds = MANUAL_OVERRIDES[overrideKey];
  } else {
    const refs = extractRefs(proefwerk.stof || proefwerk.beschrijving);
    listIds = findMatchingLists(lang, jaarlaag, mod, refs);
  }

  // Check which lists actually have words
  const readyCount = listIds.filter((id) => {
    const list = ALL_LISTS.find((l) => l.id === id);
    return list && !isPlaceholder(list);
  }).length;

  // Determine coverage
  let coverage: "full" | "partial" | "none";
  if (listIds.length === 0) {
    coverage = "none";
  } else if (readyCount === listIds.length) {
    coverage = "full";
  } else if (readyCount > 0) {
    coverage = "partial";
  } else {
    coverage = "none";
  }

  // Identify missing topics (lists that are still placeholders)
  const missingTopics = listIds
    .filter((id) => {
      const list = ALL_LISTS.find((l) => l.id === id);
      return !list || isPlaceholder(list);
    })
    .map((id) => {
      const list = ALL_LISTS.find((l) => l.id === id);
      return list?.title ?? id;
    });

  return {
    proefwerk,
    language: lang,
    matchedLists: listIds,
    coverage,
    missingTopics,
    readyCount,
    totalCount: listIds.length,
  };
}

/**
 * Match all proefwerken for a module to registry lists.
 * Returns only language subjects.
 */
export function matchAllProefwerken(
  proefwerken: Proefwerk[],
  jaarlaag: Jaarlaag,
  mod: Module
): MatchResult[] {
  return proefwerken
    .filter((pw) => vakKortToLanguage(pw.vak_kort) !== null)
    .map((pw) => matchProefwerk(pw, jaarlaag, mod));
}
