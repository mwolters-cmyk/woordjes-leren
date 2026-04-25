# Overdracht — overhoorme.nl

> Lees dit als je een nieuwe Claude Code sessie start in deze map.
> Datum: 2026-04-25 (laatste sessie)

---

## ⚡ TL;DR

Project draait op Vercel als **woordjes-leren-eight.vercel.app** (= overhoorme.nl
straks). Twee onderdelen:

1. **Woordjes-app** (productie, leerlingen actief) — bestaande Neon-auth
   + localStorage. Werkt al maanden, niet aankomen tenzij gevraagd.
2. **Mondeling-app** (MVP, alleen voor Matthijs) — `/mondelingen`-route,
   Anthropic LLM via Edge Runtime + streaming. Geen auth, geen link in UI,
   alleen via directe URL. Anthropic key zit in `.env.local`.

Vorige sessie heeft een Tikkie/saldo/Supabase-login flow ingebouwd, maar die
is teruggedraaid op verzoek van de gebruiker. We doen NU geen Supabase-auth
voor leerlingen. Eerst werkende mondeling-MVP, daarna pas verder.

---

## Hoe te starten

```bash
cd "C:\Users\wlt\OneDrive - Stichting Stedelijk Gymnasium Leiden\Documenten\Overhoorme"
npm run dev
# Open http://localhost:3000/mondelingen voor MVP
# Open http://localhost:3000/ voor woordjes-app
```

---

## Mondeling MVP — wat is af

### Files
| File | Doel |
|------|------|
| `src/app/mondelingen/page.tsx` | Boekenlijst (gegroepeerd per niveau) |
| `src/app/mondelingen/[slug]/page.tsx` | Boekkaart + Start-knop |
| `src/app/mondelingen/[slug]/sessie/page.tsx` | Server-component, laadt boek + prompt |
| `src/components/mondeling/MondelingChat.tsx` | Client chat-UI met streaming |
| `src/app/api/mondeling/chat/route.ts` | Edge runtime, Anthropic streaming + prompt-caching |
| `src/lib/mondeling/data.ts` | Server-side fs helpers voor boeken |
| `src/lib/mondeling/types.ts` | Types |
| `src/data/mondelingen/` | 21 boek-JSONs + index + prompts (gesynced van Dropbox) |
| `scripts/sync-mondelingen.mjs` | `npm run sync-mondelingen` — re-copy van Dropbox |

### Workflow
1. Open http://localhost:3000/mondelingen → kies boek
2. Boekkaart toont samenvatting + "Start mondeling"
3. Sessie: kies niveau (havo/vwo 4/5/6) → klik Start
4. Chat: typ antwoord, examinator stelt vragen volgens vraagtaxonomie
5. Streaming via Edge Runtime (25s budget — voldoende voor MVP)

### Model
- **Sonnet 4.5** (`claude-sonnet-4-5`) — gekozen omdat MVP. Later evt. 4.6.
- Prompt-caching op system-prompt (~15K tokens) — opvolgende turns 10% kost
- Max 1024 output tokens per turn

### Open punten voor mondeling-MVP
- Geen Web Speech API (spraak) — alleen typen voor nu. Add later.
- Geen sessie-persistentie — refresh = opnieuw. Add later met Supabase.
- Geen kost-logging — wel mogelijk via Supabase `mondeling_sessions` tabel
  die al bestaat in schema, maar nog niet gebruikt
- 266 boeken nog te synthetiseren (zit in Mondelingen-project, ~€90 totaal)
- Examinator-prompt geeft nu max ~80 woorden — als 25s te krap blijkt:
  korten naar 50 woorden, of switch naar Haiku

---

## Woordjes-app (productie)

Niet aankomen tenzij gevraagd. Bestaande Neon-auth + localStorage. Volledig
werkend op `woordjes-leren-eight.vercel.app`.

Belangrijke files:
- `src/app/page.tsx` — homepage
- `src/app/klas/[jaar]/page.tsx` — klas-overzicht
- `src/app/lijst/[id]/` — lijst-detail + 4 oefenmodi
- `src/components/AuthProvider.tsx` — Neon JWT (NIET Supabase)
- `src/data/registry.ts` — alle lijsten
- `src/data/lists/*.json` — woordlijsten

