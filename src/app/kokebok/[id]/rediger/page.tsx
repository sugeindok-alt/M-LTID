import { CookbookForm } from '@/components/cookbook-form';
import { loadEntry } from '../load';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await loadEntry(id, true);
  return (
    <CookbookForm
      initial={{
        title: entry.title,
        servings: entry.servings,
        ingredients: entry.ingredients,
        steps: entry.steps,
      }}
      edit={{ id, revision: entry.revision, hasImage: entry.hasImage }}
      original={
        entry.originalId
          ? { id: entry.originalId, title: entry.originalTitle || 'Originaloppskrift' }
          : null
      }
    />
  );
}
