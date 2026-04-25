#!/usr/bin/env node
/**
 * Sync mondeling-data van Dropbox-bron naar deze repo.
 *
 * Bron: C:\Users\wlt\Dropbox\Mondelingen\
 * Doel: src/data/mondelingen/
 *
 * Gebruik:
 *   npm run sync-mondelingen
 *
 * Run dit nadat je in het Mondelingen-project nieuwe boeken hebt
 * gesynthetiseerd. Daarna git commit + push.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const SRC = "C:\\Users\\wlt\\Dropbox\\Mondelingen";
const DST = path.join(REPO_ROOT, "src", "data", "mondelingen");

async function copyFile(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const dstPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      count += await copyDir(srcPath, dstPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, dstPath);
      count++;
    }
  }
  return count;
}

async function main() {
  console.log(`Syncing van ${SRC} naar ${DST}`);

  // 1. Index van boeken
  await copyFile(
    path.join(SRC, "data", "index.json"),
    path.join(DST, "index.json")
  );
  console.log("\u2713 index.json");

  // 2. Boek-JSONs
  const boekenCount = await copyDir(
    path.join(SRC, "data", "boeken"),
    path.join(DST, "boeken")
  );
  console.log(`\u2713 ${boekenCount} boek-JSONs`);

  // 3. Prompts (als losse files, makkelijker te updaten)
  await copyFile(
    path.join(SRC, "prompts", "examinator-strict.md"),
    path.join(DST, "prompts", "examinator-strict.md")
  );
  await copyFile(
    path.join(SRC, "prompts", "kandidaat-regels.md"),
    path.join(DST, "prompts", "kandidaat-regels.md")
  );
  console.log("\u2713 prompts");

  // 4. Vraagtaxonomie als reference doc
  try {
    await copyFile(
      path.join(SRC, "VRAAGTAXONOMIE.md"),
      path.join(DST, "VRAAGTAXONOMIE.md")
    );
    console.log("\u2713 VRAAGTAXONOMIE.md");
  } catch {
    console.log("\u2717 VRAAGTAXONOMIE.md niet gevonden (overslaan)");
  }

  console.log("\nSync klaar. Vergeet niet te committen!");
}

main().catch((e) => {
  console.error("Sync fout:", e);
  process.exit(1);
});
