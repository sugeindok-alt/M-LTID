import { z } from 'zod';
import { mealId } from './recipes';

export const privateId = z.uuid();
export const dinnerId = z.union([mealId, privateId]);
export const recipeFields = z.object({
  title: z.string().trim().min(1).max(140),
  servings: z.number().int().min(1).max(24),
  ingredients: z
    .array(
      z
        .object({
          name: z.string().trim().min(1).max(100),
          measure: z.string().trim().min(1).max(80),
        })
        .strict(),
    )
    .min(1)
    .max(60),
  steps: z.array(z.string().trim().min(1).max(2400)).min(1).max(40),
});
export type CookbookFields = z.infer<typeof recipeFields>;
const writeFields = recipeFields.extend({
  id: privateId,
  image: z.string().max(800000).nullable().optional(),
});
export const createCookbook = writeFields.extend({ originalId: mealId.nullable() }).strict();
export const editCookbook = writeFields.extend({ revision: z.number().int().positive() }).strict();
export const privateLabel = (originalId: string | null) =>
  originalId ? 'Min variant' : 'Eiga oppskrift';
