export const metadata = { title: 'Personvern' };
export default function Page() {
  return (
    <div className="container page-shell prose">
      <p className="eyebrow">KONTOEN DIN, FORKLART</p>
      <h1>Personvern i MÅLTID.</h1>
      <p>
        MÅLTID lagrar opplysningar som trengst for kontoen og funksjonane du vel å bruke. Vi bruker
        ikkje reklamesporing eller analyseinformasjonskapslar.
      </p>
      <h2>Dette blir lagra</h2>
      <ul>
        <li>Namn, e-postadresse og stadfestingsstatus. Firebase handterer passordet sikkert.</li>
        <li>
          Innloggingsøkter, tidspunkt og tekniske tryggleiksopplysningar som IP-adresse og
          nettlesar.
        </li>
        <li>
          Favorittar, eigne oppskrifter og foto, vekemenyar med porsjonstal, handleliste, produktval
          og profilinnstillingar.
        </li>
        <li>Teknisk sendestatus for e-post og teljarar som hindrar misbruk.</li>
      </ul>
      <h2>Kvar opplysningane blir brukte</h2>
      <p>
        Firebase (Google) handterer registrering, innlogging, passord og konto-e-postar. Namn,
        e-postadresse, koplinga til kontoen og lagra innhald ligg òg i PostgreSQL-databasen hos
        Neon. Resend blir berre brukt til oppskrifts-e-post dersom den funksjonen er aktivert.
        Oppskriftene blir henta frå vår eigen katalog i Neon. Produktsøk blir sende til Open Food
        Facts; skriv difor ikkje personopplysningar i produktsøket.
      </p>
      <h2>Informasjonskapslar og lokal lagring</h2>
      <p>
        Innlogging brukar nødvendige øktinformasjonskapslar. Visuelt tema, porsjonsval,
        matlagingssteg og slutttida for nedteljingar kan bli lagra lokalt i nettlesaren.
      </p>
      <h2>Deling av kokebøker</h2>
      <p>
        Nye bøker er private. Når du publiserer, kan alle med lenkja lese den utgåva du har
        godkjent, med dei oppskriftene og fotoa du valde i førehandsvisinga. Endrar du ei privat
        oppskrift, må du publisere på nytt for å dele endringa. Når boka blir privat igjen, stengjer
        lenkja og bilettilgangen. Kopiar som andre alt har lagra, kan dei framleis ha.
      </p>
      <h2>Tilgang og sletting</h2>
      <p>
        Du kan sjå og fjerne middagar frå Mi veke, favorittar og handlevarer på dine sider.
        Profilnamn og innstillingar kan endrast i profilen. Ved sletting av ein konto frå databasen
        blir dei tilknytte kontodata sletta gjennom databasekoplingane. Full sjølvbetent
        kontosletting og dataeksport er ikkje del av denne versjonen.
      </p>
      <div className="notice">
        <p>
          MÅLTID er eit porteføljeprosjekt. Fullstendige kontaktopplysningar for
          behandlingsansvarleg, lagringstider og rutinar for innsyn og sletting er enno ikkje
          oppgjevne.
        </p>
      </div>
      <h2>Eksterne kjelder</h2>
      <p>
        Eksterne oppskriftslenkjer og videolenkjer opnar tenester med eigne personvernvilkår.
        Oppskriftsbilete blir normalt leverte gjennom MÅLTID sin biletproxy.
      </p>
    </div>
  );
}
