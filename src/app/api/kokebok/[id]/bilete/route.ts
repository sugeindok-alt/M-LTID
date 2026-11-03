import { getDb } from '@/db';
import { requireSession, respond } from '@/lib/http';
import { cookbookImage } from '@/lib/cookbook';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { user } = await requireSession(request);
    return cookbookImage(getDb(), user.id, (await context.params).id);
  });
}
