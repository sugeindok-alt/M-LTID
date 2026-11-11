import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Photo } from '@/components/photo';
import { catalog } from '@/lib/catalog';
import { dinnerWeeks } from '@/data/dinner-weeks';
import { PageHero } from '@/components/page-hero';
export default async function Page() {
  const recipes = await catalog.browse();
  const lead = recipes.find((r) => r.id === dinnerWeeks[1]?.days[0].recipeId) ?? recipes[0];
  return (
    <div className="cine-shell menu-page">
      <PageHero
        kicker="MIDDAG MÅNDAG TIL FREDAG"
        title="Ferdige middagsveker."
        text="Vel fem middagar som passar saman. Du kan byte rettar og justere porsjonane i Mi veke."
        image={
          lead && {
            src: lead.image,
            alt: lead.imageAlt || lead.title,
            illustration: !!lead.imageCredit,
          }
        }
      />
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
