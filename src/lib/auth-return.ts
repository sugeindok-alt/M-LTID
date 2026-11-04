const localOrigin = 'https://maltid.invalid';
export function safeReturnPath(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)
  )
    return '/profil';
  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin || url.pathname.startsWith('//')) return '/profil';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/profil';
  }
}
export function withReturnPath(path: string, next: string) {
  const safe = safeReturnPath(next);
  return safe === '/profil' ? path : path + '?next=' + encodeURIComponent(safe);
}
