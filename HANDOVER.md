# Overdracht — overhoorme.nl

> Lees dit als je een nieuwe Claude Code sessie start in deze map.
> Datum overdracht: 2026-04-25
> Vorige sessie: chat onder oude path `Woordjes leren\woordjes-leren\`,
> project is sindsdien verhuisd naar `Documenten\Overhoorme\`.

---

## ⚡ TL;DR voor de eerstvolgende sessie

1. **Lees** `VISION.md`, `CLAUDE.md`, `SETUP.md` — in die volgorde
2. **Vraag de gebruiker** of de Supabase-credentials klaar zijn
   (zo ja: zet ze in `.env.local`, run `supabase/schema.sql`)
3. **Eerstvolgende todo**: zie sectie "Open todos" hieronder
4. **NIET zelf doen**: Hetzner-migratie (wacht op P3-upgrade van OpenBestuur)

---

## Project-context

**Wat is overhoorme.nl?**
Tweeledige educatieve site, gebouwd door school-admin Matthijs Wolters
voor zijn leerlingen op Stedelijk Gymnasium Leiden:

- **woordjes.overhoorme.nl** — vocabulaire/grammatica oefenen (bestaand)
- **mondelingen.overhoorme.nl** — mondeling NL/EN (in ontwerp, content klaar)
- **overhoorme.nl** — landing chooser

**Visie** (zie `VISION.md`):
> "Leerling = baas. Geen docent of ouder kan voortgang inzien.
> Jouw oefenruimte. Jouw tempo. Jouw geheim."

Login is verplicht voor voortgangs-tracking, maar alleen de leerling
zelf ziet zijn eigen data (RLS-policies in Supabase).

**Commercieel model** (langzame revenue):
- Eigen leerlingen sturen via app een Tikkie naar Matthijs (de
  ontwikkelaar/docent) → saldo wordt handmatig bijgeschreven
- Geen feature-gates, alles blijft beschikbaar
- Schoollicenties + stichtingscodes komen later

---

## Stack

| Laag | Wat | Notities |
|------|-----|----------|
| Frontend/backend | Next.js 16 + React 19 + TS + Tailwind 4 | App Router |
| Hosting (huidig) | Vercel Hobby | account `mwolters-7525s-projects` |
| Hosting (later) | Hetzner VPS | wacht op P3-upgrade van OpenBestuur-VPS |
| Auth + DB + Storage | Supabase | nog te activeren (credentials volgen) |
| LLM | Anthropic API key `woordjes` | bestaat al, alleen volledige key in `.env.local` |
| DNS | mijn.host | overhoorme.nl al gekocht en geconfigureerd |
| Domain | overhoorme.nl + 2 subdomains | DNS-werk: zie open todos |

**Patroon-bron**: LivingMeta + PlayerELO + OpenBestuur. Stack-info ligt
in `C:\Users\wlt\Dropbox\stacks-en-credentials.md`.

---

## Wat is al af (✅ gebouwd & gecommit)

### Auth-laag (Supabase, nog niet geactiveerd)
- `supabase/schema.sql` — students, word_progress, list_progress_meta,
  student_streak, balance_transactions, admins, mondeling_sessions
  (placeholder). Alle tabellen RLS-protected.
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client + admin (service role)
- `src/lib/supabase/types.ts` — handgeschreven DB types
- `src/lib/supabase/useAuth.ts` — React-hook
- `src/lib/supabase/migrate.ts` — eenmalige localStorage → Supabase migratie
- `src/lib/supabase/sync.ts` — fire-and-forget sync na elke local save
- `src/components/AuthProvider.tsx` — herschreven voor Supabase, met
  username-naar-pseudo-email-truc (`pepijn@overhoorme.local`)
- `src/components/AuthGate.tsx` — herschreven, blokkeert bij Supabase
  actief, doet niets bij MVP-mode (geen credentials)
- `src/app/login/page.tsx` — leerling typt alleen username + wachtwoord
- `src/app/register/page.tsx` — username, wachtwoord, voornaam, klas

### Subdomein-architectuur
- `src/middleware.ts` — host-based routing
  - `woordjes.overhoorme.nl/*` → root (huidige app)
  - `mondelingen.overhoorme.nl/*` → `/mondelingen/*` rewrite
  - `overhoorme.nl` → rewrite naar `/landing`
  - Localhost/vercel.app: geen rewrite (development)
- `src/app/landing/page.tsx` — chooser met twee kaarten
- `src/app/mondelingen/page.tsx` — placeholder ("Binnenkort beschikbaar")

### Tegoed-systeem (Tikkie-flow)
- `students.credits_cents` kolom + `balance_transactions` tabel
- DB-trigger: insert in transactions → update saldo-cache
- `src/components/BalanceCard.tsx` — leerling ziet saldo + Tikkie-knop
  (Tikkie-URL is `https://tikkie.me/pay/abfvlr6u88q23pa1rk2t`)
- `src/app/admin/saldo/page.tsx` — admin formulier voor bijschrijven
- `src/app/api/admin/credit/route.ts` — server endpoint, checkt
  admin-status via service role + Supabase admins-tabel

### Documentatie
- `VISION.md` — visie + commerciële spanning
- `SETUP.md` — stap-voor-stap Supabase activeren
- `.env.local.example` — alle env vars met uitleg
- `CLAUDE.md` — geüpdatet voor nieuwe locatie + stack

### Eerdere sessies (al productie)
- Vocabulaire-app voor klas 1-3 + bovenbouw
- Leitner-systeem + Toetsklaar-meter (nu zonder dagspread-penalty)
- Streak-teller op leerlingniveau
- "Bekijk per box" popup
- Grammatica generators (Duits, Grieks, Duitse Tijden)
- Bovenbouw auto-aggregation
- 4 oefenmodi: flashcards, schrijven, meerkeuze, toets
- Subdomein-architectuur DNS deels klaar:
  - `overhoorme.nl` → A-record naar Vercel ✅
  - `www.overhoorme.nl` → CNAME naar Vercel ✅
  - `woordjes.overhoorme.nl` → **NOG TOE TE VOEGEN**
  - `mondelingen.overhoorme.nl` → **NOG TOE TE VOEGEN**

---

## 🔴 Open todos (in volgorde van urgentie)

### A. Supabase activeren (BLOKKEREND voor alle nieuwe features)

**Wachten op gebruiker:**
1. Maakt Supabase-project aan: naam `overhoorme`, EU Frankfurt, Free
2. Plakt URL + anon key + service role key in chat
3. Plakt volledige `woordjes` Anthropic-key in chat

**Daarna doe jij (Claude):**
1. Schrijf `.env.local` met de credentials
2. Run `supabase/schema.sql` in SQL Editor (bevestig met gebruiker eerst)
3. Bevestig auth-settings: email confirmation UIT
4. Maak Matthijs admin: SQL `INSERT INTO admins (student_id) SELECT id FROM students WHERE username='<matthijs-username>'`
5. Deploy naar Vercel (env vars zetten via `npx vercel env add`)
6. Test: registreer testaccount, oefen, check saldo, login als admin, schrijf saldo bij

### B. DNS afronden voor subdomeinen

**Bij mijn.host toe te voegen:**

| Type  | Naam         | Content                |
|-------|--------------|------------------------|
| CNAME | `woordjes`   | `cname.vercel-dns.com` |
| CNAME | `mondelingen`| `cname.vercel-dns.com` |

**In Vercel daarna:**
```bash
# In Overhoorme/ directory:
source .env && npx vercel domains add woordjes.overhoorme.nl --token "$VERCEL_TOKEN" --scope mwolters-7525s-projects
source .env && npx vercel domains add mondelingen.overhoorme.nl --token "$VERCEL_TOKEN" --scope mwolters-7525s-projects
```

(Vercel API token zit in `.env`, NIET in `.env.local`)

### C. Mondelingen-app porten van Mondelingen-prototype

Bron: `C:\Users\wlt\Dropbox\Mondelingen\`

**Wat er staat:**
- 21 boek-JSONs in `data/boeken/` (Lezen voor de Lijst niveau 3-6)
- 287 boeken in `data/index.json` (266 nog te synthetisen, ~€90 totaal)
- `prompts/examinator-strict.md` — uitgewerkte system prompt
- `VRAAGTAXONOMIE.md` — 13 vraagcategorieën
- `prototype/server.js` — Express + Anthropic prompt-caching (PUBLIC/ MAP ONTBREEKT — alleen server.js bestaat)

**Te porten naar Next.js routes:**
- `src/app/mondelingen/page.tsx` — boekenlijst (filter op niveau)
- `src/app/mondelingen/[slug]/page.tsx` — boekkaart met "Start mondeling"
- `src/app/mondelingen/[slug]/sessie/page.tsx` — chat + Web Speech
- `src/app/api/mondeling/chat/route.ts` — Anthropic proxy met prompt-caching
- `src/app/api/mondeling/book/[slug]/route.ts` — boek-JSON serven

**Belangrijk**: Vercel free tier heeft 10s timeout op API routes.
Voor LLM-streaming nodig:
- Optie 1: stream chunks elke 5s
- Optie 2: wachten op Hetzner-migratie (geen timeout)
- Optie 3: tijdelijk Vercel Pro

Per turn ~€0,15-0,25. Saldo-systeem koppelen: trek bedrag af van
`students.credits_cents` per voltooide sessie via `balance_transactions`
met `reason='mondeling-sessie'` en negatief delta_cents.

### D. Hetzner-migratie (P3, niet urgent)

Wacht op upgrade van OpenBestuur-VPS (zit op 80% volume, P3 staat al
op LivingMeta-todo). Daarna meeliften op die nieuwe VPS:

1. nginx config voor `overhoorme.nl` en subdomeinen
2. systemd unit `overhoorme.service` met `next start`
3. pm2 of vergelijkbaar voor process management
4. DNS: A-records naar Hetzner-IP (vervang Vercel CNAMEs)
5. Vercel project pas verwijderen na succesvolle live-check

Geen code-wijzigingen nodig — Next.js is al hostingsneutraal opgebouwd
(bevestigd in deze sessie).

### E. Optionele cleanup (geen prioriteit)

1. Verwijder oude Neon-auth code als Supabase volledig live is:
   - `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/sync.ts`
   - `src/app/api/auth/login`, `register`
   - `src/app/api/progress`
   - Dependencies: `@neondatabase/serverless`, `bcryptjs`, `jose`
2. Hernoem GitHub-repo van `woordjes-leren` naar `overhoorme`
3. Hernoem `package.json` `name` van `woordjes-leren` naar `overhoorme`
4. Repo van een externe machine clonen om te testen of niets aan
   het Documenten/Overhoorme-pad hangt

---

## Bestanden die je moet kennen

| Bestand | Doel |
|---------|------|
| `VISION.md` | Visie + commerciële spanning + NOOIT-lijst |
| `CLAUDE.md` | Project overview + architectuur + developer guidelines |
| `SETUP.md` | Stap-voor-stap Supabase-activatie |
| `.env.local.example` | Alle env vars met uitleg |
| `supabase/schema.sql` | DB schema + RLS-policies + triggers |
| `src/middleware.ts` | Subdomein-routing |
| `src/lib/supabase/` | Auth + sync + migratie |
| `src/components/AuthProvider.tsx` | useAuth hook (rest van app gebruikt dit) |
| `src/components/BalanceCard.tsx` | Tegoed UI voor leerling |
| `src/app/admin/saldo/` | Admin Tikkie-bijschrijfpagina |

---

## Hoe je werkt in deze sessie

1. **Conversatie in Nederlands**, code/commits in Engels
2. **Commits**: alleen wanneer expliciet gevraagd door gebruiker.
   Co-Author: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
3. **TypeScript check** na elke wijziging: `npx tsc --noEmit`
4. **Geen Vercel-specifieke features inbouwen** (KV, Edge Config,
   Edge Runtime) — we gaan naar Hetzner toe
5. **Visie respecteren**: bij elke nieuwe feature vragen — kan een
   docent/ouder dit zien? Zo ja, waarom is dat oké?
6. **Geen mondeling-LLM-werk doen** voor Hetzner-migratie tenzij
   expliciet voor Vercel Pro gekozen

## Hoe te deployen

```bash
# Vanuit Overhoorme/ directory:
git push origin master                 # auto-deploy via Vercel
# OF
source .env && npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

## Repo info

- Branch: `master` (NIET `main`)
- Remote: `https://github.com/mwolters-cmyk/woordjes-leren.git`
  (repo nog niet hernoemd — laat staan voor nu)
- Vercel scope: `mwolters-7525s-projects`
- Vercel project: `woordjes-leren` (preview: `woordjes-leren-eight.vercel.app`)

## Belangrijke mappen elders op de machine

| Wat | Waar |
|-----|------|
| Mondelingen prototype + content | `C:\Users\wlt\Dropbox\Mondelingen\` |
| Stack-credentials referentie | `C:\Users\wlt\Dropbox\stacks-en-credentials.md` |
| LivingMeta (Supabase-patroon) | `C:\Users\wlt\Dropbox\LivingMeta\` (passive backup) |
| OpenBestuur (Hetzner-patroon) | `C:\Users\wlt\Dropbox\OpenBestuur\` (passive backup) |
| OCR-foto's voor woordenlijsten | `C:\Users\wlt\Dropbox\Woordjes Leren\klas-{n}\module-{m}\` |
| Toetsdruk JSONs | `C:\Users\wlt\OneDrive...\Stedelijk\Schoolleiding\Examencommissie\Toetsdruk\` |

## Twee Windows-accounts

- `wlt` (school) — deze map staat hier
- `mwolt` (privé) — LivingMeta etc., gedeelde Anthropic key in
  `C:\Users\mwolt\Documents\LivingMeta\.env`

Voor overhoorme.nl gebruiken we de aparte `woordjes` Anthropic key
(in `.env.local` van deze map zodra de gebruiker hem doorgeeft).

---

**Laatste git-state bij overdracht:**
```
0e66fc3 Update CLAUDE.md: nieuwe project-locatie + Supabase-stack
176d330 Add Supabase auth + subdomain architecture + Tikkie balance system
46834ab Add VISION.md: overhoorme.nl is voor de leerling, niet de docent
```

Veel succes!
