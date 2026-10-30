import Link from 'next/link';
import { ArrowUpRight, Leaf, Search, Sprout, Utensils } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { SectionHeading, SourceFailure, NovaEducation } from '@/components/shared';
export const revalidate = 300;
export default async function Home() {
  const recipes = await catalog.browse().catch(() => null);
  const hero = recipes?.find((r) => r.id === 'nn-laks');
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
            <Link href="/oppskrifter?maxTime=30">Under 30 min</Link>
            <Link href="/oppskrifter?vegetarian=1">Vegetar</Link>
            <Link href="/oppskrifter?category=Tradisjonsmat">Norske klassikarar</Link>
          </div>
          <div className="hero-footnote">
            <Sprout size={18} />
            <span>Vanlege råvarer. Godt å samlast om.</span>
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
          Valt av MÅLTID: fisk, grønt og kjende favorittar. Tidene er rettleiande og inkluderer
          førebuing.
        </p>
      </section>
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
              <p>Linser, bønner og grønsaker i hovudrolla.</p>
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
