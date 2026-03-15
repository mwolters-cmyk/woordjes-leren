/**
 * Proefwerken data layer — fetches proefwerken.json from GitHub Pages
 * and provides helpers for querying upcoming tests per jaarlaag/module.
 *
 * Key assumption: all classes within a jaarlaag have the same toetsen.
 * We only need to find ONE class per jaarlaag to get the full picture.
 */

import { Jaarlaag, Module, Language } from "./types";

// ── Types ──────────────────────────────────────────────────────

export interface Toetsweek {
  weken: number[];
  periode: string;
}

export interface Proefwerk {
  vak: string;
  vak_kort: string;
  type: string; // "proefwerk" | "uso" | "so" | "mondeling" | "oefentoets"
  beschrijving: string;
  stof: string;
  week: number;
}

export interface ProefwerkenData {
  schooljaar: string;
  gegenereerd: string;
  toetsweken: Record<string, Toetsweek>; // "module_1", "module_2", "module_3"
  proefwerken: Record<string, Record<string, Proefwerk[]>>; // klasCode → module → tests
}

// ── Vak mapping ────────────────────────────────────────────────

const VAK_KORT_TO_LANGUAGE: Record<string, Language> = {
  Du: "de",
  En: "en",
  Fr: "fr",
  La: "la",
  Gr: "gr",
  Ne: "nl",
  Nl: "nl",
};

/** Subjects that have word lists in our app */
const LANGUAGE_VAK_KORT = new Set(Object.keys(VAK_KORT_TO_LANGUAGE));

export function vakKortToLanguage(vakKort: string): Language | null {
  return VAK_KORT_TO_LANGUAGE[vakKort] ?? null;
}

export function isLanguageSubject(vakKort: string): boolean {
  return LANGUAGE_VAK_KORT.has(vakKort);
}

// ── Fetch & cache ──────────────────────────────────────────────

const PROEFWERKEN_URL =
  "https://mwolters-cmyk.github.io/toetsdruk/data/proefwerken.json";

let cachedData: ProefwerkenData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchProefwerken(): Promise<ProefwerkenData> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }
  const res = await fetch(PROEFWERKEN_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch proefwerken: ${res.status}`);
  cachedData = (await res.json()) as ProefwerkenData;
  cacheTimestamp = now;
  return cachedData;
}

// ── Query helpers ──────────────────────────────────────────────

/**
 * Get the first class code belonging to a jaarlaag.
 * All classes in a jaarlaag have the same tests, so we only need one.
 */
function findKlasForJaarlaag(
  data: ProefwerkenData,
  jaarlaag: Jaarlaag
): string | null {
  if (jaarlaag === "bovenbouw") return null;
  const prefix = String(jaarlaag);
  return (
    Object.keys(data.proefwerken).find((code) => code.startsWith(prefix)) ??
    null
  );
}

/**
 * Get all proefwerken for a jaarlaag + module.
 * Returns tests from the first matching class (all classes are identical).
 */
export function getProefwerkenForModule(
  data: ProefwerkenData,
  jaarlaag: Jaarlaag,
  mod: Module
): Proefwerk[] {
  const klas = findKlasForJaarlaag(data, jaarlaag);
  if (!klas) return [];
  const moduleKey = `module_${mod}`;
  return data.proefwerken[klas]?.[moduleKey] ?? [];
}

/**
 * Filter to only language subjects that have word lists in our app.
 */
export function getLanguageProefwerken(proefwerken: Proefwerk[]): Proefwerk[] {
  return proefwerken.filter((pw) => isLanguageSubject(pw.vak_kort));
}

/**
 * Get the toetsweek info for a module.
 */
export function getToetsweek(
  data: ProefwerkenData,
  mod: Module
): Toetsweek | null {
  return data.toetsweken[`module_${mod}`] ?? null;
}

/**
 * Determine which module's toetsweek is upcoming or current,
 * based on ISO week number.
 */
export function getUpcomingModule(data: ProefwerkenData): Module | null {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  // Check each module's toetsweek
  for (const mod of [1, 2, 3] as Module[]) {
    const tw = getToetsweek(data, mod);
    if (!tw) continue;
    const firstWeek = Math.min(...tw.weken);
    const lastWeek = Math.max(...tw.weken);

    // Show if we're within 4 weeks before or during the toetsweek
    // Account for year boundaries (module 1 weken 47-48 are in the previous calendar context)
    if (currentWeek >= firstWeek - 4 && currentWeek <= lastWeek) {
      return mod;
    }
  }

  // Fallback: find the next upcoming toetsweek
  let closest: { mod: Module; weekDiff: number } | null = null;
  for (const mod of [1, 2, 3] as Module[]) {
    const tw = getToetsweek(data, mod);
    if (!tw) continue;
    const firstWeek = Math.min(...tw.weken);
    const diff = firstWeek - currentWeek;
    if (diff > 0 && (!closest || diff < closest.weekDiff)) {
      closest = { mod, weekDiff: diff };
    }
  }

  return closest?.mod ?? null;
}

/**
 * Get ISO week number for a date.
 */
function getISOWeek(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - yearStart.getTime()) / 86400000 -
        3 +
        ((yearStart.getDay() + 6) % 7)) /
        7
    )
  );
}

/**
 * Deduplicate proefwerken by vak_kort + module (since all classes are the same,
 * but we might accidentally fetch duplicates).
 */
export function deduplicateProefwerken(
  proefwerken: Proefwerk[]
): Proefwerk[] {
  const seen = new Set<string>();
  return proefwerken.filter((pw) => {
    const key = `${pw.vak_kort}:${pw.type}:${pw.week}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
