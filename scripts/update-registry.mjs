#!/usr/bin/env node

/**
 * Scant src/data/lists/ voor JSON-bestanden en werkt registry.ts bij
 * zodat nieuwe imports automatisch worden toegevoegd.
 *
 * Gebruik:
 *   node scripts/update-registry.mjs
 */

import fs from "fs";
import path from "path";

const LISTS_DIR = path.resolve(import.meta.dirname, "../src/data/lists");
const REGISTRY_PATH = path.resolve(import.meta.dirname, "../src/data/registry.ts");

function main() {
  // Find all JSON files in lists/
  const jsonFiles = fs
    .readdirSync(LISTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  // Read current registry
  const registry = fs.readFileSync(REGISTRY_PATH, "utf-8");

  // Find which JSON files are already imported
  const alreadyImported = new Set();
  for (const match of registry.matchAll(/import\s+\w+\s+from\s+"\.\/lists\/(.+?)\.json"/g)) {
    alreadyImported.add(match[1]);
  }

  // Find new files
  const newFiles = jsonFiles
    .map((f) => f.replace(".json", ""))
    .filter((f) => !alreadyImported.has(f));

  if (newFiles.length === 0) {
    console.log("Geen nieuwe JSON-bestanden om toe te voegen.");
    return;
  }

  console.log(`${newFiles.length} nieuwe JSON-bestand(en) gevonden:\n`);

  // Generate import statements and placeholder replacements
  const newImports = [];
  const replacements = [];

  for (const file of newFiles) {
    // Read the JSON to get metadata
    const data = JSON.parse(
      fs.readFileSync(path.join(LISTS_DIR, `${file}.json`), "utf-8")
    );
    const listId = data.id || file;

    // Generate a valid JS variable name
    const varName = file
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");

    newImports.push(`import ${varName} from "./lists/${file}.json";`);

    console.log(`  ${file}.json -> ${listId} (${data.words?.length || 0} woorden)`);

    // Check if there's a placeholder in the registry for this ID
    const placeholderPattern = new RegExp(
      `placeholder\\("${listId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",`
    );
    if (placeholderPattern.test(registry)) {
      replacements.push({ listId, varName, pattern: placeholderPattern });
    }
  }

  console.log(`\nNieuwe imports toe te voegen aan registry.ts:`);
  for (const imp of newImports) {
    console.log(`  ${imp}`);
  }

  if (replacements.length > 0) {
    console.log(`\n${replacements.length} placeholder(s) te vervangen.`);
    console.log(
      "\nLET OP: Automatisch vervangen van placeholders is complex."
    );
    console.log("Voeg de imports handmatig toe bovenaan registry.ts");
    console.log("en vervang de placeholder()-calls door de imported data.");
    console.log("\nVoorbeeld:");
    console.log("  // Verander:");
    console.log('  placeholder("k1-m1-fr-voc-u0", "Frans - ...", ...)');
    console.log("  // Naar:");
    console.log('  enrichExample(k1_m1_fr_voc_u0, 1, 1, "vocabulary")');
  }

  // Write the imports to a helper file for easy copy-paste
  const helperPath = path.resolve(import.meta.dirname, "../src/data/_new-imports.txt");
  const helperContent = [
    "// Kopieer deze imports naar het begin van registry.ts:",
    ...newImports,
    "",
    "// Vervang de bijbehorende placeholder() calls door:",
    ...newFiles.map((file) => {
      const varName = file.replace(/[^a-zA-Z0-9]/g, "_").replace(/^_+|_+$/g, "").replace(/_+/g, "_");
      const data = JSON.parse(fs.readFileSync(path.join(LISTS_DIR, `${file}.json`), "utf-8"));
      const listId = data.id || file;

      // Try to detect jaarlaag and module from ID
      let jaarlaag = "1";
      let mod = "1";
      let listType = '"vocabulary"';

      const jMatch = listId.match(/k(\d)/);
      if (jMatch) jaarlaag = jMatch[1];
      if (listId.startsWith("bb-")) jaarlaag = '"bovenbouw"';

      const mMatch = listId.match(/m(\d)/);
      if (mMatch) mod = mMatch[1];

      if (listId.includes("gram")) listType = '"grammar"';
      else if (listId.includes("delf") || listId.includes("stones") || listId.includes("lees") || listId.includes("schrijven") || listId.includes("betoog") || listId.includes("odyssee")) listType = '"sentences"';
      else if (listId.includes("tv") || listId.includes("wws")) listType = '"spelling"';

      return `  enrichExample(${varName}, ${jaarlaag}, ${mod}, ${listType}),  // was placeholder("${listId}", ...)`;
    }),
    "",
  ].join("\n");

  fs.writeFileSync(helperPath, helperContent, "utf-8");
  console.log(`\nHelper-bestand geschreven: src/data/_new-imports.txt`);
}

main();
