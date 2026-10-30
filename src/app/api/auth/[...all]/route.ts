import { getAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { assertOrigin } from '@/lib/http';
async function handle(request: Request) {
  try {
    if (request.method === 'POST') assertOrigin(request);
    return await getAuth().handler(request);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof AppError ? error.message : 'Kontoforespurnaden kunne ikkje fullførast.',
      },
      { status: error instanceof AppError ? error.status : 503 },
    );
  }
}
export const GET = handle;
export const POST = handle;
