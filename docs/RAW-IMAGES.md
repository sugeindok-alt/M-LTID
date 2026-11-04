# Råvarebilete i MÅLTID

MÅLTID har laga råvareillustrasjonane med OpenAI sitt innebygde biletverktøy 4. november 2026. Dei er genererte frå eigne tekstskildringar utan referansefoto. MÅLTID har ikkje kopiert foto frå matnettstader, produsentar eller butikkar. Bruk av dei genererte bileta følgjer [OpenAI sine vilkår](https://openai.com/policies/terms-of-use/). Motiva er illustrasjonar av råvara og representerer ikkje eit bestemt produkt eller merke. Dei visuelle skilja mellom til dømes to typar gulost kan vere små; sjå pakninga for eigenskapar som vegetabilsk løype.

[Biletregisteret](RAW-IMAGE-ATLAS.json) inneheld råvarenamnet, den opphavlege engelske motivskildringa og plasseringa i ei av åtte genererte bildeflater. Felles stil var studiolys frå øvre venstre side, varm lys bakgrunn og eitt gjenkjenneleg motiv sentrert i kvar celle. Kvar bildeflate hadde tre rader og tre kolonnar utan tekst eller merke på biletet. Berre registrerte celler er med på nettsida.

src/data/raw-images.ts hentar koplingane frå dette registeret. Ei fil med namnet r2-1-1.webp kjem til dømes frå flate 2, rad 1, kolonne 1 og viser rå laksefilet. Same lokale WebP-fil blir brukt i ingrediensoversikta, søkjeresultatet og på sida for laksefilet. Ei manglande kopling får ei lesbar reservevising med råvarenamnet.

[Kontaktarket med namn og miniatyrbilete](raw-image-contact.jpg) kan brukast for redaksjonell kontroll. Etter at ei råvare er endra, køyr `npx tsx scripts/check-raw-images.ts --contact` og sjå gjennom arket. Etter publisering kontrollerer `npx tsx scripts/check-raw-images.ts --live` kvar biletfila på produksjonsadressa.
