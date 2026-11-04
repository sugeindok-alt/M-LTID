import { getDb } from '@/db';
import { requireSession, assertOrigin, body, respond } from '@/lib/http';
import { consumeLimit } from '@/lib/rate-limit';
import { applyDinnerWeek, fillWeek } from '@/lib/week-planner';

export async function POST(request: Request) {
  return respond(async () => {
    assertOrigin(request);
    const { user } = await requireSession(request);
    const db = getDb();
    await consumeLimit(db, 'mutation:' + user.id, 60, 60);
    return fillWeek(db, user.id, await body(request, applyDinnerWeek));
  });
}
