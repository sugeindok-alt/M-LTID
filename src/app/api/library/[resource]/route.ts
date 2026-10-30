import { z } from 'zod';
import { getDb } from '@/db';
import { requireSession, assertOrigin, body, respond } from '@/lib/http';
import { createLibrary } from '@/lib/library';
import { mealApi } from '@/lib/meal-api';
import { mealId } from '@/lib/recipes';
import { AppError } from '@/lib/errors';
import { createMailer, recipeMail } from '@/lib/email';
import { consumeLimit } from '@/lib/rate-limit';
import { lookupProducts } from '@/lib/product-service';
import { barcodeSchema } from '@/lib/products';
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: Request, context: Context) {
  return respond(async () => {
    const { user } = await requireSession(request);
    const library = createLibrary(getDb());
    const { resource } = await context.params;
    if (resource === 'favorites') return { recipes: await library.favorites(user.id) };
    if (resource === 'shopping') return { items: await library.shopping(user.id) };
    if (resource === 'profile')
      return { user: { name: user.name, email: user.email }, ...(await library.profile(user.id)) };
    if (resource === 'products') {
      const id = mealId.parse(new URL(request.url).searchParams.get('recipeId'));
      const references = await library.references(user.id, id);
      const products = await Promise.all(
        references.map(async (reference) => ({
          ...reference,
          product: (await lookupProducts(reference.barcode, true).catch(() => []))[0] ?? null,
        })),
      );
      return { products };
    }
    throw new AppError('Fann ikkje ressursen.', 404);
  });
}
export async function POST(request: Request, context: Context) {
  return respond(async () => {
    assertOrigin(request);
    const { user } = await requireSession(request);
    const db = getDb();
    const library = createLibrary(db);
    const { resource } = await context.params;
    await consumeLimit(db, `mutation:${user.id}`, 60, 60);
    if (resource === 'favorites') {
      const input = await body(request, z.object({ recipeId: mealId, saved: z.boolean() }));
      if (input.saved) {
        const recipe = await mealApi.detail(input.recipeId);
        if (!recipe) throw new AppError('Fann ikkje oppskrifta.', 404);
        await library.saveFavorite(user.id, recipe);
      } else await library.removeFavorite(user.id, input.recipeId);
      return { saved: input.saved };
    }
    if (resource === 'shopping') {
      const input = await body(
        request,
        z.object({
          requestId: z.uuid(),
          recipeId: mealId.optional(),
          name: z.string().trim().min(1).max(100).optional(),
          measure: z.string().trim().max(80).default(''),
        }),
      );
      if (input.recipeId) {
        const recipe = await mealApi.detail(input.recipeId);
        if (!recipe) throw new AppError('Fann ikkje oppskrifta.', 404);
        await library.addItems(user.id, recipe.ingredients, input.requestId, recipe.id);
      } else if (input.name)
        await library.addItems(
          user.id,
          [{ name: input.name, measure: input.measure }],
          input.requestId,
        );
      else throw new AppError('Oppgi ei vare eller ei oppskrift.');
      return { ok: true };
    }
    if (resource === 'profile') {
      const input = await body(
        request,
        z.object({
          name: z.string().trim().min(2).max(80),
          theme: z.enum(['olive', 'tomato', 'nordic', 'dark', 'basil']),
          favoriteCategory: z.string().max(40),
        }),
      );
      await library.updateProfile(user.id, input);
      return { ok: true };
    }
    if (resource === 'email') {
      const input = await body(request, z.object({ recipeId: mealId }));
      await consumeLimit(db, `recipe-email:${user.id}`, 5, 3600);
      const recipe = await mealApi.detail(input.recipeId);
      if (!recipe) throw new AppError('Fann ikkje oppskrifta.', 404);
      const key = `recipe:${user.id}:${recipe.id}:${Math.floor(Date.now() / 300000)}`;
      const result = await createMailer(db)(
        recipeMail(user.email, recipe, process.env.BETTER_AUTH_URL!, key, user.id),
      );
      return {
        message: result.local
          ? 'E-posten er lagra lokalt for testing. Han er ikkje send.'
          : 'E-postleverandøren har teke imot oppskrifta for sending.',
      };
    }
    if (resource === 'products') {
      const input = await body(
        request,
        z.object({
          recipeId: mealId,
          ingredient: z.string().min(1).max(100),
          barcode: barcodeSchema,
        }),
      );
      const recipe = await mealApi.detail(input.recipeId);
      if (!recipe?.ingredients.some((i) => i.name === input.ingredient))
        throw new AppError('Ingrediensen høyrer ikkje til oppskrifta.');
      const product = (await lookupProducts(input.barcode, true))[0];
      if (!product) throw new AppError('Produktet vart ikkje funne.', 404);
      await library.linkProduct(user.id, input.recipeId, input.ingredient, input.barcode);
      return { product };
    }
    throw new AppError('Fann ikkje ressursen.', 404);
  });
}
export async function PATCH(request: Request, context: Context) {
  return respond(async () => {
    assertOrigin(request);
    const { user } = await requireSession(request);
    if ((await context.params).resource !== 'shopping') throw new AppError('Ugyldig ressurs.', 404);
    const input = await body(
      request,
      z.object({
        id: z.uuid(),
        purchased: z.boolean().optional(),
        measure: z.string().trim().max(80).optional(),
      }),
    );
    return { item: await createLibrary(getDb()).updateItem(user.id, input.id, input) };
  });
}
export async function DELETE(request: Request, context: Context) {
  return respond(async () => {
    assertOrigin(request);
    const { user } = await requireSession(request);
    if ((await context.params).resource !== 'shopping') throw new AppError('Ugyldig ressurs.', 404);
    const input = await body(
      request,
      z.object({ id: z.uuid().optional(), purchased: z.literal(true).optional() }),
    );
    const library = createLibrary(getDb());
    if (input.id) await library.removeItem(user.id, input.id);
    else if (input.purchased) await library.clearPurchased(user.id);
    else throw new AppError('Vel ei vare.');
    return { ok: true };
  });
}
