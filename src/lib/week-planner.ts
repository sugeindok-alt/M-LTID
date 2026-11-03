import 'server-only';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '@/db';
import { weekDinners, shoppingImports, recipeCatalog } from '@/db/schema';
import { AppError } from './errors';
import { createLibrary } from './library';
import { formatMeasure, parseMeasure, scaleMeasure } from './quantities';
import { mealId } from './recipes';
import { isWeek } from './week-dates';

export const monday = z.string().refine(isWeek);
export const dayChange = z
  .object({
    week: monday,
    day: z.number().int().min(0).max(6),
    recipeId: mealId.nullable(),
    servings: z.number().int().min(1).max(12),
  })
  .strict();
export const importWeek = z
  .object({ week: monday, version: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict();

type Ingredient = { name: string; measure: string };
function sumIngredients(items: Ingredient[]) {
  const sums = new Map<string, { name: string; amount: number; unit: string }>();
  const separate: Ingredient[] = [];
  for (const item of items) {
    const value = parseMeasure(item.measure);
    if (!value) {
      separate.push(item);
      continue;
    }
    const key = JSON.stringify([item.name.toLowerCase().trim(), value.unit]);
    const previous = sums.get(key);
    if (previous) previous.amount += value.amount;
    else sums.set(key, { name: item.name, ...value });
  }
  return [
    ...Array.from(sums.values(), (v) => ({
      name: v.name,
      measure: formatMeasure(v.amount, v.unit),
    })),
    ...separate,
  ].sort((a, b) => a.name.localeCompare(b.name, 'nn'));
}

export async function readWeek(db: Database, owner: string, week: string) {
  const rows = await db
    .select({ day: weekDinners.day, servings: weekDinners.servings, recipe: recipeCatalog.data })
    .from(weekDinners)
    .innerJoin(recipeCatalog, eq(recipeCatalog.id, weekDinners.recipeId))
    .where(and(eq(weekDinners.userId, owner), eq(weekDinners.week, week)))
    .orderBy(weekDinners.day);
  const days = rows.map(({ day, servings, recipe }) => ({
    day,
    servings,
    recipeId: recipe.id,
    title: recipe.title,
  }));
  const items = sumIngredients(
    rows.flatMap(({ servings, recipe }) =>
      recipe.ingredients.map((i) => ({
        name: i.name,
        measure: scaleMeasure(i.measure, servings / (recipe.servings || 4)),
      })),
    ),
  );
  const version = createHash('sha256')
    .update(JSON.stringify([days, items]))
    .digest('hex');
  const receipt = await db
    .select({ id: shoppingImports.requestId })
    .from(shoppingImports)
    .where(
      and(
        eq(shoppingImports.userId, owner),
        eq(shoppingImports.requestId, importKey(week, version)),
      ),
    )
    .limit(1);
  return { week, days, items, version, imported: receipt.length > 0 };
}
export type WeekPlan = Awaited<ReturnType<typeof readWeek>>;
const importKey = (week: string, version: string) => 'week:' + week + ':' + version;

export async function changeDay(db: Database, owner: string, input: z.infer<typeof dayChange>) {
  const { week, day, servings, recipeId } = input;
  if (recipeId === null) {
    await db
      .delete(weekDinners)
      .where(
        and(eq(weekDinners.userId, owner), eq(weekDinners.week, week), eq(weekDinners.day, day)),
      );
  } else {
    const [row] = await db
      .select({ recipe: recipeCatalog.data })
      .from(recipeCatalog)
      .where(eq(recipeCatalog.id, recipeId));
    if (!row || row.recipe.archived || row.recipe.language !== 'nn')
      throw new AppError('Denne middagen er ikkje tilgjengeleg.', 404);
    await db
      .insert(weekDinners)
      .values({ userId: owner, week, day, servings, recipeId })
      .onConflictDoUpdate({
        target: [weekDinners.userId, weekDinners.week, weekDinners.day],
        set: { servings, recipeId },
      });
  }
  return readWeek(db, owner, week);
}
export async function addWeek(db: Database, owner: string, input: z.infer<typeof importWeek>) {
  const plan = await readWeek(db, owner, input.week);
  if (!plan.items.length) throw new AppError('Vel minst éin middag først.', 400);
  if (plan.version !== input.version)
    throw new AppError('Veka er endra. Hent veka på nytt og sjå gjennom varene.', 409);
  // The same preview has the same receipt across clicks, reloads and devices.
  // addItems claims it inside the transaction that merges the shopping rows.
  await createLibrary(db).addItems(owner, plan.items, importKey(plan.week, plan.version));
  return { ...plan, imported: true };
}
