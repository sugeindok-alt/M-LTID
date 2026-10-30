import { randomUUID } from 'node:crypto';
import { and, eq, desc, sql } from 'drizzle-orm';
import type { Database } from '@/db';
import {
  favorites,
  recipeCache,
  shoppingItems,
  shoppingImports,
  preferences,
  user,
  productReferences,
} from '@/db/schema';
import type { Recipe } from './recipes';
import { parseMeasure } from './quantities';
import { AppError } from './errors';
export function createLibrary(db: Database) {
  return {
    async favorites(userId: string) {
      const rows = await db
        .select({ recipe: recipeCache.data })
        .from(favorites)
        .innerJoin(recipeCache, eq(favorites.recipeId, recipeCache.id))
        .where(eq(favorites.userId, userId))
        .orderBy(desc(favorites.createdAt));
      return rows.map((row) => row.recipe);
    },
    async saveFavorite(userId: string, recipe: Recipe) {
      await db.transaction(async (tx) => {
        await tx
          .insert(recipeCache)
          .values({ id: recipe.id, data: recipe })
          .onConflictDoUpdate({
            target: recipeCache.id,
            set: { data: recipe, fetchedAt: new Date() },
          });
        await tx.insert(favorites).values({ userId, recipeId: recipe.id }).onConflictDoNothing();
      });
    },
    async removeFavorite(userId: string, recipeId: string) {
      await db
        .delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId)));
    },
    async shopping(userId: string) {
      return db
        .select()
        .from(shoppingItems)
        .where(eq(shoppingItems.userId, userId))
        .orderBy(shoppingItems.createdAt);
    },
    async addItems(
      userId: string,
      items: { name: string; measure: string }[],
      requestId: string,
      recipeId?: string,
    ) {
      await db.transaction(async (tx) => {
        const claimed = await tx
          .insert(shoppingImports)
          .values({ userId, requestId })
          .onConflictDoNothing()
          .returning();
        if (!claimed.length) return;
        for (const item of items) {
          const parsed = parseMeasure(item.measure);
          const id = randomUUID();
          await tx
            .insert(shoppingItems)
            .values({
              id,
              userId,
              name: item.name,
              nameKey: item.name.toLowerCase().trim(),
              mergeKey: parsed ? `unit:${parsed.unit}` : `opaque:${id}`,
              amount: parsed?.amount,
              unit: parsed?.unit,
              measure: item.measure,
              recipeId,
            })
            .onConflictDoUpdate({
              target: [shoppingItems.userId, shoppingItems.nameKey, shoppingItems.mergeKey],
              set: {
                amount: sql`${shoppingItems.amount} + ${parsed?.amount ?? 0}`,
                purchased: false,
                updatedAt: new Date(),
              },
            });
        }
      });
    },
    async updateItem(userId: string, id: string, patch: { purchased?: boolean; measure?: string }) {
      const parsed = patch.measure !== undefined ? parseMeasure(patch.measure) : null;
      const [row] = await db
        .update(shoppingItems)
        .set({
          ...patch,
          updatedAt: new Date(),
          ...(patch.measure !== undefined
            ? {
                amount: parsed?.amount ?? null,
                unit: parsed?.unit ?? null,
                mergeKey: `edited:${id}`,
              }
            : {}),
        })
        .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)))
        .returning();
      if (!row) throw new AppError('Vara finst ikkje i handlelista di.', 404);
      return row;
    },
    async removeItem(userId: string, id: string) {
      await db
        .delete(shoppingItems)
        .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
    },
    async clearPurchased(userId: string) {
      await db
        .delete(shoppingItems)
        .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.purchased, true)));
    },
    async profile(userId: string) {
      const [prefs] = await db.select().from(preferences).where(eq(preferences.userId, userId));
      const [count] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(favorites)
        .where(eq(favorites.userId, userId));
      return {
        preferences: prefs ?? { theme: 'olive', favoriteCategory: '' },
        favoriteCount: count.value,
      };
    },
    async updateProfile(
      userId: string,
      input: { name: string; theme: string; favoriteCategory: string },
    ) {
      await db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(user.id, userId));
        await tx
          .insert(preferences)
          .values({ userId, theme: input.theme, favoriteCategory: input.favoriteCategory })
          .onConflictDoUpdate({
            target: preferences.userId,
            set: {
              theme: input.theme,
              favoriteCategory: input.favoriteCategory,
              updatedAt: new Date(),
            },
          });
      });
    },
    async references(userId: string, recipeId: string) {
      return db
        .select()
        .from(productReferences)
        .where(and(eq(productReferences.userId, userId), eq(productReferences.recipeId, recipeId)));
    },
    async linkProduct(userId: string, recipeId: string, ingredient: string, barcode: string) {
      await db
        .insert(productReferences)
        .values({ id: randomUUID(), userId, recipeId, ingredient, barcode })
        .onConflictDoUpdate({
          target: [
            productReferences.userId,
            productReferences.recipeId,
            productReferences.ingredient,
          ],
          set: { barcode },
        });
    },
  };
}
