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
        <li>Namn, e-postadresse, stadfestingsstatus og eit sikkert hash av passordet.</li>
        <li>
          Innloggingsøkter, tidspunkt og tekniske tryggleiksopplysningar som IP-adresse og
          nettlesar.
        </li>
        <li>Favorittar, handleliste, produktval og profilinnstillingar.</li>
        <li>Teknisk sendestatus for e-post og teljarar som hindrar misbruk.</li>
      </ul>
      <h2>Kvar opplysningane blir brukte</h2>
      <p>
        Konto og lagra innhald ligg i prosjektet sin PostgreSQL-database hos Neon når tenesta er
        sett opp. Better Auth handterer innlogging. Resend får e-postadressa og meldingsinnhaldet
        ved sending. Oppskriftsførespurnader går frå serveren til TheMealDB. Produktsøk blir sende
        til Open Food Facts; skriv difor ikkje personopplysningar i produktsøket.
      </p>
      <h2>Informasjonskapslar og lokal lagring</h2>
      <p>
        Innlogging brukar nødvendige øktinformasjonskapslar. Val av visuelt tema kan òg bli lagra
        lokalt i nettlesaren. Passord, databasepassord og API-nøklar blir ikkje lagra i nettlesaren.
      </p>
      <h2>Tilgang og sletting</h2>
      <p>
        Du kan sjå og fjerne favorittar og handlevarer på dine sider. Profilnamn og innstillingar
        kan endrast i profilen. Ved sletting av ein konto frå databasen blir dei tilknytte kontodata
        sletta gjennom databasekoplingane. Full sjølvbetent kontosletting og dataeksport er ikkje
        del av denne versjonen.
      </p>
      <div className="notice">
        <p>
          Denne installasjonen er eit porteføljeprosjekt. Før offentleg registrering blir opna, må
          eigaren oppgi behandlingsansvarleg, ei fungerande kontaktadresse, behandlingsgrunnlag,
          lagringstider og rutinar for innsyn og sletting. Sjå prosjektet si oppsettsrettleiing.
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
