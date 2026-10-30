import { getAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { assertOrigin } from '@/lib/http';
async function handle(request: Request) {
  const started = Date.now();
  try {
    if (request.method === 'POST') {
      assertOrigin(request);
      if (
        Number(request.headers.get('content-length')) > 16000 ||
        (await request.clone().text()).length > 16000
      )
        throw new AppError('Førespurnaden er for stor.', 413);
    }
    const response = await getAuth().handler(request);
    if (
      /\/(sign-up\/email|request-password-reset|send-verification-email)$/.test(
        new URL(request.url).pathname,
      )
    ) {
      // Mail runs after the response. Also cover normal database/hash timing
      // differences between existing and unknown accounts with a fixed floor.
      const remaining = 1000 - (Date.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof AppError ? error.message : 'Kontoforespurnaden kunne ikkje fullførast.',
      },
      {
        status: error instanceof AppError ? error.status : 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const maxDuration = 30;
