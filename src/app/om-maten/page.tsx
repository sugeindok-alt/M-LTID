import Link from 'next/link';
import { NovaEducation } from '@/components/shared';
export const metadata = { title: 'Om maten og NOVA' };
export default function Page() {
  return (
    <div className="container page-shell">
      <div className="prose">
        <p className="eyebrow">KUNNSKAP, UTAN SNARVEGAR</p>
        <h1>Forstå meir av maten du et.</h1>
        <p>
          NOVA grupperer mat etter korleis og kvifor han er prosessert. Det er ikkje ein fullstendig
          helsevurdering, og heller ikkje ei rangering av alt som er godt eller dårleg å ete.
        </p>
        <h2>Fire grupper. Mange nyansar.</h2>
        <p>
          NOVA 1 omfattar uprosessert eller minimalt prosessert mat. NOVA 2 er prosesserte
          kulinariske ingrediensar. NOVA 3 er prosessert mat, og NOVA 4 er ultraprosessert mat. I
          MÅLTID blir gruppe 1–3 merkte «Ikkje ultraprosessert etter NOVA». Dette er ikkje ein
          påstand om næringsinnhaldet.
        </p>
      </div>
      <div style={{ marginBlock: 40 }}>
        <NovaEducation compact />
      </div>
      <div className="prose">
        <h2>Ein tomat er ikkje ein tomatsaus.</h2>
        <p>
          Eit generelt ingrediensnamn seier lite om kva som faktisk er i pakninga. Vi bruker berre
          registrert NOVA-informasjon for konkrete produkt frå Open Food Facts. Når informasjon
          manglar, står det «Ukjent».
        </p>
        <h2>Vi klassifiserer ikkje heile middagen.</h2>
        <p>
          Om du vel eit produkt med NOVA 4 til ei oppskrift, kan vi seie at produktvala dine
          inneheld minst éi registrert NOVA 4-vare. Det gjer ikkje automatisk heile den heimelaga
          retten til NOVA 4. Resten av produkta kan framleis vere ukjende.
        </p>
        <h2>Opne kjelder, med avgrensingar.</h2>
        <p>
          Open Food Facts er ein dugnadsdatabase. Klassifiseringar kan vere automatiske eller bygde
          på ufullstendige opplysningar. «Registrert» betyr at feltet finst i kjelda, ikkje at
          MÅLTID har kontrollert produktet. Kontroller alltid emballasjen for ingrediensar og
          allergen.
        </p>
        <p>
          Les meir hos{' '}
          <a href="https://world.openfoodfacts.org/nova" target="_blank" rel="noreferrer">
            Open Food Facts om NOVA
          </a>
          . Produktdatabasen er tilgjengeleg under{' '}
          <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">
            Open Database License
          </a>
          ; individuelle databaseelement under DbCL og produktfoto under CC BY-SA.
        </p>
        <h2>Oppskrifter for norske kvardagar.</h2>
        <p>
          Oppskriftene er nyskrivne på nynorsk for MÅLTID. Tidene er rettleiande estimat, og bileta
          er KI-genererte serveringsforslag. Vi viser ikkje næringsverdiar eller popularitetstal
          utan grunnlag. <Link href="/om-innhaldet">Les om innhaldet og bileta.</Link>
        </p>
        <Link href="/ingrediensar#produktsok" className="button">
          Undersøk eit produkt
        </Link>
      </div>
    </div>
  );
}
