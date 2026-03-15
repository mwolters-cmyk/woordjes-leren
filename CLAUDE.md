# Woordjes Leren - Stedelijk Gymnasium Leiden

## Project Overview
Free vocabulary/practice app for gymnasium students (klas 1-3 + bovenbouw). Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4.

**Live URL**: https://woordjes-leren-eight.vercel.app
**GitHub**: mwolters-cmyk/woordjes-leren

## Architecture

### Data Flow (Single Source of Truth)
1. **Registry** (`src/data/registry.ts`): ALL list definitions — placeholder (empty) or with imported words
2. **Dropbox photos** → `scripts/import-photos.mjs` → OCR via Claude Vision → JSON in `src/data/lists/`
3. **Admin panel** (`/admin`): localStorage overrides for quick content entry before JSON commit
4. **Toetsdruk JSONs**: Source for which lists/tests exist per klas/module (see below)

### Key Directories
```
woordjes-leren/          # Next.js app root
├── src/data/registry.ts # ALL lists defined here (single source of truth)
├── src/data/lists/      # JSON files with actual word data
├── src/lib/             # Core logic (types, storage, leitner, rekentoets, auth)
├── src/components/      # Shared components
├── src/app/             # Next.js pages
│   ├── admin/           # PIN-protected admin panel
│   ├── klas/[jaar]/     # Class overview pages
│   ├── lijst/[id]/      # List detail + exercise modes
│   └── rekentoets/      # Rekentoets exercise (klas 1)
├── scripts/             # CLI tools (import-photos, update-registry)
└── .env                 # API keys (gitignored)
```

### Toetsdruk Integration
The Toetsdruk tool (separate project) generates structured JSONs from studiewijzers:
```
C:\Users\wlt\OneDrive - Stichting Stedelijk Gymnasium Leiden\
  Stedelijk\Schoolleiding\Examencommissie\Toetsdruk\
    output\klas1-2\Studiewijzers\{klas}\Module {n}\*.json
```
Each JSON has: `metadata` (vak, leerjaar, module) + `toetsen[]` (type, stof, week).
Use these to determine which vocabulary/grammar lists exist per module.

### Dropbox Photo Import
Photos go in `C:\Users\wlt\Dropbox\Woordjes Leren\`:
```
klas-{n}/module-{m}/{listId} ({title})/  ← put photos here
```
Folder name format: `{registry-id} ({human-readable title})`
The `listId` prefix MUST match a registry entry in `registry.ts`.

Run: `npm run import` (all) or `npm run import {listId}` (single list)

### Registry Naming Convention
IDs follow: `k{klas}-m{module}-{lang}-{type}-{detail}`
- Languages: `fr`, `en`, `de`, `la`, `gr`, `nl`
- Types: `voc`, `gram`, `w` (woorden), `ch` (chapter), `u` (unit), `kap` (Kapitel)

## Authentication
- Admin panel: PIN-based (SHA-256 hash, sessionStorage)
- PIN_HASH in `src/lib/adminAuth.ts`
- Vercel deploy: token-based (`VERCEL_TOKEN` in .env)

## Deployment
```bash
# Via GitHub (auto-deploy on push)
git push origin main

# Or manual
npx vercel --prod --yes --token $VERCEL_TOKEN
```
Scope: `mwolters-7525s-projects`

## Development
```bash
cd woordjes-leren && npm run dev  # starts on port 3000
npm run import                     # OCR import from Dropbox photos
npm run import --dry-run           # preview without writing
```

## Important Patterns
- `mergeAdminData()` in registry.ts: admin localStorage words override static JSON
- Leitner box system for spaced repetition (boxes 1-5)
- Exercise modes: flashcards, schrijven, meerkeuze, toets
- Rekentoets: backward-generated questions (answer first, then construct question) for clean results
- Dutch conventions: comma for decimals, `:` for division
