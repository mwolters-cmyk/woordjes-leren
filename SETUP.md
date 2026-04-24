# overhoorme.nl — Setup

## Eerste keer Supabase activeren

### 1. Maak Supabase-project aan

1. Ga naar https://supabase.com/dashboard → New project
2. Settings:
   - **Name**: `overhoorme`
   - **Region**: `EU Central (Frankfurt)` (laagste latency NL)
   - **Plan**: Free
   - **Wachtwoord**: noteer ergens veilig (DB-master-password)
3. Wacht ~2 min tot project opgespind is

### 2. Run SQL-schema

1. Open Supabase Dashboard → SQL Editor → New query
2. Plak de inhoud van `supabase/schema.sql`
3. Klik Run
4. Tabellen die nu bestaan:
   - `public.students` (profielen, met `credits_cents` veld)
   - `public.word_progress`
   - `public.list_progress_meta`
   - `public.student_streak`
   - `public.balance_transactions` + `public.admins`
   - `public.mondeling_sessions` (placeholder)

### 3. Auth-instellingen

Supabase Dashboard → Authentication → Providers → Email:

- **Enable email signup**: ✅ aan
- **Confirm email**: ❌ UIT (anders wachten leerlingen op een
  bevestigings-mail die nooit aankomt op `pepijn@overhoorme.local`)
- **Secure email change**: ❌ uit (geen e-mail nodig)

### 4. Plak credentials in `.env.local`

Kopieer `.env.local.example` → `.env.local` en vul in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<projectref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # GEHEIM
ANTHROPIC_API_KEY=<woordjes-key>
```

Project credentials vind je in Supabase Dashboard →
Project Settings → API.

### 5. Maak jezelf admin

Na je eerste signup als docent:

```sql
-- In Supabase SQL Editor:
INSERT INTO public.admins (student_id)
SELECT id FROM public.students WHERE username = 'jouwusername';
```

Daarna heb je toegang tot `/admin/saldo`.

---

## Hoe Tikkie-flow werkt

1. **Leerling** ziet in eigen account de `BalanceCard` met saldo
   en knop "Stuur Tikkie"
2. **Leerling** stuurt Tikkie via `https://tikkie.me/pay/abfvlr6u88q23pa1rk2t`
   en typt eigen username (bv. `pepijn`) als kenmerk in
3. **Docent** ontvangt push-melding van Tikkie met bedrag + kenmerk
4. **Docent** logt in, gaat naar `/admin/saldo`, vult in:
   - Username: `pepijn`
   - Bedrag: `5,00`
   - Omschrijving: `Tikkie 25 apr` (optioneel)
5. **Server** schrijft transactie weg, trigger update student saldo
6. **Leerling** ziet binnen seconden nieuw saldo in eigen account

Alle transacties zijn auditable via `balance_transactions`.

---

## Subdomein-DNS

Voeg bij mijn.host toe (al gedaan voor woordjes.* en mondelingen.*):

| Type  | Naam         | Content                |
|-------|--------------|------------------------|
| A     | (leeg = `@`) | `76.76.21.21`          |
| CNAME | `www`        | `cname.vercel-dns.com` |
| CNAME | `woordjes`   | `cname.vercel-dns.com` |
| CNAME | `mondelingen`| `cname.vercel-dns.com` |

Vercel dashboard → Project Settings → Domains: voeg alle 4 toe.

---

## Migratie van bestaande gebruikers

Bestaande leerlingen die al localStorage-data hebben:

1. Zien straks bij eerste bezoek na deploy: login-pagina
2. Maken nieuw account aan met username naar keuze
3. Bij eerste login wordt automatisch `migrateLocalStorageToSupabase`
   getriggerd → alle voortgang wordt geüpload naar Supabase
4. Migratie is idempotent: kan niet dubbel uitgevoerd worden
5. Lokale localStorage blijft bestaan als fallback (totdat de
   browser cache wordt geleegd)

Reset migratie-flag (alleen voor debug):
```js
localStorage.removeItem('woordjes-leren-migrated-to-supabase')
```

---

## Hetzner-migratie (later)

Wanneer Hetzner-VPS opgespind wordt (P3 op LivingMeta-todo):

1. Volledige Next.js codebase blijft hetzelfde
2. `next build` draait op de VPS
3. nginx als reverse proxy (zoals OpenBestuur)
4. systemd unit: `overhoorme.service`
5. DNS: A-records → Hetzner-IP (vervang Vercel CNAMEs)
6. Vercel project pas verwijderen na succesvolle live-check

Geen code-wijzigingen nodig — Next.js is hostingsneutraal opgebouwd
(geen Vercel-specifieke features gebruikt).

---

## Visie-check

Bij elke nieuwe feature: lees `VISION.md`. Geen leaderboards die
docenten/ouders inzicht geven. Saldo-systeem is **toegestaan**
omdat het de leerling zelf empowered (eigen Tikkie sturen),
niet omdat het ouders inzicht geeft.
