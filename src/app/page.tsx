import Link from 'next/link';
import { ArrowRight, Clock3, Search } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { filterRecipes, streetFoodCategory } from '@/lib/catalog-filter';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { DinnerChoice } from '@/components/dinner-choice';
import { SectionHeading, SourceFailure, NovaEducation } from '@/components/shared';
export const revalidate = 300;
export default async function Home() {
  const recipes = await catalog.browse().catch(() => null);
  const hero = recipes?.find((r) => r.id === 'nn-laks-med-ris');
  const streetFoodHref = '/oppskrifter?category=' + encodeURIComponent(streetFoodCategory);
  // Kvart panel får biletet til den første passande retten som ikkje alt er brukt på sida.
  const used = new Set(hero ? [hero.id] : []);
  const pick = (query: Parameters<typeof filterRecipes>[1]) => {
    const recipe = recipes && filterRecipes(recipes, query).find((r) => !used.has(r.id));
    if (recipe) used.add(recipe.id);
    return recipe;
  };
  const panels = [
    {
      kicker: 'NÅR DET ER FREDAG',
      title: streetFoodCategory,
      text: 'Kebabrull i varm lefse, sprø kyllingspyd og smashburger rett frå steikjepanna.',
      cta: 'Sjå gatekjøkkenmiddagane',
      href: streetFoodHref,
      recipe: pick({ category: streetFoodCategory }),
    },
    {
      kicker: 'NÅR TIDA ER KNAPP',
      title: 'Raskt på bordet',
      text: 'Middagar som tek under 30 minutt, frå du byrjar til maten står på bordet.',
      cta: 'Finn ein rask middag',
      href: '/oppskrifter?maxTime=29',
      recipe: pick({ maxTime: '29' }),
    },
    {
      kicker: 'SMAKAR SOM VARER',
      title: 'Norske klassikarar',
      text: 'Kjøtkaker, lapskaus og fårikål. Middagane du kjenner att frå første bit.',
      cta: 'Sjå klassikarane',
      href: '/oppskrifter?category=Tradisjonsmat',
      recipe: pick({ category: 'Tradisjonsmat' }),
    },
    {
      kicker: 'GRØNT OG GODT',
      title: 'Meir vegetar',
      text: 'Tomatsuppe med makaroni og egg, grønsakslasagne og heimelaga pizza.',
      cta: 'Sjå vegetarmiddagane',
      href: '/oppskrifter?vegetarian=1',
      recipe: pick({ vegetarian: '1' }),
    },
    {
      kicker: 'PLANLAGT PÅ FØREHAND',
      title: 'Ferdige middagsveker',
      text: 'Fire veker med fem middagar som passar saman. Vel ei veke og byt ut det du vil.',
      cta: 'Sjå middagsvekene',
      href: '/middagsveker',
      recipe: pick({}),
    },
  ];
  return (
    <>
      <section className="cine cine-hero">
        <div className="cine-media hero-visual">
          {hero && (
            <>
              <Photo src={hero.image} alt={hero.imageAlt || hero.title} priority sizes="100vw" />
              <span className="image-label">Illustrasjon</span>
            </>
          )}
        </div>
        <div className="container cine-content">
          <p className="eyebrow">KVA FREISTAR I DAG?</p>
          <h1>{hero?.title || 'God middag. Heile veka.'}</h1>
          <p className="cine-text">
            {hero?.description ||
              'Finn noko godt å lage til middag, med råvarer frå butikken rundt hjørnet.'}
          </p>
          {hero && (
            <div className="cine-actions">
              <Link className="button cine-button" href={'/oppskrifter/' + hero.id}>
                Sjå oppskrifta <ArrowRight size={18} aria-hidden />
              </Link>
              <span className="cine-meta">
                <Clock3 size={16} aria-hidden /> Om lag {hero.minutes} minutt · {hero.servings}{' '}
                porsjonar
              </span>
            </div>
          )}
          <form action="/oppskrifter" className="search-field home-search" role="search">
            <Search size={20} aria-hidden />
            <label className="sr-only" htmlFor="home-search">
              Søk etter middag eller råvare
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Laks, suppe eller noko med potet?"
              maxLength={80}
            />
            <button className="button">Søk</button>
          </form>
          <nav className="quick-links" aria-label="Finn middag">
            <Link href="/oppskrifter?maxTime=29">Under 30 minutt</Link>
            <Link href="/oppskrifter?category=Tradisjonsmat">Norske klassikarar</Link>
            <Link href={streetFoodHref}>{streetFoodCategory}</Link>
          </nav>
        </div>
      </section>
      {recipes && (
        <div className="container cine-choice">
          <DinnerChoice
            recipes={recipes.map(
              ({ id, title, image, imageAlt, imageCredit, minutes, category }) => ({
                id,
                title,
                image,
                imageAlt,
                imageCredit,
                minutes,
                category,
              }),
            )}
          />
        </div>
      )}
      {panels.map(
        ({ kicker, title, text, cta, href, recipe }) =>
          recipe && (
            <section className="cine" key={href}>
              <div className="cine-media">
                <Photo src={recipe.image} alt={recipe.imageAlt || recipe.title} sizes="100vw" />
                {recipe.imageCredit && <span className="image-label">Illustrasjon</span>}
              </div>
              <div className="container cine-content">
                <p className="eyebrow">{kicker}</p>
                <h2>{title}</h2>
                <p className="cine-text">{text}</p>
                <div className="cine-actions">
                  <Link className="button cine-button" href={href}>
                    {cta} <ArrowRight size={18} aria-hidden />
                  </Link>
                </div>
              </div>
            </section>
          ),
      )}
      <section className="container section">
        <SectionHeading
          kicker="LITT HJELP TIL MIDDAGSVALET"
          title="Seks gode kvardagsmiddagar."
          href="/oppskrifter"
          link="Sjå alle middagar"
        />
        {recipes ? <RecipeGrid recipes={recipes.slice(0, 6)} /> : <SourceFailure href="/" />}
        <p className="source-note">
          Seks middagar med råvarer du finn i butikken. Tidene er rettleiande og inkluderer
          førebuing.
        </p>
      </section>
      <div className="container section nova-section">
        <NovaEducation />
      </div>
    </>
  );
}
