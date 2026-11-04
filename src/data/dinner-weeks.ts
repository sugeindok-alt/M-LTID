type MenuDay = { recipeId: string; note: string };
export type DinnerWeek = { slug: string; title: string; description: string; days: MenuDay[] };
export const dinnerWeeks: DinnerWeek[] = [
  {
    slug: 'raske-kvardagar',
    title: 'Raske kvardagar',
    description: 'Fem middagar på høgst ein halvtime, med førebuing rekna med.',
    days: [
      { recipeId: 'nn-tomatsuppe', note: 'Suppe med egg og grovbrød gir ein lun start på veka.' },
      { recipeId: 'nn-laksepasta', note: 'Pasta, erter og laks blir klare medan du lagar sausen.' },
      {
        recipeId: 'nn-kyllingwrap',
        note: 'Set fram fyllet i små skåler og la kvar og ein fylle si eiga lefse.',
      },
      { recipeId: 'nn-bonner-og-egg', note: 'Bønner og egg gjer den varme tomatpanna mettande.' },
      { recipeId: 'nn-taco', note: 'Avslutt veka med fredagstaco og heimelaga krydder.' },
    ],
  },
  {
    slug: 'norske-klassikarar',
    title: 'Norske klassikarar',
    description:
      'Frå steikjepanna til sausgryta, med poteter, fisk, grønsaker og kjøt i ulike roller.',
    days: [
      {
        recipeId: 'nn-pytt-i-panne',
        note: 'Små bitar av potet og gulrot blir middagen i steikjepanna.',
      },
      { recipeId: 'nn-plukkfisk', note: 'Torsk og poteter møtest i mild saus med purre.' },
      {
        recipeId: 'nn-grove-pannekaker',
        note: 'Grove middagspannekaker gir eit avbrekk frå potetmiddagane.',
      },
      { recipeId: 'nn-fiskekaker', note: 'Lag fiskekakene frå grunnen og server med sprø råkost.' },
      { recipeId: 'nn-kjottkaker', note: 'Brun saus og kokte grønsaker rundar av klassikarveka.' },
    ],
  },
  {
    slug: 'meir-fisk-pa-bordet',
    title: 'Meir fisk på bordet',
    description:
      'Laks, sei og kvit fisk som omnsrett, suppe, pannemiddag, grateng og sprø fiskepinnar.',
    days: [
      { recipeId: 'nn-laks', note: 'Omnsbakte poteter får eit forsprang før laksen går inn.' },
      { recipeId: 'nn-fiskesuppe', note: 'Poteter og purre gir fylde i suppa med sei.' },
      {
        recipeId: 'nn-sei-med-lauk',
        note: 'Lauk og steikt sei gir ein enkel pannemiddag midt i veka.',
      },
      { recipeId: 'nn-fiskegrateng', note: 'I dag blir fisken grateng med makaroni og sprø topp.' },
      { recipeId: 'nn-fiskepinnar', note: 'Avslutt med heimelaga fiskepinnar og frisk råkost.' },
    ],
  },
  {
    slug: 'bruk-opp-ravarene',
    title: 'Bruk opp råvarene',
    description:
      'Eit kålhovud, ein pose gulrøter og ei pakke lefser får fleire oppgåver. Mengdene i handlelista er totalforbruket for veka.',
    days: [
      {
        recipeId: 'nn-kalpanne',
        note: 'Skjer av berre kålen du treng til panna. Legg resten kjølig til wraps og råkost.',
      },
      {
        recipeId: 'nn-kyllingwrap',
        note: 'Strimle kål og gulrot til kyllingwraps. Pakk resten av lefsene godt inn til torsdag.',
      },
      {
        recipeId: 'nn-fiskepinnar',
        note: 'Riv gulrot frå same pose og snitt litt meir av kålhovudet til råkost ved sida av fisken.',
      },
      {
        recipeId: 'nn-bonnetaco',
        note: 'Bruk lefsene frå tysdag og strimlar av kålen som grønt til bønnetacoen.',
      },
      {
        recipeId: 'nn-steikt-ris',
        note: 'Skjer av det du treng av kålen og gulrøtene til steikt ris. Følg oppskrifta for tilberedning av risen.',
      },
    ],
  },
];
export function dinnerWeek(slug: unknown) {
  return dinnerWeeks.find((menu) => menu.slug === slug);
}
