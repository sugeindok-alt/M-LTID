import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '@/db';
import {
  namedBooks as books,
  sharedRecipes as shared,
  cookbookRecipes as originals,
} from '@/db/schema';
import { AppError } from './errors';

const id = z.uuid();
const fields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
};
const selections = z
  .array(z.object({ id, photo: z.boolean() }).strict())
  .min(1)
  .max(80)
  .refine((a) => new Set(a.map((r) => r.id)).size === a.length);
export const bookAction = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), ...fields }).strict(),
  z
    .object({
      action: z.literal('save'),
      id,
      revision: z.number().int().positive(),
      ...fields,
      recipeIds: z
        .array(id)
        .max(500)
        .refine((a) => new Set(a).size === a.length),
    })
    .strict(),
  z.object({ action: z.literal('preview'), id, selections }).strict(),
  z
    .object({ action: z.literal('publish'), id, selections, approval: z.string().length(64) })
    .strict(),
  z.object({ action: z.literal('withdraw'), id }).strict(),
]);
type Book = typeof books.$inferSelect;
type Reader = Pick<Database, 'select'>;
const unavailable = () => new AppError('Fann ikkje kokeboka.', 404);
const owns = (owner: string, bookId: string) => and(eq(books.userId, owner), eq(books.id, bookId));
export function listBooks(db: Reader, owner: string) {
  return db
    .select({
      id: books.id,
      title: books.title,
      description: books.description,
      publishedAt: books.publishedAt,
    })
    .from(books)
    .where(eq(books.userId, owner))
    .orderBy(books.title, books.id);
}
export async function ownerBook(db: Reader, owner: string, bookId: string) {
  if (!id.safeParse(bookId).success) throw unavailable();
  const [book] = await db.select().from(books).where(owns(owner, bookId));
  if (!book) throw unavailable();
  const published = await db
    .select({
      id: shared.recipeId,
      title: shared.title,
      photo: sql<boolean>`${shared.image} is not null`,
    })
    .from(shared)
    .where(eq(shared.bookId, bookId))
    .orderBy(shared.position);
  return { ...book, published };
}
type Selection = z.infer<typeof selections>;
async function draftEdition(db: Reader, book: Book, selected: Selection) {
  if (selected.some((r) => !book.recipeIds.includes(r.id)))
    throw new AppError('Lagre oppskrifta i denne boka før du deler henne.', 400);
  const photos = selected.filter((r) => r.photo).map((r) => r.id);
  const rows = await db
    .select({
      id: originals.id,
      title: originals.title,
      servings: originals.servings,
      ingredients: originals.ingredients,
      steps: originals.steps,
      revision: originals.revision,
      image: photos.length
        ? sql<
            string | null
          >`case when ${inArray(originals.id, photos)} then ${originals.image} else null end`
        : sql<string | null>`null`,
    })
    .from(originals)
    .where(
      and(
        eq(originals.userId, book.userId),
        inArray(
          originals.id,
          selected.map((r) => r.id),
        ),
      ),
    );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = selected.map((s) => {
    const row = byId.get(s.id);
    if (!row || (s.photo && !row.image))
      throw new AppError('Utvalet har endra seg. Sjå gjennom boka på nytt.', 409);
    return row;
  });
  const recipes = ordered.map(({ image, ...row }) => ({ ...row, photo: Boolean(image) }));
  const preview = { title: book.title, description: book.description, recipes };
  const approval = createHash('sha256')
    .update(JSON.stringify([book.id, book.revision, preview]))
    .digest('hex');
  return { ordered, preview: { ...preview, approval } };
}
export async function changeBook(db: Database, owner: string, input: z.infer<typeof bookAction>) {
  if (input.action === 'create') {
    const [created] = await db
      .insert(books)
      .values({
        id: randomUUID(),
        userId: owner,
        title: input.title,
        description: input.description,
      })
      .returning({ id: books.id });
    return created;
  }
  return db.transaction(async (tx) => {
    const [book] = await tx.select().from(books).where(owns(owner, input.id)).for('update');
    if (!book) throw unavailable();
    const where = owns(owner, book.id),
      revision = book.revision + 1;
    if (input.action === 'save') {
      if (input.revision !== book.revision)
        throw new AppError('Boka er endra. Last sida på nytt.', 409);
      if (input.recipeIds.length) {
        const found = await tx
          .select({ id: originals.id })
          .from(originals)
          .where(and(eq(originals.userId, owner), inArray(originals.id, input.recipeIds)));
        if (found.length !== input.recipeIds.length)
          throw new AppError('Vel oppskrifter frå di eiga samling.', 400);
      }
      await tx
        .update(books)
        .set({
          title: input.title,
          description: input.description,
          recipeIds: input.recipeIds,
          revision,
        })
        .where(where);
    } else if (input.action === 'withdraw') {
      await tx
        .update(books)
        .set({ publishedAt: null, publishedTitle: null, publishedDescription: null, revision })
        .where(where);
      await tx.delete(shared).where(eq(shared.bookId, book.id));
    } else {
      const { ordered, preview } = await draftEdition(tx, book, input.selections);
      if (input.action === 'preview') return preview;
      if (input.approval !== preview.approval)
        throw new AppError(
          'Innhaldet har endra seg. Sjå den nye førehandsvisinga før publisering.',
          409,
        );
      await tx.delete(shared).where(eq(shared.bookId, book.id));
      await tx
        .insert(shared)
        .values(
          ordered.map((r, position) => ({
            bookId: book.id,
            recipeId: r.id,
            position,
            title: r.title,
            servings: r.servings,
            ingredients: r.ingredients,
            steps: r.steps,
            image: r.image,
          })),
        );
      await tx
        .update(books)
        .set({
          publishedAt: new Date(),
          publishedTitle: preview.title,
          publishedDescription: preview.description,
          revision,
        })
        .where(where);
    }
    return { id: book.id };
  });
}
export type OwnerBook = Awaited<ReturnType<typeof ownerBook>>;
export type Preview = Awaited<ReturnType<typeof draftEdition>>['preview'];
const live = (bookId: string) => and(eq(books.id, bookId), isNotNull(books.publishedAt));
export async function publicBook(db: Reader, bookId: string) {
  if (!id.safeParse(bookId).success) throw unavailable();
  const rows = await db
    .select({
      title: books.publishedTitle,
      description: books.publishedDescription,
      recipe: {
        id: shared.recipeId,
        title: shared.title,
        servings: shared.servings,
        ingredients: shared.ingredients,
        steps: shared.steps,
      },
      photo: sql<boolean>`${shared.image} is not null`,
    })
    .from(books)
    .innerJoin(shared, eq(shared.bookId, books.id))
    .where(live(bookId))
    .orderBy(shared.position);
  if (!rows.length) throw unavailable();
  return {
    title: rows[0].title!,
    description: rows[0].description || '',
    recipes: rows.map((r) => ({ ...r.recipe, photo: r.photo })),
  };
}
export type PublicBook = Awaited<ReturnType<typeof publicBook>>;
export async function publicPhoto(db: Reader, bookId: string, recipeId: string) {
  if (!id.safeParse(bookId).success || !id.safeParse(recipeId).success) throw unavailable();
  const [row] = await db
    .select({ image: shared.image })
    .from(books)
    .innerJoin(shared, eq(shared.bookId, books.id))
    .where(and(live(bookId), eq(shared.recipeId, recipeId)));
  if (!row?.image) throw unavailable();
  return new Response(new Uint8Array(Buffer.from(row.image, 'base64')), {
    headers: { 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff' },
  });
}
