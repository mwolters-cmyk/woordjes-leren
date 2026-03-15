#!/usr/bin/env node

/**
 * Import-script: leest foto's uit Dropbox-mappen, stuurt ze naar
 * Claude Vision voor OCR, en genereert JSON-bestanden voor de app.
 *
 * Gebruik:
 *   npm run import                           (alle lijsten met foto's)
 *   npm run import k1-m1-fr-voc-u0           (alleen deze lijst)
 *   npm run import:dry                       (preview zonder schrijven)
 *
 * API key wordt gelezen uit .env bestand of ANTHROPIC_API_KEY env var.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// ─── Load .env file if present ──────────────────────────────────
const envPath = path.resolve(import.meta.dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Config ─────────────────────────────────────────────────────
const DROPBOX_ROOT = "C:/Users/wlt/Dropbox/Woordjes Leren";
const OUTPUT_DIR = path.resolve(
  import.meta.dirname,
  "../src/data/lists"
);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
]);

// Map list-type codes to OCR prompt instructions
const LIST_TYPE_MAP = {
  vocabulary: "woordjes (term + vertaling)",
  grammar: "grammatica (term/vorm + uitleg/vertaling, eventueel naamvallen/verbuigingen/genus)",
  sentences: "zinnen (zin + vertaling)",
  spelling: "spelling (woord + correct geschreven vorm)",
};

// ─── Registry data (hardcoded to avoid importing TS) ────────────
// We parse the list metadata from folder names
function parseListId(folderName) {
  const match = folderName.match(/^([^\s(]+)/);
  return match ? match[1] : null;
}

function parseListTitle(folderName) {
  const match = folderName.match(/\((.+)\)$/);
  return match ? match[1] : folderName;
}

function detectListType(listId, title) {
  const lower = (listId + " " + title).toLowerCase();
  if (lower.includes("gram") || lower.includes("verb") || lower.includes("naamval") ||
      lower.includes("alfabet") || lower.includes("tijden") || lower.includes("conjunct") ||
      lower.includes("praes") || lower.includes("diag") || lower.includes("sterk") ||
      lower.includes("gesamt") || lower.includes("pred-attr")) {
    return "grammar";
  }
  if (lower.includes("delf") || lower.includes("stones") || lower.includes("zin") ||
      lower.includes("lees") || lower.includes("schrijven") || lower.includes("betoog") ||
      lower.includes("odyssee")) {
    return "sentences";
  }
  if (lower.includes("tv") || lower.includes("taalverzorg") || lower.includes("wws") ||
      lower.includes("spelling")) {
    return "spelling";
  }
  return "vocabulary";
}

function detectLanguage(listId) {
  if (listId.includes("-fr-")) return { code: "fr", name: "Frans" };
  if (listId.includes("-en-")) return { code: "en", name: "Engels" };
  if (listId.includes("-de-")) return { code: "de", name: "Duits" };
  if (listId.includes("-la-")) return { code: "la", name: "Latijn" };
  if (listId.includes("-gr-")) return { code: "gr", name: "Grieks" };
  if (listId.includes("-nl-")) return { code: "nl", name: "Nederlands" };
  return { code: "nl", name: "Nederlands" };
}

// ─── Scan Dropbox ───────────────────────────────────────────────
function scanDropbox(filterListId) {
  const results = [];

  for (const klassDir of fs.readdirSync(DROPBOX_ROOT, { withFileTypes: true })) {
    if (!klassDir.isDirectory()) continue;
    const klassPath = path.join(DROPBOX_ROOT, klassDir.name);

    // Bovenbouw has no module subdirs
    if (klassDir.name === "bovenbouw") {
      for (const listDir of fs.readdirSync(klassPath, { withFileTypes: true })) {
        if (!listDir.isDirectory()) continue;
        const entry = processListDir(path.join(klassPath, listDir.name), listDir.name, filterListId);
        if (entry) results.push(entry);
      }
      continue;
    }

    for (const modDir of fs.readdirSync(klassPath, { withFileTypes: true })) {
      if (!modDir.isDirectory()) continue;
      const modPath = path.join(klassPath, modDir.name);
      for (const listDir of fs.readdirSync(modPath, { withFileTypes: true })) {
        if (!listDir.isDirectory()) continue;
        const entry = processListDir(path.join(modPath, listDir.name), listDir.name, filterListId);
        if (entry) results.push(entry);
      }
    }
  }

  return results;
}

function processListDir(dirPath, folderName, filterListId) {
  const listId = parseListId(folderName);
  if (!listId) return null;
  if (filterListId && listId !== filterListId) return null;

  const images = fs
    .readdirSync(dirPath)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (images.length === 0) return null;

  return {
    listId,
    title: parseListTitle(folderName),
    listType: detectListType(listId, folderName),
    language: detectLanguage(listId),
    dirPath,
    images: images.map((f) => path.join(dirPath, f)),
  };
}

// ─── Claude Vision OCR ──────────────────────────────────────────
async function ocrImages(client, entry) {
  const { listId, title, listType, language, images } = entry;
  const typeDesc = LIST_TYPE_MAP[listType];

  // Build image content blocks
  const imageBlocks = [];
  for (const imgPath of images) {
    const data = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).toLowerCase();
    let mediaType = "image/jpeg";
    if (ext === ".png") mediaType = "image/png";
    else if (ext === ".webp") mediaType = "image/webp";

    imageBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: data.toString("base64"),
      },
    });
  }

  const systemPrompt = `Je bent een nauwkeurige OCR-assistent voor schoolboeken. Je taak is om woordenlijsten, grammatica-overzichten en andere taaloefeningen uit foto's te extraheren.

BELANGRIJK:
- Wees EXTREEM nauwkeurig: elk accent, elke letter, elk leesteken telt
- Bij talen als Frans, Duits, Grieks: let extra op speciale tekens (accenten, umlauts, Griekse letters)
- Bij Latijn: neem genus (m/v/o) en naamval-info mee in het "extra" veld
- Bij Grieks: gebruik de correcte Griekse Unicode-tekens
- Negeer paginanummers, kopjes, en instructietekst
- Als een woord meerdere vertalingen heeft, scheid ze met "; "
- Geef ALLEEN de JSON-array terug, geen uitleg of markdown`;

  const userPrompt = `Dit zijn ${images.length} foto('s) van een ${language.name} ${typeDesc}-lijst: "${title}".

Extraheer ALLE items en geef ze terug als JSON-array met dit format:
[
  {
    "id": "${listId}-w1",
    "term": "het woord in ${language.name}",
    "definition": "de Nederlandse vertaling",
    "extra": "optioneel: genus, naamval, bijzonderheden"${listType === "grammar" ? ' // VERPLICHT bij grammatica' : ''}
  }
]

Nummer de id's oplopend: ${listId}-w1, ${listId}-w2, etc.
${listType === "grammar" ? '\nBij grammatica: zet verbuigingsvormen, naamvallen, werkwoordsvormen etc. in het "extra" veld.' : ""}
${listType === "sentences" ? '\nBij zinnen: "term" = de zin in de brontaal, "definition" = de Nederlandse vertaling.' : ""}
${language.code === "la" ? '\nBij Latijn: neem genus (m./v./o.) en eventuele genitief-vorm op in "extra".' : ""}
${language.code === "gr" ? '\nBij Grieks: gebruik correcte Griekse Unicode-tekens (geen transliteratie).' : ""}

Geef ALLEEN de JSON-array terug.`;

  console.log(`  Sending ${images.length} image(s) to Claude Vision...`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: userPrompt }],
      },
    ],
    system: systemPrompt,
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const words = JSON.parse(jsonStr);
    if (!Array.isArray(words)) throw new Error("Expected JSON array");

    // Validate and clean
    return words
      .filter((w) => w.term && w.definition)
      .map((w, i) => ({
        id: `${listId}-w${i + 1}`,
        term: w.term.trim(),
        definition: w.definition.trim(),
        ...(w.extra ? { extra: w.extra.trim() } : {}),
        ...(w.hint ? { hint: w.hint.trim() } : {}),
      }));
  } catch (e) {
    console.error(`  ERROR parsing JSON response for ${listId}:`);
    console.error(`  Response text: ${text.substring(0, 500)}`);
    throw e;
  }
}

// ─── Write output ───────────────────────────────────────────────
function writeListJson(entry, words) {
  const { listId, title, language, listType } = entry;

  const output = {
    id: listId,
    title,
    description: title,
    language: { from: language.code, to: "nl" },
    tags: [listType],
    words,
  };

  const outPath = path.join(OUTPUT_DIR, `${listId}.json`);

  // Check if file already exists - merge if so
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    if (existing.words && existing.words.length > 0) {
      console.log(`  File ${listId}.json exists with ${existing.words.length} words, merging...`);
      const existingIds = new Set(existing.words.map((w) => w.term.toLowerCase()));
      const newWords = words.filter((w) => !existingIds.has(w.term.toLowerCase()));
      if (newWords.length === 0) {
        console.log(`  No new words to add, skipping.`);
        return { written: false, total: existing.words.length };
      }
      output.words = [...existing.words, ...newWords];
      // Re-number
      output.words = output.words.map((w, i) => ({ ...w, id: `${listId}-w${i + 1}` }));
      console.log(`  Added ${newWords.length} new words (total: ${output.words.length})`);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  return { written: true, total: output.words.length };
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filterListId = args.find((a) => !a.startsWith("--")) ?? null;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: Set ANTHROPIC_API_KEY environment variable");
    console.error("  ANTHROPIC_API_KEY=sk-... node scripts/import-photos.mjs");
    process.exit(1);
  }

  const client = new Anthropic();

  console.log("Scanning Dropbox folders...");
  const entries = scanDropbox(filterListId);

  if (entries.length === 0) {
    console.log("Geen foto's gevonden" + (filterListId ? ` voor ${filterListId}` : "") + ".");
    console.log(`Zet foto's in de mappen onder: ${DROPBOX_ROOT}`);
    process.exit(0);
  }

  console.log(`\n${entries.length} lijst(en) met foto's gevonden:\n`);
  for (const e of entries) {
    console.log(`  ${e.listId}: ${e.title} (${e.images.length} foto's, type: ${e.listType})`);
  }

  if (dryRun) {
    console.log("\n--dry-run: geen bestanden geschreven.");
    process.exit(0);
  }

  console.log("\nStarten met OCR...\n");

  let totalWords = 0;
  let totalLists = 0;

  for (const entry of entries) {
    console.log(`[${entry.listId}] ${entry.title}`);
    try {
      const words = await ocrImages(client, entry);
      console.log(`  ${words.length} woorden geextraheerd`);

      const result = writeListJson(entry, words);
      if (result.written) {
        console.log(`  Geschreven naar: ${entry.listId}.json (${result.total} woorden)`);
        totalWords += result.total;
        totalLists++;
      }
    } catch (e) {
      console.error(`  FOUT bij ${entry.listId}: ${e.message}`);
    }
    console.log();
  }

  console.log("════════════════════════════════════════");
  console.log(`Klaar! ${totalLists} lijst(en) verwerkt, ${totalWords} woorden totaal.`);
  console.log(`JSON-bestanden staan in: ${OUTPUT_DIR}`);
  console.log("\nVergeet niet de registry.ts bij te werken met imports voor nieuwe lijsten!");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
