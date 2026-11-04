import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { getCookbook } from '@/lib/cookbook';
import { privatePage } from '@/lib/private-page';
export async function loadEntry(id: string, editing = false, servings: number | null = null) {
  const user = await privatePage(
    '/kokebok/' +
      encodeURIComponent(id) +
      (editing ? '/rediger' : '') +
      (servings === null ? '' : '?porsjonar=' + servings),
  );
  const entry = await getCookbook(getDb(), user.id, id);
  if (!entry) notFound();
  return entry;
}
