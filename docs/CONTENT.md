# Norsk middagskatalog

Det offentlege utvalet har 29 middagar. «Gatekjøkken heime» samlar sju nye rettar og den eksisterande hamburgaren med omnsbakte poteter. Kvar ny rett har eit eige KI-generert serveringsforslag. Dei tre øvste rettane i kategorien er kebabrull, sprø kyllingspyd og dobbel smashburger.

Kebabrullen brukar skore, krydra kebabkjøt. Biletet er ei ny KI-generert illustrasjon. Eit innsendt referansebilete vart brukt for korleis rullen ligg i papir, og det ferdige motivet viser ei raus fylling med synleg kvitlaukdressing.

Ved førre omlegging fekk MÅLTID 22 kvardagsmiddagar. Femten eksisterande oppskrifter er vidareførte, og sju nye fyller hola i ønskjelista. Dei 41 rettane som gjekk ut av utvalet, har framleis full tekst, bilete og same ID. Oppskrifter som er lagra i favorittar, kokebøker eller veker, kan framleis opnast direkte. Sjå [utvalet, arkivet og prøvene](KVARDAGSMIDDAGAR.md).

Sju nye rettar og den oppdaterte tomatsuppa fekk eigne KI-genererte serveringsbilete i 4:3. Motiv og opphav er registrerte i IMAGE-PROMPTS.json. Råvareguiden har òg bilete av tørr spagetti og hamburgerbrød.

Kjeldevurdering 30. oktober 2026: Matprat sine retningslinjer krev løyve for bruk av tekst/bilete i ei eiga oppskriftsplattform (https://www.matprat.no/retningslinjer-for-bruk-av-innhold/). ReceptAPI tilbyr svensk innhald med avgrensa gratiskvote og vilkår for replikering (https://receptapi.se/docs). Ingen av dei vart importerte. TheMealDB er ikkje lenger ei aktiv kjelde i nettsida.

Ved starten av denne gjennomgangen viste produksjonssida 36 unike middagar ved versjon 6da0c09. Den eldre favoritten 52771 fanst òg som arkivoppføring. Etter den førre gjennomgangen hadde katalogen 56 aktive rettar og den same arkivoppføringa. Dei 20 nye rettane er nyskrivne på nynorsk med KI-hjelp. Mengder, rekkjefølgje og tidsbruk er gjennomgått på papiret. Tidene føreset fire porsjonar og omfattar førebuing. Ingen av rettane er fysisk prøvelaga av MÅLTID.

Dei tre nye middagane på høgst ein halvtime er fisketaco (25 minutt), torsk med ertemos (30 minutt) og brokkolisuppe (30 minutt). Fisketacoen treng om lag 10 minutt til råkost og oppdeling, 7 minutt til steiking og nokre minutt til servering. Lefser og fisk blir varma parallelt. Til torsken blir potetene skorne i små terningar og sette på først. Fisk og erter blir ferdige i løpet av dei siste 8 minutta. Til brokkolisuppa deler ein potetene i terningar på 1 cm og varmar krafta medan grønsakene blir skorne. Slik får ein plass til oppkoking, 12–13 minutt småkoking og miksing innanfor halvtimen.

For steikt ris er innkjøpsmengda tørr ris. Steget seier kor mykje ferdig kokt ris ho svarar til, og skil mellom tida ved bruk av tørr ris og kokte restar. Rådet om rask nedkjøling og kjølelagring følgjer [Mattilsynet](https://www.mattilsynet.no/mat-og-drikke/forbrukere/kokt-ris-og-pasta-som-star-fremme-kan-lage-giftstoffer).

## Bilete og rettar

Kvar av dei 56 rettane frå den førre versjonen har eit eige KI-generert serveringsbilete i 4:3-format under public/images/middagar. Dei første 16 vart genererte kvar for seg. Dei neste 20 vart skorne ut frå fem ark med fire rettsspesifikke bilete per ark. Dei siste 20 er genererte enkeltvis med det innebygde biletverktøyet til OpenAI, frå eigne skildringar av ingrediensar, tilbehøyr og servering. Det vart ikkje brukt referansefoto. Tekstgrunnlag og opphav ligg i IMAGE-PROMPTS.json. Krediteringa er i src/data/image-credits.json og synleg på oppskriftssida.

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
