# Norsk middagskatalog

Kjeldevurdering 30. oktober 2026: Matprat sine retningslinjer krev løyve for bruk av tekst/bilete i ei eiga oppskriftsplattform (https://www.matprat.no/retningslinjer-for-bruk-av-innhold/). ReceptAPI tilbyr svensk innhald med avgrensa gratiskvote og vilkår for replikering (https://receptapi.se/docs). Ingen av dei vart importerte. TheMealDB er ikkje lenger ei aktiv kjelde i nettsida.

MÅLTID har 16 nyskrivne nynorske middagsoppskrifter med vanlege norske råvarer. Oppskriftene er utvikla med KI-hjelp, ikkje kopierte frå matnettstader. Dei er ikkje kjøkkentesta; tidene er redaksjonelle estimat. Porsjonar, Celsius og metriske mål er eksplisitte. Ingen næringsverdiar eller NOVA-klasse for heile retten er konstruerte.

## Bilete og rettar

Alle 16 bileta er genererte spesielt for kvar rett med det innebygde imagegen-verktøyet, utan referansefoto frå andre. Tekstgrunnlaget er i IMAGE-PROMPTS.json. Originalane er lagra privat; optimaliserte 1200 × 900 WebP-filer ligg i public/images/middagar. Kreditering er i src/data/image-credits.json og synleg på oppskriftssida. Kort og hovudbilete er merkte som illustrasjonar.

Bruk av generert innhald følgjer OpenAI sine vilkår (https://openai.com/policies/terms-of-use/, kontrollert 30. oktober 2026). Det blir ikkje hevda at motiva er unike eller fotografi av kjøkkentesta resultat. Ingen Wikimedia-, Matprat- eller TheMealDB-foto er tekne inn i den nye katalogen. Open Food Facts-produktfoto beheld eigne kjelde-/lisensopplysningar.

## Vedlikehald og database

Rediger src/data/recipes.ts og src/data/ingredients.ts, legg til eit relevant bilete og kreditering, og køyr katalogtesten. ID-ar er stabile og skal ikkje gjenbrukast til andre rettar. src/data/catalog.ts byggjer publiseringsgrunnlaget og ei lokal reservekopi for utvikling utan database. Produksjon les recipe_catalog i Neon, med fem minutt offentleg datacache. Databasefeil gir norsk feilmelding, aldri engelsk API-reserve.

Migrering 0001 legg berre til recipe_catalog. Publish-skriptet brukar direkte Neon-tilkopling til migrering og oppdaterer berre katalogtabellen. Det kontrollerer at talet på brukarar og favorittar er uendra. Ingen eksisterande tabellar, kontoar, lagra oppskriftssnapshot eller favorittkoplingar blir sletta.

Køyr først mot den separate utviklingsgreina, deretter mot den private produksjonsmiljøfila:

```powershell
npx tsx scripts/publish-catalog.ts .env.local
npx tsx scripts/publish-catalog.ts .local/production.env
```

Miljøfilene skal aldri i Git eller chat. Serveren brukar den eksisterande poola DATABASE_URL. GitHub-push til main utløyser Vercel-bygg etter at migrering og katalog er klare.

Den eksisterande favoritten med ID 52771 har ei nynorsk, redaksjonelt vidareført pastaoppskrift under same ID. Originaldata i recipe_cache er bevarte. Han ligg i arkivet og blir ikkje blanda inn i nytt middagsutval. Kjende eldre ingredienslenkjer som apples og tomatoes sender vidare til norske sider.

## Avgrensingar

Firebase er behalde etter uttrykkeleg val frå eigaren. Standard e-postar og Firebase si eksterne handlingsside er på bokmål, fordi Firebase førebels blokkerer malendringar for prosjektet. Ingen ny e-posttest er nødvendig for dette innhaldsbytet. Faktisk levering vart verifisert i førre arbeid; passordbyte krev at eigaren fullfører lenkja sjølv. Sjå VERIFICATION.md for skiljet mellom simulert og faktisk testing.
