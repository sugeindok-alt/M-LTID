import { it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { testDatabase } from './database';
import { user, cookbookRecipes, namedBooks } from '@/db/schema';
import { changeBook, publicBook, publicPhoto } from '@/lib/book-sharing';

it('rejects stale approvals and keeps unapproved photos and recipes private between editions', async () => {
  const { db, client } = await testDatabase(),
    owner = 'owner',
    other = 'other',
    recipe = randomUUID(),
    hidden = randomUUID(),
    bookId = randomUUID();
  try {
    await db
      .insert(user)
      .values([owner, other].map((id) => ({ id, name: id, email: id + '@example.test' })));
    await db
      .insert(cookbookRecipes)
      .values(
        [recipe, hidden].map((id) => ({
          id,
          userId: owner,
          title: id === recipe ? 'Gulrotsuppe' : 'Familieoppskrift',
          servings: 2,
          ingredients: [{ name: 'gulrøter', measure: '400 g' }],
          steps: ['Kok gulrøtene.'],
          image: 'dGVzdA==',
        })),
      );
    await db
      .insert(namedBooks)
      .values({ id: bookId, userId: owner, title: 'Vardagsmat', recipeIds: [recipe, hidden] });
    const selections = [{ id: recipe, photo: false }];
    const preview = async () => {
      const r = await changeBook(db, owner, { action: 'preview', id: bookId, selections });
      if (!('approval' in r)) throw new Error('Missing preview');
      return r;
    };
    const publish = (approval: string) =>
      changeBook(db, owner, { action: 'publish', id: bookId, selections, approval });
    const first = await preview();
    await db
      .update(cookbookRecipes)
      .set({ title: 'Suppe med gulrot', revision: 2 })
      .where(eq(cookbookRecipes.id, recipe));
    await expect(publish(first.approval)).rejects.toMatchObject({ status: 409 });
    await expect(publicBook(db, bookId)).rejects.toMatchObject({ status: 404 });
    await expect(
      changeBook(db, other, { action: 'preview', id: bookId, selections }),
    ).rejects.toMatchObject({ status: 404 });
    await publish((await preview()).approval);
    expect((await publicBook(db, bookId)).recipes.map((r) => [r.title, r.photo])).toEqual([
      ['Suppe med gulrot', false],
    ]);
    await expect(publicPhoto(db, bookId, recipe)).rejects.toMatchObject({ status: 404 });
    await expect(publicPhoto(db, bookId, hidden)).rejects.toMatchObject({ status: 404 });
    await changeBook(db, owner, { action: 'withdraw', id: bookId });
    await expect(publish(first.approval)).rejects.toMatchObject({ status: 409 });
    await expect(publicBook(db, bookId)).rejects.toMatchObject({ status: 404 });
  } finally {
    await client.close();
  }
});
