import { z } from 'zod';
import { lookupProducts } from '@/lib/product-service';
import { barcodeSchema } from '@/lib/products';
import { respond } from '@/lib/http';
export async function GET(request: Request) {
  return respond(async () => {
    const params = new URL(request.url).searchParams;
    const barcode = params.get('barcode');
    const query = barcode
      ? barcodeSchema.parse(barcode)
      : z.string().trim().min(2).max(80).parse(params.get('q'));
    return { products: await lookupProducts(query, Boolean(barcode)) };
  });
}
