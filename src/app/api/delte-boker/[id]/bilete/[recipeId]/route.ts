import { getDb } from '@/db';
import { publicPhoto } from '@/lib/book-sharing';
import { respond } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; recipeId: string }> },
) {
  return respond(async () => {
    const { id, recipeId } = await params;
    return publicPhoto(getDb(), id, recipeId);
  });
}
