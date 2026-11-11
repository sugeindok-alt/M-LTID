// Canonical public address. Preview and local URLs must never enter shared metadata.
export const siteUrl = 'https://m-ltid.vercel.app';
export function publicUrl(path: string) {
  return new URL(path, siteUrl).href;
}
