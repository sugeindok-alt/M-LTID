import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { catalogSnapshot, presentSavedRecipe } from '@/data/catalog';
import { ingredients, findIngredient } from '@/data/ingredients';
import { filterRecipes } from '@/lib/catalog-filter';
import { mealId, normalizeRecipe } from '@/lib/recipes';
import { parseMeasure, scaleMeasure } from '@/lib/quantities';
import { normalizeProduct } from '@/lib/products';
import { rawMeal } from './fixtures';
describe('Norwegian editorial catalogue', () => {
  it('combines Norwegian search, ingredient, time and vegetarian filters', () => {
    expect(
      filterRecipes(catalogSnapshot, {
        q: 'tomat',
        ingredient: 'Pasta',
        maxTime: '30',
        vegetarian: '1',
      }).map((r) => r.id),
    ).toEqual(['nn-pasta-tomat']);
    expect(filterRecipes(catalogSnapshot, { q: 'laks', vegetarian: '1' })).toEqual([]);
    expect(filterRecipes(catalogSnapshot, { q: 'fårikål', maxTime: '30' })).toEqual([]);
    expect(filterRecipes(catalogSnapshot, { q: 'fårikål' }).map((r) => r.id)).toEqual([
      'nn-farikal',
    ]);
  });
  it('publishes complete Nynorsk recipes with real local image files and valid ingredient links', () => {
    expect(filterRecipes(catalogSnapshot)).toHaveLength(16);
    for (const recipe of catalogSnapshot) {
      expect(mealId.safeParse(recipe.id).success).toBe(true);
      expect(recipe.language).toBe('nn');
      expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
      expect(recipe.servings).toBe(4);
      expect(existsSync(`public${recipe.image}`)).toBe(true);
      expect(recipe.imageCredit?.note).toContain('KI-generert');
      for (const ingredient of recipe.ingredients) {
        expect(ingredients.some((i) => i.slug === ingredient.slug)).toBe(true);
        expect(parseMeasure(ingredient.measure)).not.toBeNull();
      }
    }
  });
  it('keeps saved IDs and old ingredient links without serving English fallback', () => {
    const old = normalizeRecipe(rawMeal);
    const presented = presentSavedRecipe(old);
    expect(presented.id).toBe(old.id);
    expect(presented.language).toBe('nn');
    expect(old.title).toBe('Spicy Arrabiata Penne');
    expect(findIngredient('apples')?.name).toBe('eple');
    expect(findIngredient('tomatoes')?.name).toBe('tomatar');
    expect(
      normalizeProduct({ code: '12345678', product_name: { en: 'English only' } }).name,
    ).toContain('norsk namn manglar');
  });
  it('scales Norwegian quantities with decimal commas for portions and shopping', () => {
    expect(scaleMeasure('1,5 dl', 2)).toBe('3 dl');
    expect(scaleMeasure('0,5 ts', 0.5)).toBe('0,25 ts');
    expect(scaleMeasure('400 g', 0.5)).toBe('200 g');
  });
});
