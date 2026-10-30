import Link from 'next/link';
export const metadata = {
  title: 'Om innhaldet',
  description: 'Slik lagar og vedlikeheld MÅLTID oppskrifter og matillustrasjonar.',
};
export default function Page() {
  return (
    <div className="container page-shell prose">
      <p className="eyebrow">MATGLEDE MED OPNE KORT</p>
      <h1>Våre oppskrifter. Eit bevisst utval.</h1>
      <p>
        MÅLTID har ein eigen katalog med norske tradisjonsrettar og moderne kvardagsmiddagar.
        Tekstane er nyskrivne på nynorsk med hjelp av kunstig intelligens. Vi kopierer ikkje
        oppskriftstekstar frå andre matnettstader.
      </p>
      <h2>Tider og porsjonar</h2>
      <p>
        Oppskriftene er laga for fire porsjonar. Tidene er rettleiande estimat som omfattar
        førebuing, koking, steiking og eventuell heving. Dei er ikkje målte på eit testkjøkken.
        Oppskriftene er ikkje kjøkkentesta av MÅLTID.
      </p>
      <h2>Bilete som viser kva du lagar</h2>
      <p>
        Matbileta er KI-genererte serveringsforslag laga spesielt for kvar oppskrift med OpenAI sitt
        biletverktøy. Dei er merkte som illustrasjonar og er ikkje fotografi av ein ferdig testa
        rett. Pynt og utsjånad kan variere frå det du lagar heime.
      </p>
      <p>
        Bileta er laga frå eigne tekstskildringar utan innlånte referansefoto. Bruksretten til det
        genererte innhaldet følgjer{' '}
        <a href="https://openai.com/policies/terms-of-use/" target="_blank" rel="noreferrer">
          OpenAI sine vilkår
        </a>
        . Vi gjer ikkje krav på at KI-genererte motiv er unike.
      </p>
      <h2>Råvarer og prosessering</h2>
      <p>
        Vi finn ikkje på næringsverdiar. Eit oppskriftsnamn fortel ikkje kor prosessert maten er.
        Produktvala og ingredienslista på den konkrete pakninga avgjer kva grunnlag vi har for å
        vise NOVA-informasjon.
      </p>
      <p>
        Registrerte produktopplysningar kjem frå Open Food Facts. Når grunnlaget manglar, viser vi
        «Ukjent».
      </p>
      <Link href="/om-maten" className="text-link">
        Les om NOVA og kjeldene
      </Link>
      <h2>Favorittane dine er tekne vare på</h2>
      <p>
        Oppskrifter som var lagra før kjeldebytet, held på koplinga til kontoen din. Den tidlegare
        pastaoppskrifta er vidareført med norsk tekst og norske mål.
      </p>
      <Link href="/oppskrifter" className="button">
        Finn noko godt til middag
      </Link>
    </div>
  );
}
