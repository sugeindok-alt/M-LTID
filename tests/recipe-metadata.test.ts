import { expect, it } from 'vitest';
import { catalogSnapshot } from '@/data/catalog';
import { recipeMetadata, recipeStructuredData, serializeJsonLd } from '@/lib/recipe-metadata';
import { publicSitemap } from '@/lib/public-sitemap';
import robots from '@/app/robots';

const salmon = catalogSnapshot.find((r) => r.id === 'nn-laks-med-ris')!;
it('describes the actual public catalogue without inventing nutrition or ratings', () => {
  for (const recipe of catalogSnapshot) {
    const data = recipeStructuredData(recipe);
    expect(data.name).toBe(recipe.title);
    expect(data.recipeInstructions.map((s) => s.text)).toEqual(recipe.steps);
    expect(data.recipeInstructions.map((s) => s.position)).toEqual(
      recipe.steps.map((_, i) => i + 1),
    );
    expect(data.recipeIngredient).toHaveLength(recipe.ingredients.length);
    expect(data.image?.[0]).toMatch(/^https:\/\/m-ltid\.vercel\.app\/images\//);
    expect(data).not.toHaveProperty('nutrition');
    expect(data).not.toHaveProperty('aggregateRating');
  }
  const incomplete = recipeStructuredData({
    ...salmon,
    minutes: undefined,
    servings: undefined,
    image: '',
  });
  expect(incomplete).not.toHaveProperty('totalTime');
  expect(incomplete).not.toHaveProperty('recipeYield');
  expect(incomplete).not.toHaveProperty('image');
});

it('keeps recipe text intact without allowing a script closing tag', () => {
  const title = '</script><script>alert("test")</script>';
  const data = recipeStructuredData({ ...salmon, title });
  const html = serializeJsonLd(data);
  expect(html).not.toContain('<');
  expect(JSON.parse(html).name).toBe(title);
});

it('shares the recipe image and its canonical public URL', () => {
  const metadata = recipeMetadata(salmon);
  expect(metadata.alternates?.canonical).toBe('https://m-ltid.vercel.app/oppskrifter/' + salmon.id);
  expect(metadata.openGraph).toMatchObject({
    title: salmon.title,
    description: salmon.description,
    images: [{ url: 'https://m-ltid.vercel.app' + salmon.image }],
  });
});

it('only lists public routes and excludes archived and personal recipes', () => {
  const privateRecipe = { ...salmon, id: '5d76bf88-969f-4e5d-8399-616051729154', title: 'Privat' };
  const sitemap = publicSitemap([...catalogSnapshot, salmon, privateRecipe]);
  const urls = sitemap.map((entry) => entry.url);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.filter((url) => url.includes('/oppskrifter/'))).toHaveLength(29);
  expect(urls.some((url) => url.includes(privateRecipe.id))).toBe(false);
  expect(
    urls.some((url) =>
      /\/(kokebok|boker|mi-veke|handleliste|profil|favorittar|api)(\/|$)/.test(url),
    ),
  ).toBe(false);
  expect(urls).not.toContain('https://m-ltid.vercel.app/oppskrifter/nn-laks');
  expect(robots().rules).toMatchObject({
    disallow: expect.arrayContaining(['/kokebok', '/api/', '/boker/']),
  });
});