---

## Stack

| Laag | Wat |
|------|-----|
| Frontend/backend | Next.js 16 + React 19 + TS + Tailwind 4 |
| Hosting | Vercel Hobby (free) — `woordjes-leren-eight.vercel.app` |
| Domain | `overhoorme.nl` via mijn.host (DNS naar Vercel) |
| Auth woordjes | Neon Postgres + JWT (bestaand, ongewijzigd) |
| Auth mondeling | GEEN — alleen via URL voor MVP |
| LLM | Anthropic API (Sonnet 4.5), key in `.env.local` |
| Supabase | Project bestaat (`sjasxaccilgmsrofgwcg`) maar wordt NU NIET gebruikt — schema en account-data staan klaar voor toekomst |

---

## Environment vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://sjasxaccilgmsrofgwcg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Alleen `ANTHROPIC_API_KEY` is nu actief in gebruik (mondeling-API).
Supabase vars staan klaar voor latere reactivatie.

Op Vercel moeten dezelfde vars gezet worden voordat mondelingen op
productie werkt: `npx vercel env add ANTHROPIC_API_KEY production`

---

## Wat NIET in de huidige codebase zit (bewust verwijderd)

Vorige sessie had deze toegevoegd, daarna teruggedraaid:
- Login/register pages, Tikkie BalanceCard, /admin/saldo, subdomain proxy,
  Supabase AuthProvider variant

Reden: gebruiker wil eerst werkende mondeling MVP zonder auth-gedoe voor
leerlingen. Pas wanneer mondeling werkt en commercieel relevant wordt,
gaan we de Tikkie-flow weer optuigen.

Documentatie van de oorspronkelijke Tikkie-aanpak staat in `VISION.md` en
`SETUP.md` — daar staan de plannen die we later wel willen oppakken.

---

## Open todos voor volgende sessies

### Korte termijn (MVP afmaken)
- Test mondeling-chat lokaal: werkt het end-to-end? (TS check passt, route
  geeft 200, maar nog niet handmatig in browser getest met echte LLM-call)
- Vercel env-var `ANTHROPIC_API_KEY` zetten en deployen
- Web Speech API (spraak-input) toevoegen aan MondelingChat
- Sessie-transcripts opslaan (in localStorage of Supabase)

### Middellange termijn
- Resterende ~266 boeken synthetiseren in Mondelingen-project + sync
- Subdomeinen `woordjes.overhoorme.nl` + `mondelingen.overhoorme.nl` +
  CNAMEs bij mijn.host (zie SETUP.md voor DNS-stappen)
- Tikkie/saldo systeem reactiveren wanneer commercieel relevant

### Lange termijn
- Hetzner-migratie (wacht op P3 OpenBestuur-VPS upgrade)
- Repo hernoemen `woordjes-leren` → `overhoorme`

---

## Belangrijke mappen elders

| Wat | Waar |
|-----|------|
| Mondeling-bron (Dropbox) | `C:\Users\wlt\Dropbox\Mondelingen\` |
| Stack-credentials | `C:\Users\wlt\Dropbox\stacks-en-credentials.md` |
| LivingMeta (Supabase-patroon) | `C:\Users\wlt\Dropbox\LivingMeta\` |
| OpenBestuur (Hetzner-patroon) | `C:\Users\wlt\Dropbox\OpenBestuur\` |
| OCR-foto's woordjes | `C:\Users\wlt\Dropbox\Woordjes Leren\klas-{n}\module-{m}\` |

---

## Werkwijze

1. Conversatie in Nederlands, code/commits in Engels
2. Commits alleen wanneer expliciet gevraagd. Co-Author:
   `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
3. TypeScript check na elke wijziging: `npx tsc --noEmit`
4. Geen Vercel-specifieke features (KV, Edge Config, Vercel Blob) — Hetzner
   komt eraan
5. Visie respecteren (VISION.md): leerling = baas, geen pottenkijkers

---

## Repo

- Branch: `master` (NIET `main`)
- Remote: `https://github.com/mwolters-cmyk/woordjes-leren.git`
- Vercel: `mwolters-7525s-projects` scope, project `woordjes-leren`

---

**Laatste git-state:**
```
<wordt door commit van deze sessie ingevuld>
```

Veel succes!
