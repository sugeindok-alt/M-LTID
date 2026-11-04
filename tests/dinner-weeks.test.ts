import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { testDatabase } from './database';
import { catalogSnapshot } from '@/data/catalog';
import { dinnerWeeks } from '@/data/dinner-weeks';
import { user, recipeCatalog } from '@/db/schema';
import { fillWeek, changeDay, addWeek, readWeek } from '@/lib/week-planner';
import { createLibrary } from '@/lib/library';
import { safeReturnPath, withReturnPath } from '@/lib/auth-return';

it('publishes four complete five-day menus; every quick recipe takes at most 30 minutes', () => {
  expect(dinnerWeeks).toHaveLength(4);
  for (const menu of dinnerWeeks) {
    expect(new Set(menu.days.map((d) => d.recipeId)).size).toBe(5);
    for (const day of menu.days) {
      const recipe = catalogSnapshot.find((r) => r.id === day.recipeId);
      expect(recipe?.language).toBe('nn');
      expect(recipe?.archived).not.toBe(true);
      if (menu.slug === 'raske-kvardagar') expect(recipe?.minutes).toBeLessThanOrEqual(30);
    }
  }
});
it('preserves local return paths and rejects paths that normalize to another origin', () => {
  const path = '/mi-veke?veke=2026-11-02&mal=raske-kvardagar';
  expect(safeReturnPath(path)).toBe(path);
  expect(withReturnPath('/registrer', path)).toBe('/registrer?next=' + encodeURIComponent(path));
  for (const invalid of [
    '//bad.example',
    '/\\bad.example',
    '/ok/..//bad.example',
    '/\n/bad.example',
    undefined,
  ]) {
    expect(safeReturnPath(invalid)).toBe('/profil');
  }
});
describe('week template and shopping imports', () => {
  let fixture: Awaited<ReturnType<typeof testDatabase>>;
  const week = '2026-11-02';
  beforeAll(async () => {
    fixture = await testDatabase();
    await fixture.db
      .insert(user)
      .values(
        ['a', 'b'].map((id) => ({
          id,
          name: 'Test ' + id,
          email: id + '@example.test',
          emailVerified: true,
        })),
      );
    await fixture.db
      .insert(recipeCatalog)
      .values(catalogSnapshot.map((data) => ({ id: data.id, data })));
  });
  afterAll(async () => {
    await fixture?.client.close();
  });
  it('preserves existing choices and weekends, retries safely and aggregates exactly 1.4 kg for one owner', async () => {
    const db = fixture.db;
    await changeDay(db, 'a', { week, day: 0, recipeId: 'nn-pytt-i-panne', servings: 4 });
    await changeDay(db, 'a', { week, day: 6, recipeId: 'nn-tomatsuppe', servings: 2 });
    await changeDay(db, 'b', { week, day: 1, recipeId: 'nn-laks', servings: 3 });
    const fill = { slug: 'raske-kvardagar', week, days: [0, 1, 2, 3, 4], servings: 2 };
    const [one, two] = await Promise.all([fillWeek(db, 'a', fill), fillWeek(db, 'a', fill)]);
    expect(one.count + two.count).toBe(4);
    const updated = await changeDay(db, 'a', { week, day: 2, recipeId: 'nn-torsk', servings: 4 });
    expect(updated.days).toHaveLength(6);
    expect(updated.days[0]).toMatchObject({ recipeId: 'nn-pytt-i-panne', servings: 4 });
    expect(updated.days.at(-1)).toMatchObject({ day: 6, recipeId: 'nn-tomatsuppe' });
    // 600 g from the fry-up plus 800 g from the cod, both four servings.
    expect(updated.items.find((i) => i.name === 'poteter')?.measure.replace(/\s/g, '')).toBe(
      '1400g',
    );
    const request = { week, version: updated.version };
    await Promise.all([addWeek(db, 'a', request), addWeek(db, 'a', request)]);
    expect(
      (await createLibrary(db).shopping('a')).filter((i) => i.name === 'poteter'),
    ).toMatchObject([{ amount: 1400, unit: 'g' }]);
    expect(await createLibrary(db).shopping('b')).toHaveLength(0);
    expect((await readWeek(db, 'b', week)).days).toMatchObject([
      { day: 1, recipeId: 'nn-laks', servings: 3 },
    ]);
  });
});
