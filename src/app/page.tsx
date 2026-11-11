import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock3, Leaf, Search, Soup, Timer } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { filterRecipes, streetFoodCategory } from '@/lib/catalog-filter';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { DinnerChoice } from '@/components/dinner-choice';
import { HeroGlow } from '@/components/hero-glow';
import { SectionHeading, SourceFailure, NovaEducation } from '@/components/shared';
export const revalidate = 300;
export default async function Home() {
  const recipes = await catalog.browse().catch(() => null);
  const hero = recipes?.find((r) => r.id === 'nn-laks-med-ris');
  const streetFood = recipes && filterRecipes(recipes, { category: streetFoodCategory });
  const streetFoodHref = '/oppskrifter?category=' + encodeURIComponent(streetFoodCategory);
  return (
    <>
      <HeroGlow />
      <section className="container hero cookbook-home">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker">
            <span className="small-rule" /> KVA FREISTAR I DAG?
          </p>
          <h1>{hero?.title || 'God middag. Heile veka.'}</h1>
          <p className="hero-description">
            {hero?.description ||
              'Finn noko godt å lage til middag, med råvarer frå butikken rundt hjørnet.'}
          </p>
          {hero && (
            <div className="hero-buttons">
              <Link className="button" href={'/oppskrifter/' + hero.id}>
                Sjå oppskrifta <ArrowUpRight size={18} aria-hidden />
              </Link>
              <span className="hero-meta">
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
        <div className="hero-visual">
          {hero ? (
            <>
              <Photo
                src={hero.image}
                alt={hero.imageAlt || hero.title}
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
              />
              <span className="image-label">Illustrasjon</span>
              <div className="hero-caption">
                <div>
                  <p className="eyebrow">PÅ BORDET OM LAG {hero.minutes} MINUTT</p>
                  <Link href={`/oppskrifter/${hero.id}`}>{hero.title}</Link>
                </div>
                <Link
                  className="round-button"
                  href={`/oppskrifter/${hero.id}`}
                  aria-label={`Sjå ${hero.title}`}
                >
                  <ArrowUpRight size={23} />
                </Link>
              </div>
            </>
          ) : (
            <SourceFailure href="/" />
          )}
        </div>
      </section>
      {recipes && (
        <div className="container">
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
      <section className="section-band">
        <div className="container">
          <SectionHeading kicker="KVA PASSAR I DAG?" title="Finn din type middag." />
          <div className="dinner-entries">
            <Link href="/oppskrifter?maxTime=29">
              <span className="entry-icon" aria-hidden>
                <Timer size={22} />
              </span>
              <span className="eyebrow">NÅR TIDA ER KNAPP</span>
              <h3>Raskt på bordet</h3>
              <p>Middagar som tek under 30 minutt.</p>
              <ArrowUpRight className="entry-arrow" aria-hidden />
            </Link>
            <Link href="/oppskrifter?vegetarian=1">
              <span className="entry-icon" aria-hidden>
                <Leaf size={22} />
              </span>
              <span className="eyebrow">GRØNT OG GODT</span>
              <h3>Meir vegetar</h3>
              <p>Tomatsuppe med makaroni og egg, grønsakslasagne og heimelaga pizza.</p>
              <ArrowUpRight className="entry-arrow" aria-hidden />
            </Link>
            <Link href="/oppskrifter?category=Tradisjonsmat">
              <span className="entry-icon" aria-hidden>
                <Soup size={22} />
              </span>
              <span className="eyebrow">SMAKAR SOM VARER</span>
              <h3>Norske klassikarar</h3>
              <p>Kjøtkaker, lapskaus og fårikål.</p>
              <ArrowUpRight className="entry-arrow" aria-hidden />
            </Link>
            <Link href="/middagsveker">
              <span className="entry-icon" aria-hidden>
                <CalendarDays size={22} />
              </span>
              <span className="eyebrow">PLANLAGT PÅ FØREHAND</span>
              <h3>Ferdige middagsveker</h3>
              <p>Fire veker med fem middagar som passar saman.</p>
              <ArrowUpRight className="entry-arrow" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      {streetFood && streetFood.length > 0 && (
        <section className="street-band">
          <div className="container">
            <SectionHeading
              kicker="NÅR DET ER FREDAG"
              title={streetFoodCategory}
              href={streetFoodHref}
              link="Sjå heile utvalet"
            />
            <RecipeGrid recipes={streetFood.slice(0, 3)} />
          </div>
        </section>
      )}
      <div className="container section nova-section">
        <NovaEducation />
      </div>
    </>
  );
}
