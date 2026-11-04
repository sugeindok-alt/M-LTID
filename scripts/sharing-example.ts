// Dedicated editorial fixture. No login credentials or personal recipes are used.
// node --import tsx --import ./scripts/server-runtime.mjs scripts/sharing-example.ts <private env file> prepare|publish|withdraw
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { eq } from 'drizzle-orm';
import { createDatabase } from '../src/db';
import { user, cookbookRecipes, namedBooks } from '../src/db/schema';
import { catalogSnapshot } from '../src/data/catalog';
import { changeBook } from '../src/lib/book-sharing';
const [envFile, operation] = process.argv.slice(2);
if (!envFile || !['prepare', 'publish', 'withdraw'].includes(operation))
  throw new Error('Oppgi miljøfil og handling.');
const db = createDatabase(parse(readFileSync(envFile)).DATABASE_URL);
const owner = 'maltid-public-example-editor',
  id = '3d6056f5-a68c-46c9-b408-1b9fc966f75c';
const entries = [
  { source: 'nn-laks', id: '61d9b91f-a09b-46f4-8713-6d8170fcabe3', photo: true },
  { source: 'nn-potetsuppe', id: 'e04ddfa3-0087-4246-8cef-09eb8fe18cb0', photo: false },
];
try {
  if (operation === 'prepare') {
    await db.transaction(async (tx) => {
      await tx
        .insert(user)
        .values({
          id: owner,
          name: 'MÅLTID – dømebok',
          email: 'public-demo@example.invalid',
          emailVerified: false,
        })
        .onConflictDoNothing();
      const [editor] = await tx.select({ email: user.email }).from(user).where(eq(user.id, owner));
      if (editor?.email !== 'public-demo@example.invalid') throw new Error('Uventa dømeeigar.');
      for (const entry of entries) {
        const r = catalogSnapshot.find((v) => v.id === entry.source)!;
        if (!r?.image.startsWith('/images/middagar/')) throw new Error('Ugyldig dømekjelde.');
        await tx
          .insert(cookbookRecipes)
          .values({
            id: entry.id,
            userId: owner,
            originalId: r.id,
            title: r.title,
            servings: r.servings || 4,
            ingredients: r.ingredients,
            steps: r.steps,
            image: entry.photo ? readFileSync('public' + r.image).toString('base64') : null,
          })
          .onConflictDoNothing();
      }
      await tx
        .insert(namedBooks)
        .values({
          id,
          userId: owner,
          title: 'To middagar frå MÅLTID',
          description:
            'Ei offentleg dømebok til å dele. Laksebiletet er ei KI-generert serveringsillustrasjon frå MÅLTID. Oppskriftene er redaksjonelt gjennomgåtte.',
          recipeIds: entries.map((e) => e.id),
        })
        .onConflictDoNothing();
    });
  } else if (operation === 'withdraw') {
    await changeBook(db, owner, { action: 'withdraw', id });
  } else {
    const selections = entries.map(({ id, photo }) => ({ id, photo }));
    const preview = await changeBook(db, owner, { action: 'preview', id, selections });
    if (
      !('approval' in preview) ||
      preview.recipes.length !== 2 ||
      preview.title !== 'To middagar frå MÅLTID'
    )
      throw new Error('Uventa førehandsvising.');
    await changeBook(db, owner, { action: 'publish', id, selections, approval: preview.approval });
  }
  console.log(operation + ' /boker/' + id);
} catch (e) {
  console.error('Dømeboka kunne ikkje oppdaterast.', e instanceof Error ? e.name : '');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
