# overhoorme.nl — Visie

## Kernidee

**overhoorme.nl is voor de leerling, niet voor de docent of ouder.**

De ervaring leert dat leerlingen het beste oefenen zonder pottenkijkers. Pubers willen
relaxed, op hun eigen telefoon, op hun eigen tempo, in hun eigen tijd kunnen oefenen —
net zo lang tot ze het écht goed kennen. Geen druk van een docent die de Leitner-statussen
inkijkt, geen ouder die "heb je nu echt al gestudeerd" vraagt.

De meeste docenten en ouders zijn — onbedoeld — te streng en te dwingend voor pubers.
Dat werkt averechts. Wie zich bekeken voelt, oefent korter en minder eerlijk
("ik heb het toch wel goed", terwijl het antwoord daar weken niet in zit).

Daarom:
- Geen klassenranglijst die docenten zien
- Geen voortgangs-mail naar ouders
- Geen "tijd besteed"-rapportages
- Wel: feedback die *de leerling zelf* nuttig vindt — wat zit in welke box,
  hoe ver ben je richting toetsklaar, welke woorden zijn jouw zwakke plek

## Product-implicatie van deze visie

| Wel | Niet |
|-----|------|
| Leitner-boxen zichtbaar voor leerling | Boxen zichtbaar voor docent |
| Streak op leerlingniveau (eigen motivatie) | Klassen-streak / leaderboard |
| Per-lijst voortgang in eigen account | Docent-dashboard met namen |
| Optionele export "deel met docent" | Standaard meekijken |
| Mondeling-feedback voor de leerling zelf | Cijfer dat naar SOM gaat |

## Commerciële spanning (te tackelen)

De financiers van dit product — scholen, ouders — zijn **by design** buiten beeld.
Dat is het kernprincipe. Tegelijk: zij moeten wél overtuigd worden om te betalen.

Dit is een bekende spanning bij privacy-first kindertools (denk aan: hoe verkoop je
een dagboek aan iemand anders dan de schrijver?). Mogelijke oplossingsrichtingen
(later uit te werken):

1. **Geaggregeerde school-licentie** — school betaalt vast bedrag per leerling per jaar,
   ziet alleen "X% van leerlingen actief deze maand", geen individuele data
2. **Vrijwillig delen** — leerling kan ad-hoc een rapport exporteren ("ik wil mijn
   docent laten zien dat ik geoefend heb voor een herkansing")
3. **Anonieme aggregatie** — "klas 3A heeft samen 12.000 woorden geoefend deze week",
   geen herleidbaarheid naar individuen
4. **Ouder-betaling als donatie/abonnement** — ouder betaalt €3/maand, krijgt geen
   voortgangsrapportage, accepteert dat dit het ontwerp is. "Bijdrage aan een tool
   die je kind zelfstandig laat leren."
5. **Leerling-zelf-betaalt** — niet realistisch voor pubers, maar wel zuiverst

Geen van deze nu uitgewerkt. Eerst: werkende MVP, leerlingen testen, daarna pas
de financieringsvraag.

## MVP-scope (huidig)

- ✅ Vocabulaire-app (woordjes.overhoorme.nl) — werkt
- 🚧 Mondelingen-app (mondelingen.overhoorme.nl) — in ontwerp
- 🚧 Auth via Supabase (leerlingnummer + wachtwoord, magic link, of nog te bepalen)
- 🚧 Voortgang server-side opgeslagen i.p.v. localStorage
- 🚧 Hetzner-deploy (Vercel afbouwen)

## Wat NOOIT in dit product hoort

- Notificaties naar ouders/docent zonder expliciete leerling-toestemming
- Verplichte tijdregistratie zichtbaar voor anderen
- Leaderboards die individuen aanwijzen
- "Reminder" e-mails die leerling laten weten dat ze "achterlopen"
- Gamification die schaamte-mechanismen gebruikt (streak-loss-shaming, public humiliation)

De toon is: **"Jouw oefenruimte. Jouw tempo. Jouw geheim."**
