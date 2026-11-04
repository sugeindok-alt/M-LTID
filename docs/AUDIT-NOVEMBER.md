# MÅLTID: kvalitetsrunde 4. november 2026

Utgangspunkt: `6da0c09`, 36 aktive middagar, éi arkivoppføring, fire vekemenyar og 70 råvarer. Dei fire vurderarane leverte separate førvurderingar med konkrete passkrav før produktendringane. Førkarakterar: mobil 7, redaksjon 7, design/tilgjenge 8, konto/personvern 8. Ei samla vurdering må også ta omsyn til risiko ved feil mengder og tilgang til private data.

## Karakter før og etter

| Område | Før | Etter | Grunnlag for karakteren |
| --- | ---: | ---: | --- |
| Mobil brukaroppleving | 7 | 9 | Frå rask middag og gjesteinnlogging til tre porsjonar torsk, korrekt handlemengd og attfinning i ei ny økt på 360 px. |
| Matredaksjon | 7 | 9 | Gjennomgang av 31 rettar på mobil, ni på stor skjerm, fire fulle vekemenyar og alle 56 serveringsbileta. Formval, halvt egg og tilbehøyr kan følgjast på papiret. |
| Bilete, design og tilgjenge | 8 | 9 | Alle 74 råvarebileta vart sjekka i mobilstorleik. Kontrast, fokus, kanttrykk, sortering og biletefeil bestod på dei undersøkte sidene. |
| Konto, lagring og personvern | 8 | 9 | To kontoar og ein gjest prøvde deling og stenging av same bok. Private originalar, eigarskap, lagra mengder og ei ny innlogging vart kontrollerte direkte. |
| **Samla** | **7,5** | **9** | Opphavleg viste handlelista feil mengd, og eigaren fekk ikkje sjå fotoet før deling. Begge handlingane bestod på produksjon. Ingen stadfesta tilgangs- eller mengdefeil står att i dei prøvde flytane. |

Alle fire nådde dei målbare krava for 9 som står i arbeidslista. Redaksjonen har enno ikkje kjøkkentesta tidene. Design- og mobilprøvene brukte nettlesar med simulerte skjermstorleikar. Dei omfattar tastaturkontroll og automatiserte tilgjengeprøver, ikkje ei økt med fysisk telefon eller skjermlesar. Personvernkarakteren gjeld dei prøvde tilgangsvegane, også direkte serverførespurnader.

## Samla arbeidsliste

| ID  | Før-observasjon                                                                                                                     | Handling som skal bestå ved ny test                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | Handlelista heldt fram med å vise 600 g etter at eigaren la til 800 g. Serveren hadde 1 400 g.                                      | Legg til begge på same side. Feltet skal vise 1,4 kg straks og etter omlasting. Dobbelt importtrykk skal gi éi rad.                               |
| U2  | Onsdag var lagra med tre porsjonar torsk. Oppskriftslenkja opna fire porsjonar.                                                     | Opne frå veka, kontroller tre porsjonar, 450 g torsk og 600 g poteter i liste og kokemodus, også etter omlasting. Kontroller ein privat rett.     |
| U3  | Oppskriftshovudet viste fire etter endring til to eller åtte. Same funn frå mobil og matredaktør.                                   | Hovud, ingrediensar og matlagingsvising skal vise same aktive porsjonstal. Mobilbrukaren skal finne porsjonsvalet tidleg.                         |
| M2  | Form- og brettstorleik stod fast når oppskrifta vart dobla.                                                                         | Følg lasagne, fiskegrateng og pizza ved to, fire og åtte porsjonar. Instruksjonane skal gje høveleg lagtjukkleik, plass og ferdigkontroll.        |
| M3  | Instruksjonen om å setje på tilbehøyr kom for seint i stegvis lakse- og fårikåloppskrift. Kjøtkakene starta tilbehøyret for tidleg. | Følg stega i rekkjefølgje og på tidslinje. Ein skal få beskjed i tide til å servere hovudrett og tilbehøyr saman.                                 |
| M4  | Pannekakene gav 1,5 egg til to porsjonar utan målerettleiing. Seksten pannekaker krev fleire omgangar.                              | Halver og doble oppskrifta. Eggmengda og arbeidsrekkjefølgja skal kunne følgjast heime.                                                           |
| M5  | «Avrent vekt» i oppskrifter med hermetiske belgfrukter var uklårt språk.                                                            | Les dei same stega og sjekk at dei forklarer når råvara skal vegast.                                                                              |
| D1  | Små mengder og produktmerknader hadde 4,26:1 kontrast.                                                                              | Dei same tekstane på mobil og stor skjerm skal ha minst 4,5:1.                                                                                    |
| D2  | Escape lukka ikkje menyen frå ei fokusert lenkje.                                                                                   | Opne med tastatur, gå til ei lenkje og trykk Escape. Menyen skal lukke seg og fokus skal gå tilbake til knappen.                                  |
| D3  | Aktuell seksjon var umerkt i mobilmenyen og på detaljsider.                                                                         | Kontroller synleg og semantisk markering på både oversikt og detalj.                                                                              |
| D4  | Brødsmular og råvarelenkjer hadde klikkfelt på 18–20 px.                                                                            | Måle minst 44 px høgd på mobil og opne rett side med trykk nær kanten.                                                                            |
| D5  | Norsk sortering var feil, mellom anna for brokkoli/brødsmular og hovudkål/høgrygg.                                                  | Bla gjennom alle sidene og samanlikne med norsk alfabetisk rekkjefølgje.                                                                          |
| P1  | Førehandsvisinga viste «med foto» utan å vise fotoet.                                                                               | Vis det valde fotoet før publisering, utelat det når eigaren vel det bort. B og gjesten skal ikkje sjå privat førehandsvising eller originalfoto. |

