import Link from 'next/link';
import { ArrowUpRight, Leaf, Search, Sprout, Utensils } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { filterRecipes, streetFoodCategory } from '@/lib/catalog-filter';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { SectionHeading, SourceFailure, NovaEducation } from '@/components/shared';
export const revalidate = 300;
export default async function Home() {
  const recipes = await catalog.browse().catch(() => null);
  const hero = recipes?.find((r) => r.id === 'nn-laks-med-ris');
  const streetFood = recipes && filterRecipes(recipes, { category: streetFoodCategory });
  const streetFoodHref = '/oppskrifter?category=' + encodeURIComponent(streetFoodCategory);
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-rule" /> GOD MAT. KVAR DAG.
          </p>
          <h1>
            God middag.
            <br />
            <em>Heile veka.</em>
          </h1>
          <p className="hero-description">
            Frå kjøtkaker til fredagstaco. Finn middagar som passar kvardagen, med råvarer frå
            butikken rundt hjørnet.
          </p>
          {recipes && (
            <nav className="tonight-links" aria-label="Tre forslag til middag">
              <strong>Kva skal vi ha til middag?</strong>
              {recipes.slice(0, 3).map((r) => (
                <Link key={r.id} href={'/oppskrifter/' + r.id}>
                  {r.title}
                  <ArrowUpRight size={15} aria-hidden />
                </Link>
              ))}
            </nav>
          )}
          <form action="/oppskrifter" className="search-field home-search">
            <Search size={20} />
            <label className="sr-only" htmlFor="home-search">
              Søk etter middag eller råvare
            </label>
            <input
              id="home-search"
              name="q"
              placeholder="Laks, suppe eller noko med potet?"
              maxLength={80}
            />
            <button className="button">Søk</button>
          </form>
          <div className="quick-links" aria-label="Finn middag">
            <Link href={streetFoodHref}>{streetFoodCategory}</Link>
            <Link href="/oppskrifter?maxTime=30">30 min eller mindre</Link>
            <Link href="/oppskrifter?vegetarian=1">Vegetar</Link>
            <Link href="/oppskrifter?category=Tradisjonsmat">Norske klassikarar</Link>
          </div>
          <div className="hero-footnote">
            <Sprout size={18} />
            <Link className="text-link" href="/middagsveker">
              Sjå fire ferdige middagsveker <ArrowUpRight size={15} />
            </Link>
          </div>
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
      <div className="values-strip">
        <div className="container">
          <span>
            <Utensils size={18} /> Middagar for norske hushald
          </span>
          <span>
            <Sprout size={18} /> Råvarene i sentrum
          </span>
          <span>
            <Leaf size={18} /> Plass til meir grønt
          </span>
        </div>
      </div>
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
      {streetFood && streetFood.length > 0 && (
        <section className="container section">
          <SectionHeading
            kicker="NÅR DET ER FREDAG"
            title={streetFoodCategory}
            href={streetFoodHref}
            link="Sjå heile utvalet"
          />
          <RecipeGrid recipes={streetFood.slice(0, 3)} />
        </section>
      )}
      <section className="ingredient-band">
        <div className="container">
          <SectionHeading kicker="KVA PASSAR I DAG?" title="Finn din type middag." />
          <div className="dinner-entries">
            <Link href="/oppskrifter?maxTime=30">
              <span className="eyebrow">NÅR TIDA ER KNAPP</span>
              <h3>Raskt på bordet</h3>
              <p>Middagar på 30 minutt eller mindre.</p>
              <ArrowUpRight />
            </Link>
            <Link href="/oppskrifter?vegetarian=1">
              <span className="eyebrow">GRØNT OG GODT</span>
              <h3>Meir vegetar</h3>
              <p>Tomatsuppe med makaroni og egg, grønsakslasagne og heimelaga pizza.</p>
              <ArrowUpRight />
            </Link>
            <Link href="/oppskrifter?category=Tradisjonsmat">
              <span className="eyebrow">SMAKAR SOM VARER</span>
              <h3>Norske klassikarar</h3>
              <p>Kjøtkaker, lapskaus og fårikål.</p>
              <ArrowUpRight />
            </Link>
          </div>
        </div>
      </section>
      <div className="container section nova-section">
        <NovaEducation />
      </div>
    </>
  );
}
