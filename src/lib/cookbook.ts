import 'server-only';
import { and, eq, desc, sql } from 'drizzle-orm';
import sharp from 'sharp';
import type { z } from 'zod';
import type { Database } from '@/db';
import { cookbookRecipes as book, recipeCatalog } from '@/db/schema';
import { type Recipe } from './recipes';
import { createCookbook, editCookbook, privateId } from './cookbook-types';
import { AppError } from './errors';

const owned = (owner: string, id: string) => and(eq(book.userId, owner), eq(book.id, id));
const summary = {
  id: book.id,
  title: book.title,
  servings: book.servings,
  originalId: book.originalId,
  originalTitle: sql<string | null>`${recipeCatalog.data}->>'title'`,
  hasImage: sql<boolean>`${book.image} is not null`,
  revision: book.revision,
};
export function listCookbook(db: Database, owner: string) {
  return db
    .select(summary)
    .from(book)
    .leftJoin(recipeCatalog, eq(recipeCatalog.id, book.originalId))
    .where(eq(book.userId, owner))
    .orderBy(desc(book.updatedAt));
}
export async function getCookbook(db: Database, owner: string, id: string) {
  if (!privateId.safeParse(id).success) return null;
  const [row] = await db
    .select({ ...summary, ingredients: book.ingredients, steps: book.steps })
    .from(book)
    .leftJoin(recipeCatalog, eq(recipeCatalog.id, book.originalId))
    .where(owned(owner, id));
  return row ?? null;
}
export type CookbookEntry = NonNullable<Awaited<ReturnType<typeof getCookbook>>>;
export function asRecipe(row: CookbookEntry): Recipe {
  return {
    id: row.id,
    title: row.title,
    servings: row.servings,
    ingredients: row.ingredients,
    steps: row.steps,
    category: 'Mi kokebok',
    area: '',
    source: null,
    youtube: null,
    tags: [],
    language: 'nn',
    image: row.hasImage ? `/api/kokebok/${row.id}/bilete?v=${row.revision}` : '',
    imageAlt: row.title,
  };
}
async function prepareImage(image: string | null | undefined) {
  if (image == null) return image;
  if (!/^data:image\/jpeg;base64,[a-z0-9+/]+=*$/i.test(image))
    throw new AppError('Vel eit gyldig foto.', 400);
  const input = Buffer.from(image.slice(image.indexOf(',') + 1), 'base64');
  try {
    const pipeline = sharp(input, { limitInputPixels: 4_000_000 });
    if ((await pipeline.metadata()).format !== 'jpeg') throw new Error();
    const bytes = await pipeline
      .rotate()
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    if (bytes.length > 400_000) throw new Error();
    return bytes.toString('base64');
  } catch {
    throw new AppError('Fotoet kunne ikkje lesast. Prøv eit anna bilete.', 400);
  }
}
export async function saveCookbook(
  db: Database,
  owner: string,
  input: z.infer<typeof createCookbook> | z.infer<typeof editCookbook>,
) {
  const fields = {
    title: input.title,
    servings: input.servings,
    ingredients: input.ingredients,
    steps: input.steps,
  };
  if ('revision' in input) {
    const entry = await getCookbook(db, owner, input.id);
    if (!entry) throw new AppError('Fann ikkje oppskrifta.', 404);
    const image = await prepareImage(input.image);
    const [saved] = await db
      .update(book)
      .set({ ...fields, image, updatedAt: new Date(), revision: sql`${book.revision}+1` })
      .where(and(owned(owner, input.id), eq(book.revision, input.revision)))
      .returning({ id: book.id });
    if (!saved)
      throw new AppError(
        'Oppskrifta er endra på ei anna eining. Opne henne på nytt før du redigerer vidare.',
        409,
      );
    return saved;
  }
  if (input.originalId) {
    const [original] = await db
      .select({ id: recipeCatalog.id })
      .from(recipeCatalog)
      .where(eq(recipeCatalog.id, input.originalId));
    if (!original) throw new AppError('Fann ikkje originaloppskrifta.', 404);
  }
  const [created] = await db
    .insert(book)
    .values({
      ...fields,
      id: input.id,
      userId: owner,
      originalId: input.originalId,
      image: await prepareImage(input.image),
    })
    .onConflictDoNothing()
    .returning({ id: book.id });
  if (created) return created;
  if (!(await getCookbook(db, owner, input.id)))
    throw new AppError('Kunne ikkje lagre oppskrifta.', 409);
  return { id: input.id };
}
export async function cookbookImage(db: Database, owner: string, id: string) {
  if (!privateId.safeParse(id).success) throw new AppError('Fann ikkje biletet.', 404);
  const [row] = await db.select({ image: book.image }).from(book).where(owned(owner, id));
  if (!row?.image) throw new AppError('Fann ikkje biletet.', 404);
  return new Response(new Uint8Array(Buffer.from(row.image, 'base64')), {
    headers: { 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie' },
  });
}
