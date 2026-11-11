import type { Metadata } from 'next';
import type { Recipe } from './recipes';
import { publicUrl } from './site';

export function recipeMetadata(recipe: Recipe): Metadata {
  const url = publicUrl('/oppskrifter/' + recipe.id);
  const images = recipe.image
    ? [{ url: publicUrl(recipe.image), alt: recipe.imageAlt || recipe.title }]
    : [];
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      siteName: 'MÅLTID',
      locale: 'nn_NO',
      url,
      title: recipe.title,
      description: recipe.description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description: recipe.description,
      images,
    },
  };
}

export function recipeStructuredData(recipe: Recipe) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    url: publicUrl('/oppskrifter/' + recipe.id),
    inLanguage: 'nn-NO',
    ...(recipe.image ? { image: [publicUrl(recipe.image)] } : {}),
    ...(recipe.minutes && recipe.minutes > 0 ? { totalTime: `PT${recipe.minutes}M` } : {}),
    ...(recipe.servings && recipe.servings > 0
      ? { recipeYield: `${recipe.servings} ${recipe.servings === 1 ? 'porsjon' : 'porsjonar'}` }
      : {}),
    recipeCategory: recipe.category,
    recipeIngredient: recipe.ingredients.map(({ name, measure }) => `${measure} ${name}`.trim()),
    recipeInstructions: recipe.steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Steg ${index + 1}`,
      text,
    })),
  };
}

export function serializeJsonLd(value: unknown) {
  // A recipe title or step must not be able to close the HTML script element.
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
