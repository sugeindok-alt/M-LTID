'use client';
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(resource: string, data?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(
    `/api/library/${resource}`,
    data === undefined
      ? { cache: 'no-store' }
      : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
  );
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.error || 'Noko gjekk gale. Prøv igjen.', response.status);
  return result;
}
