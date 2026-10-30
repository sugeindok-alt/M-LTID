# MÅLTID

Matnettside med Next.js, React, TypeScript, Firebase Authentication, Neon PostgreSQL og Drizzle. [GitHub](https://github.com/sugeindok-alt/M-LTID) publiserer automatisk frå main til [Vercel](https://m-ltid.vercel.app/). Eit eige utval med 16 norske middagar, nynorske råvaresider, kombinerte filter og porsjonsval. Det eksisterande designet og personlege data er bevarte.

## Innlogging utan kjøpt domene

Firebase Authentication på Spark-planen handterer e-post/passord, stadfesting og gløymt passord. Firebase sin standardavsendar krev ikkje eige domene. [Gratisplanen har kvotar](https://firebase.google.com/docs/auth/limits); prosjektet aktiverer ingen betalingstenester. Telefonnummer og passordlaus e-postinnlogging er ikkje aktiverte.

Favorittar, handleliste og profil ligg i Neon. Berre verifiserte Firebase-identitetar får ei serverøkt. Firebase sine signerte øktinformasjonskapslar blir kontrollerte på serveren, inkludert tilbakekalling etter passordbyte. Kapslane er HttpOnly, Secure i produksjon og SameSite=Lax. Neon lagrar berre ein hash av øktkapselen; utlogging fjernar denne økta straks.

Alle private sider og bibliotekruter hentar eigaren frå den kontrollerte økta. Førespurnader blir avgrensa med felles teljarar i Neon; mutasjonar krev rett Origin. Vercel må overskrive x-real-ip. Private data har ingen localStorage-reserve.

AUTH_PROVIDER=firebase vel den nye leverandøren og sperrar gamle auth-endepunkt. Eksisterande Better Auth-data blir ikkje sletta. Kontoar blir ikkje automatisk slått saman berre fordi e-postadressa er lik; eventuell migrering må avklarast særskilt. Eksisterande tabellar blir gjenbrukte utan ny SQL-migrering.

## Konfigurering

Bruk Node.js 22+ og npm ci. Kopier .env.example til ei privat .env.local for utvikling.

| Variabel                 | Bruk                                                     |
| ------------------------ | -------------------------------------------------------- |
| DATABASE_URL             | Poola Neon-tilkopling med TLS; separat utviklingsgrein   |
| AUTH_PROVIDER            | firebase                                                 |
| BETTER_AUTH_URL          | Nøyaktig adresse, https://m-ltid.vercel.app i produksjon |
| FIREBASE_PROJECT_ID      | Ditt Firebase-prosjekt                                   |
| FIREBASE_API_KEY         | Firebase web-oppsett, brukt berre frå serveren           |
| FIREBASE_SERVICE_ACCOUNT | Serverkonto-JSON, lagra som Secret i Vercel              |

Ingen auth-variablar skal ha NEXT_PUBLIC_-prefiks. Private filer, nøklar og e-postlenkjer skal aldri i Git eller loggar. Produksjonsløyndomar skal ikkje delast med preview. Firebase-emulatoren er sperra i produksjon og berre tillaten lokalt med eit demo-prosjekt.

Aktiver Email/Password i Firebase, legg produksjonsverten under Authorized domains og vel Norwegian som e-postspråk. Prosjektet maltid-d2c6c brukar Spark. Google sperrar førebels endring av e-postmalar i prosjektet. Standardmal og Firebase si innebygde side for stadfesting/passordbyte blir difor brukte. Desse er på bokmål. Nye skjema og feil på nettsida er på nynorsk. /konto/handling er klar for ein framtidig godkjend Custom action URL, men er ikkje kopla til e-postane enno.

Ny stadfestingslenkje krev e-post og passord. Anonyme e-postførespurnader stadfestar ikkje konto eller levering. Arbeidet køyrer i Next.js after(); teknisk status blir lagra i email_send_records utan mottakaradresse. accepted betyr at Firebase godtok førespurnaden, ikkje innbokslevering. Dette er ikkje ein varig kø; bruk ny førespurnad ved feil.

## Database og testing

Neon Free har separate production- og development-greiner. Migreringane i drizzle/ opprettar 15 tabellar; 0001 legg berre til recipe_catalog. Kontroller SQL før migrering; bygg endrar ikkje databasen automatisk. Drizzle brukar @neondatabase/serverless over WebSocket, poola tilkopling og ekte transaksjonar. Favorittar har ein unik brukar–oppskrift-nøkkel; metadata ligg i recipe_cache. Sjå [katalogrettleiinga](docs/CONTENT.md) for trygg publisering av innhald med direkte migreringstilkopling.

Vanlege kommandoar: npm run dev, npm run typecheck, npm run lint, npm test og npm run build. Ein samla Firebase-test brukar den offisielle lokale Auth-emulatoren og PGlite som separat PostgreSQL-testdatabase. Ingen ekte e-post blir send:

```powershell
firebase emulators:start --only auth --project demo-maltid
# I ein annan terminal:
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
npx vitest run tests/firebase-auth.test.ts
```

Testen dekkjer verifisering, to isolerte kontoar, favorittar etter ny økt, utlogging, passordbyte, tilbakekalling, brukte/ugyldige lenkjer og opphavskontroll. Han blir hoppa over utan emulator. Dei eldre Better Auth-testane er bevarte; test:e2e:auth gjeld den eldre leverandøren og lokal fil-e-post. Sjå [verifikasjonsrapporten](docs/VERIFICATION.md).

## Innhald og andre tenester

MÅLTID sin redaksjonelle Neon-katalog er hovudkjelde. Oppskriftstekstane er nyskrivne med KI-hjelp, med rettleiande tidsestimat; dei er ikkje kjøkkentesta. Alle 16 matillustrasjonane er genererte spesielt for rettane og blir merkte synleg. Sjå [innhald, biletrettar og vedlikehald](docs/CONTENT.md). TheMealDB-adapteren er berre att for eldre testar og er ikkje brukt av nettsida. Den tidlegare lagra pastaoppskrifta held på ID og favorittkopling, med norsk presentasjon.

Open Food Facts leverer konkrete produktdata med kjelde/lisens og NOVA når grunnlaget finst. Ukjent skal ikkje tolkast som NOVA 1. Manglande norsk produktnamn gir norsk reservevising. OPENFOODFACTS_CONTACT_EMAIL kan vere ei reell kontaktadresse; elles identifiserer User-Agent tenesta med den offentlege repo-adressa. OPENFOODFACTS_ENV=staging brukar produkt-staging; standard er produksjon. Namnesøk går til offentleg Search-a-licious. Søk skjer ved innsending, med timeout, cache og førespurnadsgrenser.

Resend er valfritt for oppskrifts-e-post og eldre Better Auth. Det krev framleis verifisert avsendardomene for vanlege mottakarar. Oppskrifts-e-postknappen er skjult utan Resend-oppsett. Firebase sender berre konto-e-postar.

## Publisering og drift

main utløyser Vercel-bygg. vercel.json peikar på .next-production. GitHub Actions køyrer vanlege prosjektkontrollar. Kontroller commit og produksjonsadresse etter publisering.

Rydd utgåtte økter, teljarar og e-postloggar etter ei dokumentert lagringstid; scripts/cleanup.sql er ein manuell mal. Eigar må fullføre kontaktopplysningar, behandlingsansvar og rutinar på personvernsida før brei lansering. Firebase og Neon har kvar sine kontodata; sletting i berre éi teneste slettar ikkje den andre identiteten. Ingen uavhengig tryggleiksrevisjon eller full WCAG-sertifisering er utført.
