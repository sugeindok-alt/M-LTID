# Råvarebilete i MÅLTID

MÅLTID har laga råvareillustrasjonane med OpenAI sitt innebygde biletverktøy 4. november 2026. Dei er genererte frå eigne tekstskildringar utan referansefoto. MÅLTID har ikkje kopiert foto frå matnettstader, produsentar eller butikkar. Bruk av dei genererte bileta følgjer [OpenAI sine vilkår](https://openai.com/policies/terms-of-use/). Motiva er illustrasjonar av råvara og representerer ikkje eit bestemt produkt eller merke. Dei visuelle skilja mellom til dømes to typar gulost kan vere små; sjå pakninga for eigenskapar som vegetabilsk løype.

[Biletregisteret](RAW-IMAGE-ATLAS.json) inneheld råvarenamnet, den engelske motivskildringa og plasseringa i kjeldebiletet. Dei første 70 motiva kjem frå åtte genererte bildeflater med tre rader og tre kolonnar. Kvar celle har eitt sentrert motiv på varm, lys bakgrunn og studiolys frå øvre venstre side. Berre registrerte celler er med på nettsida.

Dei nyare råvarene fekk kvar si kvadratiske illustrasjon frå det same innebygde verktøyet. Byggmjøl, bacon, grautris, sjampinjong, spagetti og hamburgerbrød har kjeldenummer 9–14. Tortillachips, ketchup, kyllingvengjer, BBQ-saus og kebabkjøt i skiver har nummer 16–20. Alle er merkte `single` i registeret. Den felles delen av instruksjonen står nedanfor. Motivskildringa under `description` i registeret fullfører instruksjonen for kvar råvare.

> Use case: product-mockup. A square studio food photograph-style illustration for a Norwegian raw ingredient dictionary. One clear ingredient subject on a smooth plain warm ivory beige tabletop, filling 76% of frame with generous margins on every edge. Slightly elevated three-quarter view, gentle daylight from upper left, realistic subtle shadows. Clean natural colors, accurate anatomy and textures, understandable at 90px. No text, no labels, no logos, no packaging, no watermark, no hands or background objects. Subject:

src/data/raw-images.ts hentar koplingane frå dette registeret. Ei fil med namnet r2-1-1.webp kjem til dømes frå flate 2, rad 1, kolonne 1 og viser rå laksefilet. Same lokale WebP-fil blir brukt i ingrediensoversikta, søkjeresultatet og på sida for laksefilet. Ei manglande kopling får ei lesbar reservevising med råvarenamnet.

[Kontaktarket med namn og miniatyrbilete](raw-image-contact.jpg) kan brukast for redaksjonell kontroll. Etter at ei råvare er endra, køyr `npx tsx scripts/check-raw-images.ts --contact` og sjå gjennom arket. Etter publisering kontrollerer `npx tsx scripts/check-raw-images.ts --live` kvar biletfila på produksjonsadressa.
