import { getDb } from '@/db';
import { publicBook } from '@/lib/book-sharing';
import { respond } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return respond(async () => publicBook(getDb(), (await params).id));
}
