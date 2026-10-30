import { editorialRecipes } from './recipes';
import { ingredientSlug } from '@/lib/recipes';
const descriptions: Record<string, [string, string, string[]?]> = {
  poteter: [
    'Grønsaker',
    'Poteter kan kokast, mosast eller bakast i omnen. Skjer dei i jamne bitar for jamn koketid.',
    ['potatoes', 'potato'],
  ],
  gulrøter: [
    'Grønsaker',
    'Gulrøter gir både sødme og tyggemotstand. Riv dei til råkost, eller la dei koke møre i suppe og gryter.',
    ['carrots', 'carrot'],
  ],
  lauk: [
    'Grønsaker',
    'Lauk gir ein mildare og søtare smak når han får surre i panna. Bruk han som utgangspunkt for saus, suppe og gryter.',
    ['onion', 'onions'],
  ],
  raudlauk: [
    'Grønsaker',
    'Raudlauk kan brukast rå i små mengder eller bakast saman med andre grønsaker.',
    ['red-onions', 'red-onion'],
  ],
  kvitlauksfedd: [
    'Grønsaker',
    'Finhakk eller press kvitlauken. La han surre kort og varsamt, så han ikkje blir brun og bitter.',
    ['garlic'],
  ],
  kålrot: [
    'Grønsaker',
    'Kålrot er godt i lapskaus, suppe og rotmos. Skrell bort det grove skalet og skjer i jamne bitar.',
  ],
  hovudkål: [
    'Grønsaker',
    'Hovudkål toler lang koketid og passar godt saman med lam. Finsnitta kål kan òg brukast rå.',
    ['cabbage'],
  ],
  purre: [
    'Grønsaker',
    'Del purra på langs og skyl godt mellom laga før bruk. Både det kvite og det mjuke grøne kan etast.',
    ['leek'],
  ],
  paprika: [
    'Grønsaker',
    'Paprika kan etast rå, steikjast eller bakast. Fjern stilken og frøa før du skjer henne opp.',
    ['red-pepper', 'green-pepper'],
  ],
  tomatar: [
    'Grønsaker',
    'Modne tomatar passar i salat og som frisk topping. Bruk hermetiske tomatar i sausar når du ønskjer jamn smak gjennom året.',
    ['tomatoes', 'tomato'],
  ],
  'hakka tomatar': [
    'Grønsaker',
    'Hermetiske, hakka tomatar er praktiske til suppe, gryter og saus. Sjekk ingredienslista dersom du vil ha tomatar utan ekstra smakstilsetjingar.',
    ['chopped-tomatoes', 'tinned-tomatoes'],
  ],
  spinat: [
    'Grønsaker',
    'Spinat treng berre kort tid i ei varm gryte. Skyl ferske blad godt før bruk.',
    ['spinach'],
  ],
  erter: [
    'Grønsaker',
    'Frosne erter kan kokast rett frå frysaren. Dei er gode som tilbehøyr til fisk eller i ei grønsaksuppe.',
    ['peas'],
  ],
  agurk: [
    'Grønsaker',
    'Agurk gir frisk smak og sprø konsistens til taco og salatar.',
    ['cucumber'],
  ],
  hjartesalat: [
    'Grønsaker',
    'Skyl salaten og la han renne godt av. Riv eller skjer blada like før servering.',
    ['lettuce'],
  ],
  mais: [
    'Grønsaker',
    'La hermetisk mais renne av før bruk. Mais passar som tilbehøyr til taco og i salat.',
    ['sweetcorn'],
  ],
  laksefilet: [
    'Fisk og kjøt',
    'Laks passar til steiking og baking. Kontroller fileten for bein, og oppbevar fersk fisk kaldt.',
    ['salmon'],
  ],
  torskefilet: [
    'Fisk og kjøt',
    'Torsk har mild smak og deler seg i flak når han er ferdig. Bruk han i form, grateng eller fiskesuppe.',
    ['cod'],
  ],
  seifilet: [
    'Fisk og kjøt',
    'Sei er godt eigna til fiskekaker og steiking. Fjern skinn og bein før fisken går i farsen.',
    ['coley'],
  ],
  kjøtdeig: [
    'Fisk og kjøt',
    'Kjøtdeig kan brukast til kjøttkaker og taco. Steik han heilt gjennom, og vask hender og utstyr etter kontakt med rått kjøt.',
    ['minced-beef', 'beef-mince'],
  ],
  'høgrygg': [
    'Fisk og kjøt',
    'Høgrygg treng lang tid på låg varme for å bli mør. Han passar godt til lapskaus og gryter.',
    ['beef'],
  ],
  fårikålkjøt: [
    'Fisk og kjøt',
    'Fårikålkjøt er bitar av lam eller sau med bein. La det trekkje roleg til kjøtet slepper beinet.',
    ['lamb'],
  ],
  kyllinglår: [
    'Fisk og kjøt',
    'Kyllinglår eignar seg til omnssteiking. Kontroller at kjøtet er gjennomsteikt; eit steikjetermometer gjer det lettare.',
    ['chicken', 'chicken-thighs', 'chicken-breast'],
  ],
  eple: [
    'Frukt og bær',
    'Eple gir frisk smak til råkost og kan bakast eller kokast til mos. Faste eple held betre på forma ved varmebehandling.',
    ['apple', 'apples'],
  ],
  sitron: [
    'Frukt og bær',
    'Sitron gir syre til fisk, råkost og sausar. Vask skalet godt dersom du skal bruke det i maten.',
    ['lemon'],
  ],
  sitronsaft: [
    'Frukt og bær',
    'Tilset sitronsaft litt om gongen og smak til. Syra kan gjere ei mild suppe eller gryte friskare.',
  ],
  'raude linser': [
    'Belgfrukter',
    'Skyl tørre raude linser før koking. Dei mjuknar raskt og jamnar suppe og gryter.',
    ['red-lentils', 'lentils'],
  ],
  'kokte kikerter': [
    'Belgfrukter',
    'Hermetiske kikerter er ferdig kokte. Skyl dei og la dei renne av før du veg opp mengda til oppskrifta.',
    ['chickpeas'],
  ],
  'kokte kvite bønner': [
    'Belgfrukter',
    'Bruk ferdig kokte eller hermetiske bønner. Tørre bønner krev eiga bløyting og koking før dei kan brukast her.',
    ['white-beans'],
  ],
  egg: [
    'Basisvarer',
    'Egg bind saman omelett og grateng. Oppbevar dei etter rettleiinga på pakninga.',
    ['eggs'],
  ],
  mjølk: [
    'Basisvarer',
    'Mjølk blir brukt til å spe farse og lage kvit saus. Tilset litt om gongen når du jamnar ein saus.',
    ['milk'],
  ],
  smør: [
    'Basisvarer',
    'Smør gir smak ved steiking og er utgangspunkt for mange sausar. Pass på varmen så det ikkje svir seg.',
    ['butter'],
  ],
  kveitemjøl: [
    'Basisvarer',
    'Kveitemjøl blir brukt til deig og til å jamne sausar. Rør godt når du sper med væske.',
    ['flour', 'plain-flour'],
  ],
  potetmjøl: [
    'Basisvarer',
    'Potetmjøl bind væske i farse og kan brukast som jamning. Det er ikkje det same som vanleg kveitemjøl.',
  ],
  penne: [
    'Basisvarer',
    'Penne er pastarøyr som held godt på tomatsaus. Kok etter pakninga, og ta vare på litt pastavatn til sausen.',
    ['pasta', 'penne-rigate'],
  ],
  makaroni: [
    'Basisvarer',
    'Makaroni er små pastarøyr. Kok dei før dei blir blanda i gratengen.',
    ['macaroni'],
  ],
  ris: [
    'Basisvarer',
    'Kok risen etter rettleiinga på pakninga. Avkjøl restar raskt og set dei i kjøleskapet.',
    ['rice'],
  ],
  basilikum: [
    'Urter og krydder',
    'Riv fersk basilikum og tilset han mot slutten av matlaginga for å ta vare på smaken.',
    ['basil'],
  ],
  dill: [
    'Urter og krydder',
    'Dill passar godt til fisk og poteter. Hakk dei mjuke stilkane saman med blada.',
    ['dill'],
  ],
  persille: [
    'Urter og krydder',
    'Persille kan dryssast over suppe og gryter like før servering.',
    ['parsley'],
  ],
};
const spice = new Set([
  'salt',
  'pepar',
  'heil pepar',
  'oregano',
  'timian',
  'chiliflak',
  'karri',
  'paprikapulver',
  'spisskummen',
]);
export const ingredients = [
  ...new Set([...editorialRecipes.flatMap((r) => r.ingredients.map((i) => i.name)), 'eple']),
].map((name) => {
  const entry = descriptions[name];
  return {
    id: ingredientSlug(name),
    slug: ingredientSlug(name),
    name,
    group: entry?.[0] || (spice.has(name) ? 'Urter og krydder' : 'Basisvarer'),
    description:
      entry?.[1] ||
      `${name.charAt(0).toUpperCase() + name.slice(1)} blir brukt i oppskriftene nedanfor. Følg mengda i oppskrifta og kontroller innhald og allergen på pakninga.`,
    aliases: entry?.[2] || [],
    image: '',
  };
});
export function findIngredient(slug: string) {
  return ingredients.find((i) => i.slug === decodeURIComponent(slug) || i.aliases.includes(slug));
}
export const ingredientGroups = [
  'Grønsaker',
  'Frukt og bær',
  'Fisk og kjøt',
  'Belgfrukter',
  'Basisvarer',
  'Urter og krydder',
];
