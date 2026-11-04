import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Photo } from '@/components/photo';
import { catalog } from '@/lib/catalog';
import { dinnerWeek } from '@/data/dinner-weeks';
import { dayNames } from '@/lib/week-dates';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: dinnerWeek((await params).slug)?.title ?? 'Ukjend middagsveke' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const menu = dinnerWeek((await params).slug);
  if (!menu) notFound();
  const recipes = await catalog.browse();
  const days = menu.days.map((day) => ({
    ...day,
    recipe: recipes.find((r) => r.id === day.recipeId),
  }));
  const usable = days.every(
    ({ recipe }) =>
      recipe && (menu.slug !== 'raske-kvardagar' || (recipe.minutes && recipe.minutes <= 30)),
  );
  return (
    <div className="container page-shell menu-page menu-detail">
      <Link className="text-link" href="/middagsveker">
        ← Alle middagsveker
      </Link>
      <header className="page-intro">
        <p className="eyebrow">VEKEMENY · FEM MIDDAGAR</p>
        <h1>{menu.title}.</h1>
        <p>{menu.description}</p>
      </header>
      <ol className="menu-days">
        {days.map(({ recipe, note }, day) => (
          <li key={day}>
            {recipe && (
              <div className="menu-day-photo">
                <Photo
                  src={recipe.image}
                  alt={recipe.imageAlt || recipe.title}
                  sizes="(max-width:650px) 80px, 150px"
                />
              </div>
            )}
            <div>
              <p className="eyebrow">
                {dayNames[day]}
                {recipe ? ' · ' + recipe.minutes + ' MIN' : ''}
              </p>
              <h2>
                {recipe ? (
                  <Link href={'/oppskrifter/' + recipe.id}>{recipe.title}</Link>
                ) : (
                  'Middagen er ikkje tilgjengeleg'
                )}
              </h2>
              <p>{note}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="source-note">
        Matbileta er KI-genererte illustrasjonar. Tidene er rettleiande og omfattar førebuing.
      </p>
      {usable ? (
        <>
          <Link className="button" href={'/mi-veke?mal=' + menu.slug}>
            Vel denne middagsveka <ArrowRight size={15} />
          </Link>
          <p className="source-note">
            Logg inn for å velje kalenderveke og porsjonstal. Middagar du alt har planlagt, blir
            ståande.
          </p>
        </>
      ) : (
        <p>Vekemenyen kan ikkje leggjast inn før alle fem middagane er tilgjengelege.</p>
      )}
    </div>
  );
}
