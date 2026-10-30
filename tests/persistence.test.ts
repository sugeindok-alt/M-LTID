import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { testDatabase } from './database';
import { user, emailRecords } from '@/db/schema';
import { createLibrary } from '@/lib/library';
import { normalizeRecipe } from '@/lib/recipes';
import { createMailer, escapeHtml, linkMail } from '@/lib/email';
import { consumeLimit } from '@/lib/rate-limit';
import { assertOrigin, body, respond } from '@/lib/http';
import { z } from 'zod';
import { rawMeal } from './fixtures';
let database: Awaited<ReturnType<typeof testDatabase>>;
let library: ReturnType<typeof createLibrary>;
beforeAll(async () => {
  database = await testDatabase();
  library = createLibrary(database.db);
  await database.db.insert(user).values([
    { id: 'alice', name: 'Alice', email: 'alice@example.test', emailVerified: true },
    { id: 'bob', name: 'Bob', email: 'bob@example.test', emailVerified: true },
  ]);
});
afterAll(async () => {
  await database?.client.close();
});
describe('real PostgreSQL migrations, persistence and ownership', () => {
  it('saves favorites once, retrieves them from a fresh service, isolates users', async () => {
    const recipe = normalizeRecipe(rawMeal);
    await library.saveFavorite('alice', recipe);
    await library.saveFavorite('alice', recipe);
    expect(await createLibrary(database.db).favorites('alice')).toHaveLength(1);
    expect(await library.favorites('bob')).toEqual([]);
    await library.removeFavorite('bob', recipe.id);
    expect(await library.favorites('alice')).toHaveLength(1);
    expect((await library.profile('alice')).favoriteCount).toBe(1);
  });
  it('merges only compatible quantities and persists idempotent recipe imports', async () => {
    const key = randomUUID();
    const ingredients = [
      { name: 'Sugar', measure: '2 tbsp' },
      { name: 'Sugar', measure: '1 tbsp' },
      { name: 'Sugar', measure: '100 g' },
      { name: 'Salt', measure: 'to taste' },
    ];
    await library.addItems('alice', ingredients, key);
    await library.addItems('alice', ingredients, key);
    const rows = await createLibrary(database.db).shopping('alice');
    expect(rows).toHaveLength(3);
    expect(rows.find((i) => i.unit === 'tbsp')?.amount).toBe(3);
    expect(rows.find((i) => i.unit === 'g')?.amount).toBe(100);
    expect(rows.find((i) => i.name === 'Salt')?.measure).toBe('to taste');
    expect(await library.shopping('bob')).toEqual([]);
  });
  it('rejects cross-user edits and scopes deletion to the owner', async () => {
    const [item] = await library.shopping('alice');
    await expect(library.updateItem('bob', item.id, { purchased: true })).rejects.toMatchObject({
      status: 404,
    });
    await library.removeItem('bob', item.id);
    expect((await library.shopping('alice')).some((i) => i.id === item.id)).toBe(true);
  });
  it('persists edits and clears purchased items only for the current user', async () => {
    const item = (await library.shopping('alice')).find((i) => i.unit === 'tbsp')!;
    await library.updateItem('alice', item.id, { measure: '4 cups', purchased: true });
    const stored = (await createLibrary(database.db).shopping('alice')).find(
      (i) => i.id === item.id,
    )!;
    expect(stored.amount).toBe(4);
    expect(stored.unit).toBe('cup');
    expect(stored.purchased).toBe(true);
    await library.clearPurchased('bob');
    expect((await library.shopping('alice')).find((i) => i.id === item.id)).toBeDefined();
    await library.clearPurchased('alice');
    expect((await library.shopping('alice')).find((i) => i.id === item.id)).toBeUndefined();
  });
  it('handles simultaneous duplicate imports atomically', async () => {
    const key = randomUUID();
    await Promise.all([
      library.addItems('bob', [{ name: 'Rice', measure: '2 cups' }], key),
      library.addItems('bob', [{ name: 'Rice', measure: '2 cups' }], key),
    ]);
    expect((await library.shopping('bob')).find((i) => i.name === 'Rice')?.amount).toBe(2);
  });
  it('persists preferences and product references separately by user', async () => {
    await library.updateProfile('alice', {
      name: 'Alice Updated',
      theme: 'nordic',
      favoriteCategory: 'Pasta',
    });
    expect((await library.profile('alice')).preferences.theme).toBe('nordic');
    expect((await library.profile('bob')).preferences.theme).toBe('olive');
    await library.linkProduct('alice', '52771', 'Tomatoes', '3017620422003');
    expect(await library.references('alice', '52771')).toHaveLength(1);
    expect(await library.references('bob', '52771')).toEqual([]);
  });
  it('enforces rate limits across fresh service instances and concurrent calls', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => consumeLimit(database.db, 'test:rate', 3, 60)),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(5);
  });
});
describe('email delivery evidence', () => {
  it('records acceptance and suppresses duplicate delivery', async () => {
    let count = 0;
    const send = createMailer(database.db, async () => ({ id: `mail-${++count}` }));
    const mail = linkMail(
      'alice@example.test',
      '<Alice>',
      'https://maltid.test/verify?token=test',
      'verification',
      'alice',
    );
    await send(mail);
    await send(mail);
    expect(count).toBe(1);
    expect(mail.html).toContain('&lt;Alice&gt;');
    expect(escapeHtml('"<script>')).toBe('&quot;&lt;script&gt;');
    const [record] = await database.db
      .select()
      .from(emailRecords)
      .where(eq(emailRecords.idempotencyKey, mail.key));
    expect(record.status).toBe('accepted');
  });
  it('propagates a provider rejection and records failed delivery', async () => {
    const send = createMailer(database.db, async () => {
      throw new Error('provider rejected');
    });
    const mail = linkMail(
      'alice@example.test',
      'Alice',
      'https://maltid.test/reset?token=rejected',
      'reset',
      'alice',
    );
    await expect(send(mail)).rejects.toThrow('provider rejected');
    const [record] = await database.db
      .select()
      .from(emailRecords)
      .where(eq(emailRecords.idempotencyKey, mail.key));
    expect(record.status).toBe('failed');
  });
  it('labels local transport output as local, never as sent', async () => {
    const send = createMailer(database.db, async () => ({ id: 'file-preview', local: true }));
    const mail = linkMail(
      'bob@example.test',
      'Bob',
      'https://maltid.test/verify?token=local',
      'verification',
      'bob',
    );
    expect((await send(mail)).local).toBe(true);
    expect((await send(mail)).local).toBe(true);
  });
});
describe('HTTP mutation safeguards', () => {
  it('rejects cross-site and missing-origin mutations', () => {
    expect(() =>
      assertOrigin(
        new Request('http://localhost:3000/api/library/favorites', {
          headers: { origin: 'https://evil.example' },
        }),
      ),
    ).toThrow();
    expect(() =>
      assertOrigin(new Request('http://localhost:3000/api/library/favorites')),
    ).toThrow();
    expect(() =>
      assertOrigin(
        new Request('http://localhost:3000/api/library/favorites', {
          headers: { origin: 'http://localhost:3000' },
        }),
      ),
    ).not.toThrow();
  });
  it('rejects oversized and malformed input and does not leak internal errors', async () => {
    await expect(
      body(new Request('http://localhost', { method: 'POST', body: '{bad' }), z.object({})),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      body(
        new Request('http://localhost', { method: 'POST', body: 'x'.repeat(17000) }),
        z.object({}),
      ),
    ).rejects.toMatchObject({ status: 413 });
    const response = await respond(async () => {
      throw new Error('postgres://secret:password');
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('secret');
  });
});