## Gjennomføringskrav

Legg til minst 20 middagar utover starttalet, bruk både gamle og nye i dei fire femdagarsmenyane, og kontroller råvarebileta etter utvidinga. Byt ein middag i vekemenyen, endre porsjonstal, handle og opne oppskrifta på smal skjerm. Gjenta deling privat → offentleg → privat med to innlogga kontoar og ein gjest. Prøvene i produksjon bruker eigne mellombelse testidentitetar og testdata.

### Funn frå den nye prøverunden

**K1 · Lagring av ein privat variant.** I to lokale mobilprøver vart brukaren ståande på «Lag min variant» etter å ha lagra ein variant av laks med eige foto. Skjemaet bad nettlesaren både om å byte side og å laste den dåverande sida på nytt. Etter lagring opnar det no den ferske detaljsida direkte. Passkravet er å opne den lagra varianten, logge inn frå ein ny nettlesar, endre eit steg og finne same oppskrift i vekeplanen. Originalen skal framleis ha sine opphavlege mengder og steg.

**K2 · Byte mellom oppskrifter.** Under matgjennomgangen melde nettlesaren om to delar av oppskriftssida med same React-nøkkel. Handlingane og steglista har no ulike nøklar. Ny prøve skal opne oppskrifter, byte porsjonstal og gå gjennom steg utan duplikatvarsel.

Skjermbilete frå første mobilgjennomgang: [mengdetekst med låg kontrast](gjennomgang/mengder-for.png) og [menyen som framleis stod open etter Escape](gjennomgang/meny-for.png).

## Prøver på den publiserte produktversjonen

GitHub Actions og Vercel melde begge at bygg og publisering av `c993df9` var vellukka. Vurderarane brukte den ordinære adressa `m-ltid.vercel.app`. På eiga hand gjentok dei handlingane dei hadde prøvd på `6da0c09`. Opplysningane nedanfor gjeld det dei faktisk såg i nettlesaren.

