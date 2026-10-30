# Verifikasjon — 30. oktober 2026

## Gjennomførte kontrollar

| Kontroll                        | Resultat                       | Kva det dokumenterer                                               |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| TypeScript, `npm run typecheck` | Bestått                        | Streng typesjekk av frontend, backend, migreringsoppsett og testar |
| ESLint, `npm run lint`          | Bestått utan åtvaringar        | Next.js/React, TypeScript og tilgjengelegheitsreglar               |
| Vitest, `npm test`              | 65 testar bestått              | API-grenser, NOVA, mengder, PostgreSQL, konto og e-postflyt        |
| Next.js, `npm run build`        | Bestått                        | Fullt produksjonsbygg med webpack og éin byggjearbeidar            |
| TheMealDB live                  | HTTP 200 og data i nettlesaren | Lookup, søk, kategoriar, ingrediensar og ekte bilete               |
| Desktop, faktisk nettlesar      | Visuelt kontrollert            | Framside, oppskriftsdetaljar og ingrediensutforsking               |
| Mobil, 390 px                   | Framside og meny kontrollerte  | Responsiv framside utan horisontal overflyt; mobilmeny opnar       |

Testane bruker PGlite, som køyrer PostgreSQL i WASM, og den faktiske SQL-migreringa i `drizzle/`. Dei bruker Better Auth og den faktiske Drizzle-adapteren. Det er ikkje ein handskriven auth-mock eller ein test mot Neon. Berre den eksterne e-postleveringa blir erstatta med ein trygg transport.

Testane dekkjer blant anna:

- Feilforma eksterne data, tidsavbrot, tomme søk og ikkje-eksisterande oppskrifter.
- Fjerning av tomme ingrediensfelt og bevaring av ukjende mengder.
- NOVA 1–4 og ukjende/ugyldige verdiar, utan utleiing frå produktnamn.
- Dokumenterte API-ruter og identifiserande User-Agent.
- Registrering med hasha passord, sperre før e-postverifisering, verifisering og velkomst.
- Innlogging, utlogging, falske økt-token og feil passord.
- Passordreset med gyldig, utgått og brukt token; tilbakekalling av økter.
- Favorittar etter utlogging/ny innlogging, unik lagring og isolasjon mellom to brukarar.
- Varig handleliste, kompatibel mengdesamanslåing, redigering, kjøpt-status og eigarkontroll.
- Samtidige dupliserte handleimportar, atomisk rate limiting, idempotent e-postsending og providerfeil.
- Same-origin-sperre på faktiske auth-ruter og inputgrense/trygge feilsvar.

## Playwright

Produksjonsserver: **16 av 16 testar bestått**, med det ferdige Next.js-produksjonsbygget. Desktop og mobil er kontrollerte.

Siste fullførte køyring mot utviklingsserveren gav **14 av 16 bestått**. To testar trefte Next.js-feilen `SyntaxError: Unexpected end of JSON input` under sidekompilering og fekk tidsavbrot. Det er ikkje ein bestått utviklingsserverpakke. Produksjonskøyringa blir rapportert separat ovanfor.

Pakken har åtte testar kvar for desktop og mobil: bilete og overflyt, navigasjon, søk/filter/sortering, oppskriftssteg, ingredienssøk, produktfeil/ukjend NOVA, private sider og not-found/noindex. TheMealDB blir brukt live. OFF-resultat og feil blir erstatta ved HTTP-grensa; dette er ikkje ein live OFF-test.

Køyr utan auth-nøklar i testmiljøet:

```powershell
npm run test:e2e
```

For produksjonsbygget, stopp eventuell server på port 3000 først:

```powershell
npm run build
$env:PLAYWRIGHT_PRODUCTION='1'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

Playwright startar og stoppar serveren. Google Chrome er standard; set `PLAYWRIGHT_CHANNEL=msedge` for Edge. Testserveren får eksplisitt lokalt opphav, også i produksjonsmodus. Han får ingen database- eller e-postnøklar frå testoppsettet.

## Avhengigheiter

Installering og npm sin audit-kontroll rapporterte **0 kjende sårbarheiter** etter ei avgrensa oppdatering av `esbuild` under `@esbuild-kit/core-utils`. Dette er ikkje ei uavhengig sikkerheitsrevisjon. Drizzle-genereringa, 65 Vitest-testar og produksjonsbygget vart kontrollerte etter oppdateringa.

## Skjermbilete frå faktisk køyring

- [Desktop, framside](screenshots/desktop-home.png)
- [Mobil, framside](screenshots/mobile-home.png)
- [Desktop, oppskriftsdetaljar](screenshots/desktop-recipe.png)
- [Mobil, oppskriftsdetaljar](screenshots/mobile-recipe.png)

Bileta kjem frå Playwright med ekte TheMealDB-data og foto. Dei er ikkje designmockupar.

## Avgrensingar som krev eksternt oppsett

- Ingen Neon-tilkoplingsstreng var tilgjengeleg. Produksjonsmigrering, nettverk, pooling og to faktiske nettlesarkontoar mot Neon er ikkje live-verifiserte.
- Ingen Resend-nøkkel eller verifisert avsendardomene var tilgjengeleg. Faktisk levering til innboks og providerlogg er ikkje verifiserte.
- Ingen Open Food Facts-kontaktadresse var konfigurert. Live produkt- og Search-a-licious-oppslag er ikkje verifiserte i denne installasjonen; adapterane er testa med eksterne responsformat ved grensa.
- Ingen Vercel-deploy vart brukt. GitHub-publisering gjer kjeldekoden offentleg, men publiserer ikkje ei køyrande nettside.

## Windows-miljø

Produksjonsbygget fullførte med vanlege prosessrettar. Sandbox-køyringar fekk stundom `EPERM` på genererte mapper; automatiske tilgangskontrollar fekk òg tidsavbrot. Desse forsøka er ikkje rekna som beståtte testar. Next.js bruker éin byggjearbeidar og separate mapper for utvikling (`.next`) og produksjon (`.next-production`).

Les [README](../README.md) for miljøvariablar, migreringar, lisensgrenser og full live-sjekkliste.
