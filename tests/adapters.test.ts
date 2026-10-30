import { describe, expect, it, vi } from 'vitest';
import { createMealAdapter } from '@/lib/meal-api';
import { normalizeRecipe, normalizeCard, safeUrl } from '@/lib/recipes';
import { createProductAdapter, normalizeProduct } from '@/lib/products';
import { novaGroup, novaVerdict } from '@/lib/nova';
import { parseMeasure, scaleMeasure } from '@/lib/quantities';
import { rawMeal, rawProduct } from './fixtures';
const jsonFetch = (data: unknown) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
describe('TheMealDB boundary', () => {
  it('normalizes ingredients, removes blanks and keeps unknown measurements empty', () => {
    const recipe = normalizeRecipe(rawMeal);
    expect(recipe.ingredients).toEqual([
      { name: 'Penne Rigate', measure: '1 lb' },
      { name: 'Olive Oil', measure: '2 tbsp' },
      { name: 'Garlic', measure: '' },
    ]);
    expect(recipe.steps).toHaveLength(3);
    expect(recipe).not.toHaveProperty('cookingTime');
    expect(recipe).not.toHaveProperty('servings');
  });
  it('rejects malformed recipe and untrusted image data', () => {
    expect(() => normalizeRecipe({ strMeal: 'bad' })).toThrow();
    expect(() =>
      normalizeCard({ ...rawMeal, strMealThumb: 'https://evil.example/a.jpg' }),
    ).toThrow();
  });
  it('strips unsafe source links', () => {
    expect(normalizeRecipe({ ...rawMeal, strSource: 'javascript:alert(1)' }).source).toBeNull();
    expect(safeUrl('http://example.com')).toBeNull();
  });
  it('loads a real-shaped detail and only calls the free V1 API', async () => {
    const fetcher = jsonFetch({ meals: [rawMeal] });
    const recipe = await createMealAdapter(fetcher).detail('52771');
    expect(recipe?.title).toBe(rawMeal.strMeal);
    expect(String(fetcher.mock.calls[0][0])).toMatch('/api/json/v1/1/lookup.php?i=52771');
  });
  it('handles a missing detail', async () => {
    expect(await createMealAdapter(jsonFetch({ meals: null })).detail('999999')).toBeNull();
  });
  it('intersects independent free filters and sorts the actual result', async () => {
    const other = { ...rawMeal, idMeal: '52772', strMeal: 'Another recipe' };
    const fetcher = vi.fn<typeof fetch>();
    fetcher
      .mockResolvedValueOnce(new Response(JSON.stringify({ meals: [rawMeal, other] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ meals: [rawMeal] })));
    const recipes = await createMealAdapter(fetcher).browse({ q: 'pasta', category: 'Vegetarian' });
    expect(recipes.map((r) => r.id)).toEqual(['52771']);
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('search.php?s=pasta'),
        expect.stringContaining('filter.php?c=Vegetarian'),
      ]),
    );
  });
  it('treats no matches as an empty result, not an error or fabricated recipes', async () => {
    expect(await createMealAdapter(jsonFetch({ meals: null })).browse({ q: 'nothing' })).toEqual(
      [],
    );
  });
  it('rejects malformed envelopes and network failures', async () => {
    await expect(createMealAdapter(jsonFetch({ meals: 'bad' })).browse()).rejects.toThrow(
      'TheMealDB',
    );
    await expect(
      createMealAdapter(vi.fn<typeof fetch>().mockRejectedValue(new Error('timeout'))).detail(
        '52771',
      ),
    ).rejects.toThrow('TheMealDB');
  });
  it('normalizes ingredient directory without making up descriptions', async () => {
    const api = createMealAdapter(
      jsonFetch({
        meals: [
          { idIngredient: '1', strIngredient: 'Olive Oil', strDescription: null, strType: null },
        ],
      }),
    );
    const [ingredient] = await api.ingredients();
    expect(ingredient.slug).toBe('olive-oil');
    expect(ingredient.description).toBeNull();
    expect(ingredient.image).toContain('Olive_Oil.png');
  });
});
describe('Open Food Facts boundary and NOVA', () => {
  it.each([1, 2, 3, 4] as const)('retains valid NOVA %s', (group) => {
    expect(novaGroup(group)).toBe(group);
    expect(novaVerdict(group)).toBe(
      group === 4 ? 'Ultraprosessert' : 'Ikkje ultraprosessert etter NOVA',
    );
  });
  it.each([undefined, null, '', 'unknown', 0, 5, -1, {}, 2.5, true])(
    'unknown stays unknown (%s)',
    (value) => {
      expect(novaGroup(value)).toBeNull();
    },
  );
  it('does not infer NOVA from product names', () => {
    expect(
      normalizeProduct({ code: '12345678', product_name: 'Ultra processed tomato soup' }).nova,
    ).toBeNull();
  });
  it('supports localized search results and validates barcode fields', () => {
    expect(
      normalizeProduct({ ...rawProduct, product_name: { en: 'English name', no: 'Norsk namn' } })
        .name,
    ).toBe('Norsk namn');
    expect(() => normalizeProduct({ code: '../secret' })).toThrow();
  });
  it('looks up barcode using documented v3.6 and identifies the application', async () => {
    const fetcher = jsonFetch({ status: 'success', product: rawProduct });
    const api = createProductAdapter({ contact: 'test@example.com', fetcher });
    expect((await api.barcode(rawProduct.code))?.nova).toBe(4);
    expect(String(fetcher.mock.calls[0][0])).toContain('/api/v3.6/product/');
    expect(fetcher.mock.calls[0][1]?.headers).toHaveProperty(
      'User-Agent',
      'MALTID/1.0 (test@example.com)',
    );
  });
  it('uses Search-a-licious for explicit name search', async () => {
    const fetcher = jsonFetch({ hits: [rawProduct] });
    const api = createProductAdapter({ contact: 'test@example.com', fetcher });
    expect(await api.search('Tomato soup')).toHaveLength(1);
    expect(String(fetcher.mock.calls[0][0])).toMatch('https://search.openfoodfacts.org/search?');
    expect(String(fetcher.mock.calls[0][0])).not.toContain('search_terms');
  });
  it('handles missing products, missing NOVA and malformed results', async () => {
    expect(
      await createProductAdapter({
        contact: 'test@example.com',
        fetcher: jsonFetch({ status: 0 }),
      }).barcode('12345678'),
    ).toBeNull();
    expect(normalizeProduct({ ...rawProduct, nova_group: null }).nova).toBeNull();
    await expect(
      createProductAdapter({
        contact: 'test@example.com',
        fetcher: jsonFetch({ hits: 'bad' }),
      }).search('tomato'),
    ).rejects.toThrow('Open Food Facts');
  });
  it('requires a real configured contact before network access', async () => {
    const fetcher = jsonFetch({});
    await expect(createProductAdapter({ contact: '', fetcher }).search('tomato')).rejects.toThrow(
      'kontaktadresse',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe('conservative quantity handling', () => {
  it.each([
    ['2 tbsp', 2, 'tbsp'],
    ['1 1/2 cups', 1.5, 'cup'],
    ['1/4 tsp', 0.25, 'tsp'],
    ['250g', 250, 'g'],
    ['2', 2, ''],
  ])('parses %s', (raw, amount, unit) => {
    expect(parseMeasure(String(raw))).toEqual({ amount, unit });
  });
  it.each([
    'to taste',
    '1-2 tbsp',
    '2 heaped tbsp',
    '400g tin',
    '1/0 cup',
    '0g',
    '1 large',
    '2kg chopped',
  ])('does not scale ambiguous measure %s', (raw) => {
    expect(parseMeasure(raw)).toBeNull();
    expect(scaleMeasure(raw, 2)).toBe(raw);
  });
  it('scales only known numeric measurements', () => {
    expect(scaleMeasure('1/2 cup', 2)).toBe('1 cup');
  });
});
