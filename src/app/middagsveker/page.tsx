import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Photo } from '@/components/photo';
import { catalog } from '@/lib/catalog';
import { dinnerWeeks } from '@/data/dinner-weeks';
export default async function Page() {
  const recipes = await catalog.browse();
  return (
    <div className="container page-shell menu-page">
      <header className="page-intro">
        <p className="eyebrow">MIDDAG MÅNDAG TIL FREDAG</p>
        <h1>Ferdige middagsveker.</h1>
        <p>
          Vel fem middagar som passar saman. Du kan byte rettar og justere porsjonane i Mi veke.
        </p>
      </header>
      <div className="menu-grid">
        {dinnerWeeks.map((menu) => {
          const first = recipes.find((r) => r.id === menu.days[0].recipeId);
          return (
            <Link key={menu.slug} href={'/middagsveker/' + menu.slug} className="menu-card">
              {first && (
                <div className="menu-photo">
                  <Photo
                    src={first.image}
                    alt={first.imageAlt || first.title}
                    sizes="(max-width:700px) 95vw, 45vw"
                  />
                  <span className="image-label">Illustrasjon</span>
                </div>
              )}
              <div>
                <p className="eyebrow">FEM MIDDAGAR</p>
                <h2>{menu.title}</h2>
                <p>{menu.description}</p>
                <span className="text-link">
                  Sjå menyen <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
