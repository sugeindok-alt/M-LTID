type MenuDay = { recipeId: string; note: string };
export type DinnerWeek = { slug: string; title: string; description: string; days: MenuDay[] };
export const dinnerWeeks: DinnerWeek[] = [
  {
    slug: 'raske-kvardagar',
    title: 'Raske kvardagar',
    description: 'Fem middagar på høgst ein halvtime, med førebuing rekna med.',
    days: [
      { recipeId: 'nn-brokkolisuppe', note: 'Start veka med ei varm brokkolisuppe.' },
      { recipeId: 'nn-laksepasta', note: 'Pasta, erter og laks blir klare medan du lagar sausen.' },
      {
        recipeId: 'nn-kyllingwrap',
        note: 'Set fram fyllet i små skåler og la kvar og ein fylle si eiga lefse.',
      },
      { recipeId: 'nn-bonner-og-egg', note: 'Bønner og egg gjer den varme tomatpanna mettande.' },
      { recipeId: 'nn-fisketaco', note: 'Set fisk og grønsaker på bordet til fredagstacoen.' },
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
        recipeId: 'nn-fleskepannekake',
        note: 'Fleskepannekake gir eit avbrekk frå potetmiddagane.',
      },
      { recipeId: 'nn-fiskekaker', note: 'Lag fiskekakene frå grunnen og server med sprø råkost.' },
      { recipeId: 'nn-raspeballar', note: 'Set av god tid til raspeballar på fredag.' },
    ],
  },
  {
    slug: 'meir-fisk-pa-bordet',
    title: 'Meir fisk på bordet',
    description:
      'Laks, sei og torsk som omnsrett, suppe, pannemiddag og grateng, med ulike grønsaker til.',
    days: [
      { recipeId: 'nn-laks', note: 'Omnsbakte poteter får eit forsprang før laksen går inn.' },
      { recipeId: 'nn-fiskesuppe', note: 'Poteter og purre gir fylde i suppa med sei.' },
      {
        recipeId: 'nn-sei-med-lauk',
        note: 'Lauk og steikt sei gir ein enkel pannemiddag midt i veka.',
      },
      { recipeId: 'nn-fiskegrateng', note: 'I dag blir fisken grateng med makaroni og sprø topp.' },
      { recipeId: 'nn-torsk-med-ertemos', note: 'Torsk med grøn ertemos rundar av fiskeveka.' },
    ],
  },
  {
    slug: 'bruk-opp-ravarene',
    title: 'Bruk opp råvarene',
    description:
      'Til fire porsjonar kvar dag brukar veka til saman 1,6 kg hovudkål, seks gulrøter og 16 lefser. Sjekk kva du har før du handlar.',
    days: [
      {
        recipeId: 'nn-kalrulettar',
        note: 'Bruk store kålblad til kålrulettane. Legg resten av kålhovudet kjølig til wraps og råkost.',
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
