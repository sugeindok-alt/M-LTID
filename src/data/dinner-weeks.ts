type MenuDay = { recipeId: string; note: string };
export type DinnerWeek = { slug: string; title: string; description: string; days: MenuDay[] };
export const dinnerWeeks: DinnerWeek[] = [
  {
    slug: 'raske-kvardagar',
    title: 'Raske kvardagar',
    description: 'Fem kjende middagar på høgst ein halvtime til fire, førebuinga medrekna.',
    days: [
      {
        recipeId: 'nn-polse-med-stappe',
        note: 'Del potetene små til mosen og steik pølsa medan dei kokar.',
      },
      { recipeId: 'nn-spagetti-med-kjotsaus', note: 'Kok spagettien medan kjøtsausen småputrar.' },
      { recipeId: 'nn-laks-med-ris', note: 'Set på risen først og bak laksen medan han kokar.' },
      { recipeId: 'nn-tomatsuppe', note: 'Kok egg og makaroni medan tomatsuppa blir klar.' },
      { recipeId: 'nn-taco', note: 'Set fram varmt tacokjøt, lefser og grønsaker til fredag.' },
    ],
  },
  {
    slug: 'norske-klassikarar',
    title: 'Norske klassikarar',
    description: 'Frå pytt i panne til fårikål, med både fisk, kjøt og poteter gjennom veka.',
    days: [
      {
        recipeId: 'nn-pytt-i-panne',
        note: 'Steik pølse, potetterningar og gulrot i panna og topp med egg.',
      },
      {
        recipeId: 'nn-torsk-med-eggesmor',
        note: 'La torsken trekkje medan poteter og gulrøter blir møre.',
      },
      { recipeId: 'nn-pannekaker-med-bacon', note: 'Steik tynne pannekaker og server dei med sprøtt bacon.' },
      { recipeId: 'nn-kjottkaker', note: 'La kjøtkakene trekkje ferdig i brun saus.' },
      {
        recipeId: 'nn-farikal',
        note: 'Set av god tid fredag, så kjøtet får småkoke mørt saman med kålen.',
      },
    ],
  },
  {
    slug: 'meir-fisk-pa-bordet',
    title: 'Meir fisk på bordet',
    description: 'Fem ulike fiskemiddagar med ris, poteter, makaroni og grønsaker.',
    days: [
      { recipeId: 'nn-laks-med-ris', note: 'Start veka med omnsbakt laks, ris og brokkoli.' },
      { recipeId: 'nn-fiskekaker', note: 'Server fiskekakene med kokte poteter og riven gulrot.' },
      {
        recipeId: 'nn-fiskegrateng',
        note: 'Bland makaroni og fisk i gratengen og steik til toppen er sprø.',
      },
      {
        recipeId: 'nn-torsk-med-eggesmor',
        note: 'Server torsken med poteter, gulrøter og eggesmør.',
      },
      {
        recipeId: 'nn-fiskepinnar-med-potetmos',
        note: 'Legg fiskepinnane ved sida av potetmosen og den rivne gulrota.',
      },
    ],
  },
  {
    slug: 'bruk-opp-ravarene',
    title: 'Bruk opp råvarene',
    description:
      'Bruk potetene og gulrøtene frå same pose fleire dagar. Lasagne og pizza deler både tomatar og ost.',
    days: [
      {
        recipeId: 'nn-torsk-med-eggesmor',
        note: 'Mål gjerne opp og kok potetene til tysdag samstundes. Avkjøl tysdagsporsjonen raskt og set han i kjøleskapet.',
      },
      {
        recipeId: 'nn-pytt-i-panne',
        note: 'Har du kokte poteter frå måndag, skjer du dei i terningar og steikjer dei direkte. Bruk meir av gulrøtene frå same pose.',
      },
      {
        recipeId: 'nn-lasagne',
        note: 'Riv gulrot frå same pose til kjøtsausen. Ta vare på resten av osten til fredag.',
      },
      {
        recipeId: 'nn-kylling',
        note: 'Bruk poteter, gulrøter og lauk frå vekeshandelen i kyllingforma.',
      },
      {
        recipeId: 'nn-pizza',
        note: 'Bruk resten av osten frå lasagnen. Har du opna tomatar, bruk dei til pizzasausen.',
      },
    ],
  },
];
export function dinnerWeek(slug: unknown) {
  return dinnerWeeks.find((menu) => menu.slug === slug);
}
