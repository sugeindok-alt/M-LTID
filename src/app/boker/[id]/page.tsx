import { notFound } from 'next/navigation';
import { eq, isNotNull, and } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { namedBooks } from '@/db/schema';
import { SharedBook } from '@/components/shared-book';
import '../../kokebok/kokebok.css';
import '../../kokebok/deling.css';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Delt kokebok',
  robots: { index: false, follow: false, noarchive: true },
};
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [visible] = await getDb()
    .select({ id: namedBooks.id })
    .from(namedBooks)
    .where(and(eq(namedBooks.id, id), isNotNull(namedBooks.publishedAt)));
  if (!visible) notFound();
  // The shared text is fetched afresh; it never goes into a Next router prefetch or a link preview.
  return <SharedBook id={id} />;
}
