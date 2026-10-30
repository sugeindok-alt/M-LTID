import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Leaf, Sprout, Utensils } from 'lucide-react';
import { mealApi } from '@/lib/meal-api';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { SectionHeading, SourceFailure, NovaEducation } from '@/components/shared';
export const revalidate = 3600;
export default async function Home() {
  const [heroResult, dinnerResult, veggieResult, easyResult, ingredientsResult] =
    await Promise.allSettled([
      mealApi.detail('52771'),
      mealApi.browse({ category: 'Seafood' }),
      mealApi.browse({ category: 'Vegetarian' }),
      Promise.all(['52977', '52814', '52772'].map((id) => mealApi.detail(id))),
      mealApi.ingredients(),
    ]);
  const hero = heroResult.status === 'fulfilled' ? heroResult.value : null;
  const ingredients =
    ingredientsResult.status === 'fulfilled'
      ? ['Tomatoes', 'Garlic', 'Lemon', 'Basil', 'Salmon', 'Potatoes']
          .map((name) =>
            ingredientsResult.value.find((i) => i.name.toLowerCase() === name.toLowerCase()),
          )
          .filter((i) => i !== undefined)
      : [];
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-rule" /> GOD MAT. KVAR DAG.
          </p>
          <h1>
            God mat startar med <em>gode råvarer.</em>
          </h1>
          <p className="hero-description">
            Oppdag middagsrettar, utforsk ingrediensane og lær meir om maten du et.
          </p>
          <div className="hero-buttons">
            <Link href="/oppskrifter" className="button">
              Utforsk oppskrifter <ArrowUpRight size={18} />
            </Link>
            <Link href="/ingrediensar" className="text-link">
              Sjå ingrediensar <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-footnote">
            <Sprout size={18} />
            <span>Litt inspirasjon. Meir matglede.</span>
          </div>
        </div>
        <div className="hero-visual">
          {hero ? (
            <>
              <Photo
                src={hero.image}
                alt={hero.title}
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
              />
              <div className="hero-caption">
                <div>
                  <p className="eyebrow">EIN SMAK AV ITALIA</p>
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
            <Utensils size={18} /> Oppskrifter frå heile verda
          </span>
          <span>
            <Sprout size={18} /> Råvarene i sentrum
          </span>
          <span>
            <Leaf size={18} /> Kunnskap om maten
          </span>
        </div>
      </div>
      <section className="container section">
        <SectionHeading
          kicker="KVA BLIR DET TIL MIDDAG?"
          title="Noko godt å samlast om."
          href="/oppskrifter"
        />
        {dinnerResult.status === 'fulfilled' ? (
          <RecipeGrid recipes={dinnerResult.value.slice(0, 3)} />
        ) : (
          <SourceFailure href="/" />
        )}
        <p className="source-note">Eit utval frå TheMealDB. Kjelda oppgir ikkje popularitetstal.</p>
      </section>
      {hero && (
        <section className="container featured">
          <div className="featured-photo">
            <Photo src={hero.image} alt={hero.title} sizes="(max-width: 800px) 100vw, 50vw" />
          </div>
          <div className="featured-copy">
            <p className="eyebrow">PÅ MENYEN I DAG</p>
            <h2>
              Små ingrediensar.
              <br />
              <em>Stor matglede.</em>
            </h2>
            <p>
              Tomat, kvitlauk og eit lite sting av chili. La ei italiensk pastaklassikar setje
              smaken på dagen.
            </p>
            <Link href={`/oppskrifter/${hero.id}`} className="button light">
              Lag {hero.title} <ArrowUpRight size={18} />
            </Link>
            <span className="source-note">Oppskrift frå TheMealDB · Originalspråk: engelsk</span>
          </div>
        </section>
      )}
      <section className="container section">
        <SectionHeading
          kicker="KVARDAGSFAVORITTAR"
          title="Godt, utan store fakter."
          href="/oppskrifter?category=Chicken"
          link="Finn middagsinspirasjon"
        />
        {easyResult.status === 'fulfilled' ? (
          <RecipeGrid recipes={easyResult.value.filter((r) => r !== null)} />
        ) : (
          <SourceFailure href="/" />
        )}
        <p className="source-note">
          Inspirasjon til kvardagsmat. Tilberedningstid er ikkje oppgitt av kjelda.
        </p>
      </section>
      <section className="ingredient-band">
        <div className="container">
          <SectionHeading
            kicker="BLI KJEND MED RÅVARENE"
            title="Det gode startar her."
            href="/ingrediensar"
            link="Alle ingrediensar"
          />
          <div className="ingredient-strip">
            {ingredients.map((i) => (
              <Link href={`/ingrediensar/${i.slug}`} className="ingredient-tile" key={i.id}>
                <div className="ingredient-image">
                  <Photo src={i.image} alt={i.name} contain sizes="(max-width: 640px) 40vw, 15vw" />
                </div>
                <h3>{i.name}</h3>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          {!ingredients.length && <SourceFailure href="/" />}
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          kicker="GRØNT PÅ TALLERKENEN"
          title="La grønsakene spele hovudrolla."
          href="/oppskrifter?category=Vegetarian"
          link="Meir vegetar"
        />
        {veggieResult.status === 'fulfilled' ? (
          <RecipeGrid recipes={veggieResult.value.slice(0, 3)} />
        ) : (
          <SourceFailure href="/" />
        )}
      </section>
      <div className="container section nova-section">
        <NovaEducation />
      </div>
    </>
  );
}
