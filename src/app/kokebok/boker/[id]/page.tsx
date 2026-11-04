import { notFound } from 'next/navigation';
import { privatePage } from '@/lib/private-page';
import { getDb } from '@/db';
import { ownerBook } from '@/lib/book-sharing';
import { listCookbook } from '@/lib/cookbook';
import { AppError } from '@/lib/errors';
import { BookManager } from '@/components/book-manager';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    user = await privatePage('/kokebok/boker/' + encodeURIComponent(id)),
    db = getDb();
  const [book, recipes] = await Promise.all([
    ownerBook(db, user.id, id).catch((e) => {
      if (e instanceof AppError && e.status === 404) notFound();
      throw e;
    }),
    listCookbook(db, user.id),
  ]);
  return (
    <BookManager
      initial={book}
      recipes={recipes.map(({ id, title, hasImage }) => ({ id, title, hasImage }))}
    />
  );
}
