import { notFound } from 'next/navigation';
import { privatePage } from '@/lib/private-page';
import { catalog } from '@/lib/catalog';
import { CookbookForm } from '@/components/cookbook-form';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ original?: string }>;
}) {
  const { original } = await searchParams;
  await privatePage(
    original ? '/kokebok/ny?original=' + encodeURIComponent(original) : '/kokebok/ny',
  );
  const source = original ? await catalog.detail(original) : null;
  if (original && !source) notFound();
  return (
    <CookbookForm
      original={source ? { id: source.id, title: source.title } : null}
      initial={
        source
          ? {
              title: source.title + ' – min variant',
              servings: source.servings || 4,
              ingredients: source.ingredients.map(({ name, measure }) => ({ name, measure })),
              steps: source.steps,
            }
          : undefined
      }
    />
  );
}
