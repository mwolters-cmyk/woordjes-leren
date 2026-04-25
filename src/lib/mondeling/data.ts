/**
 * Data-helpers voor mondeling-boeken.
 *
 * Boeken zijn statische JSONs in src/data/mondelingen/. Gelezen
 * server-side via fs (werkt op Vercel sinds Next.js 13+).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Boek, BoekIndexEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "src", "data", "mondelingen");

let cachedIndex: BoekIndexEntry[] | null = null;

export async function getIndex(): Promise<BoekIndexEntry[]> {
  if (cachedIndex) return cachedIndex;
  const raw = await fs.readFile(path.join(DATA_DIR, "index.json"), "utf8");
  cachedIndex = JSON.parse(raw);
  return cachedIndex!;
}

/** Boeken die we al gesynthetiseerd hebben (JSON bestaat in boeken/) */
export async function getAvailableSlugs(): Promise<Set<string>> {
  const dir = path.join(DATA_DIR, "boeken");
  try {
    const files = await fs.readdir(dir);
    return new Set(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
    );
  } catch {
    return new Set();
  }
}

export async function getBoek(slug: string): Promise<Boek | null> {
  // Whitelist via slug-format: voorkomt path traversal
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DATA_DIR, "boeken", `${slug}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getExaminatorPrompt(): Promise<string> {
  const file = path.join(DATA_DIR, "prompts", "examinator-strict.md");
  return fs.readFile(file, "utf8");
}
