import 'server-only';
import { ZodError, z } from 'zod';
import { getAuth } from './auth';
import { AppError } from './errors';
export async function requireSession(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new AppError('Logg inn for å bruke denne funksjonen.', 401);
  if (!session.user.emailVerified) throw new AppError('Stadfest e-postadressa først.', 403);
  return session;
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const configured = process.env.BETTER_AUTH_URL;
  const allowed = configured
    ? [new URL(configured).origin]
    : process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : [];
  if (!origin || !allowed.includes(origin))
    throw new AppError('Ugyldig opphav for førespurnaden.', 403);
}
export async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (Number(request.headers.get('content-length')) > 16000)
    throw new AppError('Førespurnaden er for stor.', 413);
  const content = await request.text();
  if (content.length > 16000) throw new AppError('Førespurnaden er for stor.', 413);
  try {
    return schema.parse(JSON.parse(content));
  } catch {
    throw new AppError('Kontroller felta og prøv igjen.', 400);
  }
}
export async function respond(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof AppError ? error.status : error instanceof ZodError ? 400 : 500;
    const message =
      error instanceof AppError
        ? error.message
        : status === 400
          ? 'Ugyldige felt.'
          : 'Noko gjekk gale. Prøv igjen om litt.';
    if (status === 500)
      console.error('Request failed:', error instanceof Error ? error.name : 'UnknownError');
    return Response.json(
      { error: message },
      {
        status,
        headers: {
          'Cache-Control': 'private, no-store',
          ...(status === 429 ? { 'Retry-After': '60' } : {}),
        },
      },
    );
  }
}
