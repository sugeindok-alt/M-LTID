# MÅLTID

Les `AGENTS.md` før arbeid. Prosjektet ligg i `C:\MÅLTID` og GitHub-repoet `sugeindok-alt/M-LTID`. Nettsida er `https://m-ltid.vercel.app/`.

Codex (Astra) og Claude Code samarbeider etter ønske frå eigaren. Eigaren har valt denne arbeidsdelinga.

- Claude har ansvar for design, visuell utforming, typografi, biletevising, layout og mobiltilpassing.
- Eigaren skriv designoppgåvene direkte til Claude og styrer dialogen sjølv. Astra sender meldingar eller oppgåver til Claude berre når eigaren konkret ber om det.
- Astra har ansvar for nye funksjonar, dataflyt, innlogging, database, API-ar, integrasjon og publisering. Astra samordnar oppgåvene og dei nødvendige kontrollane.
- Avtal grensesnitt og ansvar når ei oppgåve omfattar både design og funksjonar. Astra koplar funksjonane til Claude sitt design. Begge gjenbruker eksisterande komponentar der det passar.
- Arbeid med konkrete oppgåver frå eigaren. Rollefordelinga styrer kven som utfører oppgåva, og eigaren kan endre henne.

- Avtal kva filer kvar agent kan endre før parallelt arbeid. Ved overlapp arbeider de etter tur eller i separate Git-arbeidskopiar.
- Ei gjennomgangsoppgåve gir lesetilgang til den avtalte kjeldekoden. Skriv funn til den avtalte rapportfila, og vent på ei implementeringsoppgåve før du endrar produktet.
- Oppgje konkrete filer, kva brukaren opplever og kva som faktisk er kontrollert. Skil observasjonar frå moglege problem.
- Kontroller arbeidsmappa og eksisterande endringar før skriving. Bevar andre sitt arbeid og brukardata.
- Les nye oppgåver og tilbakemeldingar frå Codex når dei blir sende. Ei rapportfil startar ikkje automatisk ei ny agentøkt.

Brukarvend tekst skal vere på nynorsk. Gjenbruk dagens design, oppskrifter, porsjonsutrekning, handleliste og personlege funksjonar. Firebase er den valde gratisløysinga for innlogging og konto-e-post. Neon lagrar personlege data. Bevar eigarkontroll på private oppskrifter, bilete, favorittar og vekemenyar.

Les `README.md` for oppsett. Historiske testresultat i dokumentasjonen må vurderast opp mot gjeldande kode og dato. Les relevante Next.js-rettleiingar i `node_modules/next/dist/docs/` før kodeendringar, slik `AGENTS.md` krev.

Bruk målretta kontrollar som passar endringa. Vanlege kommandoar finst i `package.json`. Unngå gjentekne fulltestar når ingenting er endra. Publisering frå `main` utløyser Vercel, så samordn push og produksjonsendringar med Codex.

Hald passord, nøklar, private miljøfiler og kontoopplysningar ute av meldingar, rapportar, skjermbilete og Git. Bruk separate testdata ved behov. Ekte testmeldingar og betalte tenester krev eigaren si godkjenning.

Mellombelse samarbeidsrapportar kan liggje i `.local/samarbeid/`, som er ignorert av Git. Les berre rapportar som oppgåva viser til i denne mappa.
