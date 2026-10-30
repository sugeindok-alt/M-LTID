# MÅLTID 1.0

Ei redaksjonell matplattform med Next.js App Router, React, TypeScript, Tailwind CSS, Motion, Better Auth, Neon PostgreSQL, Drizzle og Resend. UI er på nynorsk. Originalt oppskriftsinnhald blir bevart.

Offentleg kjeldekode: [sugeindok-alt/M-LTID](https://github.com/sugeindok-alt/M-LTID).

## Status og kva som er verifisert

- Lokalt implementert: oppskrifts- og ingrediensutforsking, søk/filter/sortering, detaljsider, kokesteg, favorittar, handleliste, produktoppslag/NOVA, konto, verifisering, passordbyte, profil og fem tema.
- TheMealDB er verifisert med ekte HTTP-svar og bilete i nettlesaren.
- Autentisering og datalagring blir testa med den faktiske Better Auth-koden og Drizzle-migreringane i PGlite (PostgreSQL i WASM). Dette er **ikkje** ein verifikasjon av ein Neon-konto eller Neon sitt nettverk.
- E-posttestane erstattar berre leveringstransporten. Dei testar ekte verifiserings- og reset-token. Ingen ekte e-post er send under testane.
- Neon, Resend-levering, Open Food Facts i denne installasjonen og Vercel-deploy krev oppsett frå eigaren. Ingen nøklar eller kontoar vart oppdikta.
- Sjå [testoversikta](docs/VERIFICATION.md) for resultat og avgrensingar.

## Kom i gang

Node.js 22+ er tilrådd (testa med Node 24). Bruk npm og den innsjekka `package-lock.json`.

```powershell
cd C:\MÅLTID
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Opne <http://localhost:3000>. Oppskrifter og ingrediensar fungerer utan database. Kontoformene viser ei ærleg oppsettsmelding til nødvendige variablar er på plass. Private data har ingen lokal nettlesar-fallback.

### 1. Neon Free

1. Opprett eit prosjekt i [Neon](https://neon.com/docs/get-started-with-neon/signing-up). Vel ein region nær Vercel-regionen din.
2. Kopier PostgreSQL-tilkoplingsstrengen frå **Connect**, gjerne den poola strengen med `sslmode=require`.
3. Legg strengen i `DATABASE_URL` i `.env.local`. Ikkje legg han i ein variabel med `NEXT_PUBLIC_`.
4. Køyr `npm run db:migrate`. Dette bruker dei versjonerte SQL-filene i `drizzle/`.
5. Ved framtidige skjemaendringar: rediger `src/db/schema.ts`, køyr `npm run db:generate`, kontroller SQL-en, og køyr migreringa mot rett database. Ta backup før endringar i produksjon.

Databaseklienten bruker `@neondatabase/serverless` over WebSocket og Drizzle sin `neon-serverless`-adapter. Applikasjonstransaksjonar er reelle PostgreSQL-transaksjonar. Konto og handleliste blir aldri emulerte med localStorage.

### 2. Better Auth

Generer ein hemmeleg verdi lokalt:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Set `BETTER_AUTH_SECRET` til verdien, og `BETTER_AUTH_URL=http://localhost:3000`. Bruk same vertsnamn i nettlesaren; `localhost` og `127.0.0.1` er ulike opphav når URL-en er konfigurert.

Better Auth handterer passordhashing, sikre øktinformasjonskapslar, e-postverifisering og expirerande token. E-post må vere stadfesta før innlogging. Reset-token varer i 30 minutt; verifiseringstoken varer i éin time. Passordbyte trekkjer tilbake eksisterande økter.

Autentisering har databasebasert rate limiting. Applikasjonsmutasjonar kontrollerer `Origin`, krev servervalidert økt og utleier eigaren frå økta. Set aldri `disableOriginCheck` eller `disableCSRFCheck`. Vercel/proxy må overskrive `x-real-ip`; ikkje stol på klientleverte IP-headerar dersom du driftar ein eigen offentleg origin.

### 3. Trygg lokal e-posttesting

Med Neon og auth-secret konfigurert kan du bruke:

```env
EMAIL_TRANSPORT=file
```

Køyr utviklingsserveren og registrer ein **testkonto**. HTML-meldinga blir lagra i `.local/mail/`, som er ignorert av Git og aldri blir servert som ein offentleg mappe.

```powershell
npm run mail:list
```

Opne den aktuelle HTML-fila lokalt og følg lenkja. Filene inneheld verifiserings-/reset-token; del dei ikkje. UI seier uttrykkeleg at e-posten er lagra lokalt og ikkje send. `file`-transport er sperra når `NODE_ENV=production`.

Automatiske testar treng **ingen** Neon- eller Resend-konto:

```powershell
npm test
```

### 4. Resend

1. Opprett ein [Resend-konto](https://resend.com/docs/introduction) og ein API-nøkkel med berre nødvendig sendetilgang.
2. Legg til eit domene du eig under Domains og legg dei oppgitte DNS-postane inn hos DNS-leverandøren.
3. Vent til domenet er verifisert. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL=MÅLTID <mat@ditt-domene.no>` og `EMAIL_TRANSPORT=resend`.
4. Send ei testverifisering til ei adresse du kontrollerer. Kontroller leveringsstatus i Resend.

Standard testavsendar på `resend.dev` kan berre sende til kontoeigaren si adresse. Eit verifisert domene er nødvendig for vanlege brukarar. Gratisplanen har leveringsgrenser som kan endrast; sjå [gjeldande prisar og kvotar](https://resend.com/pricing). Koden kjøper ingen tenester.

Verifisering, velkomst, reset og oppskriftsdeling har eigne HTML-malar. Oppskrifter blir berre sende til den innlogga brukaren si stadfesta adresse. E-postlogging har unik idempotensnøkkel; same oppskrift blir deduplisert i fem minutt. Oppskriftsdeling er avgrensa til fem førespurnader per brukar per time. `accepted` betyr at leverandøren tok imot meldinga, **ikkje** at ho vart levert i innboksen. Leverings-/bounce-webhooks er ikkje implementerte.

Velkomstfeil blir logga utan å trekkje tilbake ei fullført verifisering. Andre sendefeil blir kasta vidare. Ein mislukka idempotensnøkkel blir ikkje automatisk sendt på nytt; be om ny lenkje, eller vent til neste femminuttsvindauge for oppskriftsdeling. Dette prioriterer å unngå doble sendingar etter uklåre leveringsfeil.

### 5. Open Food Facts

Set `OPENFOODFACTS_CONTACT_EMAIL` til ei reell kontaktadresse eigaren følgjer opp. Adapteren sender `User-Agent: MALTID/1.0 (kontaktadresse)`.

- `OPENFOODFACTS_ENV=staging`: strekkodeoppslag mot OFF staging med dokumentert testautentisering. Bruk dette ved utvikling.
- `OPENFOODFACTS_ENV=production`: oppslag mot produksjonsdatabasen.
- Namnesøk bruker den dokumenterte Search-a-licious-tenesta på `search.openfoodfacts.org/search`. Denne tenesta er separat frå produkt-staging; namnesøk går til den offentlege søkjetenesta også i lokal modus.
- Produkt: `/api/v3.6/product/{barcode}.json`. Namnesøk bruker ikkje det ugyldige mønsteret `api/v2/search?search_terms=...`.
- 10 sekund timeout, eksplisitt innsending, åtte treff og 24 timars cache. Ingen søk medan brukaren skriv.
- Global databasebasert grense på åtte søk og tolv produktoppslag per minutt. Produksjon krev database for å dele grensene mellom instansar. Utvikling utan database bruker avgrensa minnecache og lokal teljar.
- Registrerte NOVA-felt er ikkje uavhengig validerte av MÅLTID. Ukjent blir aldri tolka som NOVA 1. Oppskriftsklassifisering blir aldri utleidd frå generelle ingrediensnamn.

OFF-data ligg separat i `off_product_cache`; brukarval inneheld berre referansar til produkt. Database: ODbL, innhald: DbCL, bilete: CC BY-SA. Vidaredistribusjon av ein avleidd OFF-database må følgje lisensvilkåra. Kjelder og lisensar står ved produktresultata. Sjå [API-dokumentasjon](https://openfoodfacts.github.io/openfoodfacts-server/api/), [søke-API](https://openfoodfacts.github.io/search-a-licious/users/ref-openapi/) og [lisensrettleiing](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side/).

### 6. TheMealDB

`THEMEALDB_API_KEY=1` er utviklings-/undervisningsnøkkelen. Alle kall er gratis V1-endepunkt: search, lookup, filter, list og categories. Fleire valde filter blir kryssa lokalt etter separate V1-kall. Ingen premium-endepunkt blir brukte.

Gratis-API-et er ikkje ei full databaseeksport og kan avgrense resultat. Oppskriftene har ikkje pålitelege felt for popularitet, koketid, porsjonar eller næringsverdiar. Framsida viser difor eit utval og kvardagsinspirasjon utan slike påstandar. Mengdefaktor blir berre tilbydd når alle mengder kan parsast sikkert; det er ikkje eit oppdikta porsjonstal.

Kontroller [API-vilkåra](https://www.themealdb.com/api.php) og [FAQ](https://www.themealdb.com/faq.php) før kommersiell eller appbutikk-lansering. TheMealDB forventar kommersiell støtte ved kommersiell bruk og supporter-nøkkel ved appbutikkpublisering. Dette prosjektet legg ikkje til eit betalt abonnement.

## Arkitektur

| Fil/mappe                                   | Ansvar                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `src/app/`                                  | Serverrenderte sider, metadata, lastetilstandar og API-ruter        |
| `src/components/`                           | Responsive komponentar og faktiske brukarhandlingar                 |
| `src/app/globals.css`                       | Fem sentrale design-token-tema, typografi og responsive stilreglar  |
| `src/lib/meal-api.ts`                       | Server-only, validering/normalisering av V1-data, cache og timeout  |
| `src/lib/recipes.ts`                        | Delte domeneobjekt, reine normaliseringsfunksjonar og trygge URL-ar |
| `src/lib/products.ts`, `product-service.ts` | OFF-adapter, separat cache og felles rate limiting                  |
| `src/lib/auth.ts`, `email.ts`               | Better Auth, e-postmalar, levering og idempotens                    |
| `src/lib/library.ts`                        | Eigarskap, favorittar, handleliste, profil og produktreferansar     |
| `src/lib/http.ts`                           | Øktkontroll, same-origin-mutasjonar, validering og trygge feil      |
| `src/db/schema.ts`, `drizzle/`              | Tabellar, nøklar, indeksar og versjonerte migreringar               |
| `tests/`                                    | Vitest med ekte lokal PostgreSQL og Playwright med desktop/mobil    |

Ein «lagra oppskrift» og ein «favoritt» er same brukar–oppskrift-kopling, med ein unik samansett nøkkel. Oppskriftsmetadata ligg i `recipe_cache`. Dette unngår to konkurrerande favorittlister. Handleimport og mengdesamanslåing skjer i ein transaksjon; idempotensnøklar stoppar duplikate retry-førespurnader. Frie eller inkompatible mengder blir haldne separat.

## Kommandoar

```powershell
npm run dev          # utvikling, webpack
npm run typecheck
npm run lint
npm test             # 65 einings-/integrasjonstestar, ingen eksterne kontoar
npm run test:e2e     # ekte TheMealDB i UI; OFF-feil/resultat blir mocka ved nettgrensa
npm run build
npm start
npm run db:generate
npm run db:migrate
```

Playwright bruker installert Google Chrome som standard. Du kan bruke `PLAYWRIGHT_CHANNEL=msedge` om Edge er installert. E2E-testen for uferdig konto-oppsett forventar at auth-nøklar ikkje er sette; køyr denne pakken i eit eige miljø utan produksjonsnøklar. Testane lagrar skjermbilete under `docs/screenshots/` og rapport under `playwright-report/`. Gjer ikkje nettbaserte E2E-testar til ein stor parallell belastning mot gratis-API-a.

For å teste produksjonsbygget: køyr `npm run build`, stopp eventuell server på port 3000, og køyr `$env:PLAYWRIGHT_PRODUCTION='1'; npm run test:e2e` i PowerShell. Playwright startar og stoppar produksjonsserveren med lokalt testopphav. Fjern variabelen med `Remove-Item Env:PLAYWRIGHT_PRODUCTION` for å gå tilbake til utviklingsmodus. Typesjekken genererer nødvendige Next.js-typar også etter ei fersk kloning.

## Deploy til Vercel

1. Legg prosjektet i ditt Git-repository og importer det til [Vercel](https://vercel.com/docs/frameworks/nextjs). Framework: Next.js. Build: `npm run build`.
2. Bruk Node.js 22 eller nyare. Vel ein region nær Neon. Bruk separat Neon-grein/database og separate nøklar for preview.
3. Set miljøvariablane frå `.env.example` i Vercel. `BETTER_AUTH_URL` må vere den nøyaktige HTTPS-adressa til produksjon. `EMAIL_TRANSPORT=resend` og `OPENFOODFACTS_ENV=production`.
4. Køyr migreringa mot produksjonsdatabasen frå ei kontrollert økt før første produksjonsbruk. Bygget migrerer ikkje automatisk ein database.
5. Deploy. Verifiser registrering → e-post → innlogging → favoritt → refresh → utlogging/innlogging. Gjenta med to kontoar og kontroller eigarisolasjon. Test ekte Resend-levering og OFF-strekkode med di kontaktadresse.
6. Fullfør opplysningane om behandlingsansvarleg, kontakt, lagringstider og rettar i `src/app/personvern/page.tsx` før du inviterer offentlege brukarar.

Vercel Hobby, Neon Free og Resend Free har bruksgrenser og vilkår, og eignar seg ikkje nødvendigvis for kommersiell drift. Sjå eigarane sine gjeldande vilkår. Kjeldekoden er offentleg på GitHub; ei offentleg, køyrande nettside er ikkje deploya eller knytt til Neon/Resend av denne leveransen.

## Drift og avgrensingar

- Køyr migreringar før trafikk; bruk TLS og sikre secrets i deployplattformen.
- Rydd utgått produktcache, rate-teljarar, gamle handleimportnøklar og e-postloggar etter ei dokumentert lagringspolicy. `scripts/cleanup.sql` er ein manuell mal, ikkje ein automatisk jobb.
- Eit feilande upstream-API gir feilmelding og ny prøve, aldri syntetiske oppskrifter.
- Mat-/produktdata kan vere ufullstendige. Kontroller allergen på emballasje; NOVA er ikkje medisinsk rådgjeving eller ei full næringsvurdering.
- Engelsk kjeldeinnhald er ikkje maskinomsett eller merka som kvalitetssikra omsetjing.
- Ingen uavhengig sikkerheitsrevisjon eller full WCAG-sertifisering er utført. Testresultat viser konkret utførte sjekkar.
