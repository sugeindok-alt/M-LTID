# Verifikasjon — 30. oktober 2026

## Kontoflyten

- TypeScript og ESLint: bestått.
- Vitest: **74 testar bestått** i fem testfiler.
- Next.js-produksjonsbygg: bestått med webpack.
- Playwright mot produksjonsbygget: **16 av 16 bestått**, desktop og mobil.
- Playwright med to separate nettlesarøkter mot **ekte Neon-utviklingsdatabase**: **bestått**. E-posttransporten var lokal fil; ingen eksterne meldingar vart sende.

Neon-nettlesartesten køyrer registrering → sperra innlogging før verifisering → verifisering → innlogging; lagring av favoritt → omlasting → utlogging → ny nettlesarøkt → same favoritt; to kontoar med isolerte favorittar og forsøk på fjerning med forfalska eigar; gløymt passord → nytt passord → tidlegare økt tilbakekalla → ny innlogging med favoritten bevart.

Dei automatiserte PostgreSQL-testane bruker PGlite og same migrering og Better Auth-kode. Dei dekkjer i tillegg ugyldige, brukte og utgåtte verifiserings-/reset-lenkjer, passordhashing, feil passord, falske og ikkje-verifiserte økter, sikre HTTPS-informasjonskapslar, førespurnadsgrenser, opphavskontroll og personleg Cache-Control. API-testen brukar to ekte Better Auth-økter gjennom bibliotekrutene; berre ekstern oppskriftsleverandør og e-posttransport blir erstatta.

Test av sendefeil dokumenterer likt offentleg svar for kjend og ukjend adresse, registrert failed-status og ingen leverandørdetaljar i loggen. Produksjonskode brukar Next.js after() slik at leverandørventing ikkje røper konto gjennom svartid. Dette er ikkje ein varig jobbkø. UI stadfestar aldri utsending eller innbokslevering frå ein anonym førespurnad.

## Database og miljø

Neon-prosjekt: maltid-production, Frankfurt, PostgreSQL 17, organisasjonen sin Free-plan. Eit eldre, uvedkomande prosjekt vart ikkje endra.

- Produksjonsgrein: production.
- Separat test-/utviklingsgrein: development.
- Migrering 0000_ambitious_spencer_smythe er brukt i éin transaksjon etter at tomt skjema vart stadfesta.
- **14 tabellar**, framandnøklar, unike indeksar og Drizzle-migreringsjournal er stadfesta i produksjonsdatabasen.
- Migreringshash: d058d4bbe19f6daaaf880f8e83a944035983b4d91dc59ac7a217aea315fca744.
- Ingen produksjonsbrukarar eller produksjonsfavorittar er oppretta. Testkontoane ligg berre i development.
- Poola WebSocket-tilkopling er brukt av den faktiske lokale nettsida i nettlesartesten.
- DATABASE_URL, BETTER_AUTH_SECRET og BETTER_AUTH_URL er lagra som skjulte Production-variablar i Vercel. Utvikling har separat URL og sesjonsløyndom i Git-ignorert .env.local.
- Ingen endring slettar eksisterande produksjonsdata. Ingen betalt plan er aktivert.

## Feil som vart funne og retta

- Ein tidleg favorittklikk kunne gå tapt før React var klar, og første favorittoppslag kunne konkurrere med lagring. Kontrollane ventar no på oppstart og favorittstatus, og viser lastingsfeil med nytt forsøk.
- Den gamle gløymt-passord-adressa gav 404 i den faktiske Windows-nettlesartesten. Intern navigasjon brukar no /gloymt-passord, med omdirigering frå den gamle adressa. Brukarvend tekst er framleis nynorsk.
- Verifiseringslenkjer blir no konsumerte atomisk som tokenhashar i databasen; replay gir ikkje ny økt.
- Auth-skjema brukar POST også før JavaScript er klart, og ukjende interne feilmeldingar blir ikkje viste til brukaren.
- Auth-ruter avviser for store førespurnader og set private, no-store.
- Lokal request-logging er slått av slik at lenkjetoken ikkje hamnar i utviklingsloggen.

## Produksjon og konkrete blokkeringar

Den eksisterande publiserte versjonen på https://m-ltid.vercel.app/ kjem frå commit a233187e0d4a62fcf5721acb07c0ee2f7829811b. Den nye kontokoden er ikkje aktivert som ferdig produksjonsfunksjonalitet enno.

Resend-kontoen er tilgjengeleg, men det einaste eksisterande domenet hadde status Failed. Eigaren opplyser at han ikkje eig eit avsendardomene. Resend krev eit verifisert domene for å sende til vanlege brukarar. resend.dev kan berre brukast til testing mot adressa til Resend-kontoen. Produksjonsvakta avviser testdomenet.

Faktisk Resend-levering, full kontoflyt på produksjonsadressa og endeleg publisering er **ikkje verifiserte**. Nettlesartest med lokale e-postfiler er ikkje dokumentasjon på faktisk e-postlevering. Eigaren har avklart ei privat testadresse; ho blir ikkje lagra i Git. Ingen andre mottakarar er godkjende.

## Køyre testane

Standardkontroll: npm run check og npm run build.

Offentlege sider: set PLAYWRIGHT_PRODUCTION=1 og køyr npm run test:e2e. Testserveren brukar ingen auth-løyndomar, også når lokal konfigurasjon finst. TheMealDB blir brukt live; OFF-svar blir erstatta ved HTTP-grensa.

Kontoflyt: sett den separate utviklingsdatabasen i .env.local med EMAIL_TRANSPORT=file og køyr npm run test:e2e:auth. Serveren brukar port 3100. Testen opprettar nye example.test-kontoar og held spor, video og skjermbilete avslått. Produksjonsdatabasen må aldri brukast til denne testen.

Den beståtte kontokøyringa er skild frå tidlegare feila forsøk: første forsøk fann favorittknappen; andre fann 404-adressa; siste to fullførte heile flyten.

## Neste arbeid

Brukaren har bedt om norsk oppskriftskatalog, nytt innhaldsutval og bilete/struktur. Dette skal utførast **etter at innloggingsarbeidet er fullført**. Det er ikkje påbegynt i denne endringa.