| ID | Retting og utfall i den nye prøva |
| --- | --- |
| U1 | **Retta og verifisert.** Mengdefeltet følgjer den lagra summen. På 360 px viste det straks **1,4 kg** då 800 g vart lagde til 600 g. Serveren hadde 1 400 g. Dobbeltrykk ved vekeimport gav éi potetrad. Ho heldt etter omlasting og ny innlogging. |
| U2 | **Retta og verifisert.** Vekelenkja tek med porsjonstalet. Onsdag for tre gav 450 g torsk og 600 g poteter i ingredienslista og i matlagingsmodus, også etter omlasting. Ein privat rett heldt på 600 g poteter og «salt etter smak». Ei ny mobiløkt tok eigaren tilbake til denne retten for tre etter innlogging. |
| U3 | **Retta og verifisert.** Porsjonslenkja i oppskriftshovudet går til veljaren og viser vald mengd. Fire til to gav 200 g penne, to porsjonar i hovudet og same val etter innlogging. Matredaktøren samanlikna hovud, mengder og stegvis vising ved to, fire og åtte. |
| M2 | **Retta og verifisert.** Lasagne og fiskegrateng har råd om form til to, fire og åtte, plass i omnen og korleis sjå om midten er ferdig. Pizzaen blir steikt brettvis. Matredaktøren las dei tre oppskriftene ved alle tre porsjonstal. |
| M3 | **Retta og verifisert.** I stegvis vising kjem ertevatnet på medan laksen steikjer, potetene på før fårikålen er ferdig og gulrøtene i medan kjøtkakene trekkjer. Matredaktøren følgde rekkjefølgja for alle tre på papiret. |
| M4 | **Retta og verifisert.** Ved to porsjonar forklarer pannekakeoppskrifta korleis ein måler halvt egg. Ved åtte forklarer ho 16 pannekaker og om lag 25 minutt ekstra med éi panne. Begge vala vart prøvde. |
| M5 | **Retta og verifisert.** Dei aktuelle bønne- og kikertstega forklarer at råvara skal vegast etter at vatnet har runne av. Matredaktøren fann rettleiinga i steglista. |
| D1 | **Retta og verifisert.** Mørkare tekst gav 5,19:1 for mengdene, opp frå 4,26:1. Dei same fem sidene vart kontrollerte på 320 og 1 440 px. [Mengdene etter retting](gjennomgang/mengder-etter.png). |
| D2 | **Retta og verifisert.** Escape frå ei fokusert menylenkje lukka menyen og gav fokus tilbake til «Opne meny». [Menyen etter tastetrykket](gjennomgang/meny-etter.png). |
| D3 | **Retta og verifisert.** Aktiv seksjon var synleg og markert for hjelpemiddel i både oversikter og detaljsider. Alle fem sidene vart opna i begge breidder. |
| D4 | **Retta og verifisert.** Dei tidlegare små lenkjene fekk 44 px høge trykkfelt på mobil. Trykk i utkanten opna middagsoversikta og sida for laksefilet. |
| D5 | **Retta og verifisert.** Oversikta sorterer med norsk alfabet. Vurderaren bladde gjennom sidene og kontrollerte rekkjefølgja for alle 74 råvarene. |
| P1 | **Retta og verifisert.** A såg det faktiske fotoet før publisering på 390 px. Utan fotoval var det ingen foto i førehandsvisinga. Ein framprovosert 503-feil gav forklaring og sperra publisering. Etter nytt forsøk fekk gjesten nøyaktig dei same biletbyta som A hadde sett. B og gjesten fekk aldri tilgang til originalfotoet eller den private førehandsvisinga. |
| K1 | **Retta og verifisert lokalt og i produksjon.** På 390 px lagra eigaren ein laksevariant med foto og 420 g laks. Han opna direkte. Ei ny innlogging viste fotoet og varianten, og eigaren kunne endre eit steg og velje varianten på tysdag. Originalen viste framleis 600 g og uendra steg. På utviklingsbasen gav tre porsjonar av varianten 315 g laks og uendra tekstmengd. |
| K2 | **Retta og verifisert.** Matredaktøren gjentok tre tidlegare feilande rettar lokalt. På produksjon gav gjennomgangen av 31 oppskrifter på mobil og ni på stor skjerm ingen duplikatvarsel. |

## Middagar, vekemenyar og bilete

Katalogen gjekk frå **36 til 56 unike, aktive middagar**. Dei 20 nye har totalt 80 nummererte steg og 182 ingrediensrader. Éi eldre oppskrift er bevart i arkivet. Publiseringa oppdaterte katalogen i Neon og kontrollerte uendra tal på kontoar og favorittar. Kvar ny rett har si eiga, KI-merkte serveringsillustrasjon. Alle 56 middagane sine bilete lasta og vart dekoda på produksjonsadressa. Dei 56 originalfilene hadde ulike kontrollsummar og samsvarte med arbeidsfilene. Matredaktøren såg gjennom motiva.

| Veke | Minutt per middag, måndag–fredag | Kontroll |
| --- | --- | --- |
| Raske kvardagar | 30, 30, 30, 30, 25 | Alle fem held seg innanfor ei halvtime i den redaksjonelle tidsvurderinga, med førebuing. Brokkolisuppe og fisketaco er nye. |
| Norske klassikarar | 40, 40, 45, 40, 75 | Frå pytt i panne og plukkfisk til fleskepannekake og raspeballar. Dei to første brukar 600 og 800 g poteter til fire kvar. |
| Meir fisk på bordet | 40, 35, 40, 75, 30 | Laks, sei og torsk som omnsrett, suppe, pannemiddag og grateng. Torsk med ertemos er ny. |
| Bruk opp råvarene | 75, 30, 45, 25, 50 | Ved fire per dag gav summen 700 + 250 + 250 + 200 + 200 g hovudkål = 1,6 kg, seks gulrøter og 16 lefser. Dagsnotata forklarer korleis dei blir brukte vidare. |

