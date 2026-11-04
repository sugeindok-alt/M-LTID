import { getDb } from '@/db';
import { respond, body, requireSession, assertOrigin } from '@/lib/http';
import { bookAction, ownerBook, listBooks, changeBook } from '@/lib/book-sharing';
import { consumeLimit } from '@/lib/rate-limit';
export async function GET(request: Request) {
  return respond(async () => {
    const { user } = await requireSession(request),
      db = getDb(),
      id = new URL(request.url).searchParams.get('id');
    return id === null ? listBooks(db, user.id) : ownerBook(db, user.id, id);
  });
}
export async function POST(request: Request) {
  return respond(async () => {
    assertOrigin(request);
    const { user } = await requireSession(request),
      db = getDb();
    await consumeLimit(db, 'book-edit:' + user.id, 60, 60);
    return changeBook(db, user.id, await body(request, bookAction, 60000));
  });
}
