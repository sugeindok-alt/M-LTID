# MÅLTID: kvalitetsrunde 4. november 2026

Utgangspunkt: `6da0c09`, 36 aktive middagar, éi arkivoppføring, fire vekemenyar og 70 råvarer. Dei fire vurderarane leverte separate førvurderingar med konkrete passkrav før produktendringane. Førkarakterar: mobil 7, redaksjon 7, design/tilgjenge 8, konto/personvern 8. Ei samla vurdering må også ta omsyn til risiko ved feil mengder og tilgang til private data.

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