Matredaktøren opna alle 20 vekelenkjer og kontrollerte dagsnotata. På mobil gjekk vurderaren gjennom 127 steg og 287 ingrediensrader i 31 rettar. På stor skjerm var utvalet ni rettar med 38 steg og 89 ingrediensrader. Tidene er redaksjonelle overslag med fire porsjonar som utgangspunkt. Ingen rett er fysisk prøvelaga av MÅLTID.

Designvurderaren dekoda **74 av 74 råvarebilete frå produksjon** og gjekk gjennom kvart motiv i mobilstorleik. Byggmjøl, bacon, grautris og sjampinjong er nye. Søk, liste og detaljside brukte same fil. Lauk, kvitlauk og purre kunne skiljast frå kvarandre. Rå laksefilet og ferdig laksemiddag hadde kvart sitt motiv. Ein framprovosert biletefeil viste «Biletet er ikkje tilgjengeleg» saman med råvarenamn, skildring og returlenkje. Ingen råvare mangla bilete. [Kontaktark med namn](raw-image-contact.jpg) · [Kjelde og bruksrett](RAW-IMAGES.md) · [Rå og ferdig laks på publisert side](gjennomgang/laks-ra-og-ferdig.png).

## Bygg, nettlesarprøver og versjon

### Privat → offentleg → privat

| Tilstand | Eigar A | Konto B og gjest |
| --- | --- | --- |
| Ny privat bok | A kunne sjå og endre boka og originalfotoet. A hadde òg ei separat privat bok med same oppskrift. | Same delingslenkje viste inga oppskrift. Delings- og bileteendepunkta gav 404. B fekk 404 og gjesten 401 på private originalar. |
| Publisert utgåve | A valde éi av to oppskrifter og førehandsviste fotoet. Ei privat endring i originalen endra ikkje den offentlege teksten. Forsøk med forelda godkjenning gav 409. | B og gjesten las vald rett og foto på same lenkje. Den andre retten og den private boka var framleis skjulte. Direkte endringsforsøk, tilbakekalling og bruk av A sin private original i B si veke eller handleliste vart avviste. |
| Privat igjen | A beheldt boka og fotoet. Ny innlogging gav også tilgang til A sin favoritt, vekeplan og ei potetrad på 1 400 g etter to samtidige importtrykk. | Nye førespurnader etter delingsdata og foto gav 404. Nettsida viste inga oppskrift og ho fanst ikkje i katalogen. Tilbakeknappen viste ingen rett. Ei fane som stod open før tilbakekallinga, tømde innhaldet innan 22,6 sekund. B kunne ikkje lese, endre eller fjerne A si handlevare. |

Delingsdata og foto hadde `no-store`. Begge bileteproxyane avviste forsøka på å få ei mellomlagra utgåve. Den stabile offentlege dømeboka under er ei anna bok enn den mellombelse boka som vart gjort privat i prøva. Dei syntetiske produksjonskontoane og tilhøyrande testdata vart rydda opp etter prøvene.

### Lokale prøver og publisering

ESLint, typekontroll og produksjonsbygg bestod. Den lokale testsamlinga hadde 86 beståtte testar. Éin test som krev ein separat Firebase-emulator, vart hoppa over. Dei målretta nettlesarprøvene brukte prosjektet sin separate utviklingsbase. Prøvene av ferdig middagsveke, privat variant og val av delingsfoto bestod. I produksjon brukte konto- og mobilvurderarane den ordinære Firebase-innlogginga med sine eigne mellombelse testkontoar.

På produksjon vart potetnedteljinga i laksen, attståande tid etter omlasting og tidsvalet 12–15 minutt i steg tre prøvde i nettlesaren. Testforventninga i repoet følgjer den oppdaterte teksten. Dei tre lenkjene nedanfor vart opna på det vanlege produksjonsdomenet.

- [Raske kvardagar](https://m-ltid.vercel.app/middagsveker/raske-kvardagar)
- [Fisketaco](https://m-ltid.vercel.app/oppskrifter/nn-fisketaco)
- [To middagar frå MÅLTID – offentleg dømebok](https://m-ltid.vercel.app/boker/3d6056f5-a68c-46c9-b408-1b9fc966f75c)
- [Produktendringar på GitHub](https://github.com/sugeindok-alt/M-LTID/commit/c993df9e4264c7272341dc789f160c6059f197d6) · [GitHub Actions](https://github.com/sugeindok-alt/M-LTID/actions/runs/41800142769) · [Vercel-bygg](https://vercel.com/maltid/m-ltid/83tsgtGrh8EsLawPygKBt9o9FY7G)
