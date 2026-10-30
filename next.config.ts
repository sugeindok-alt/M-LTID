import type { NextConfig } from 'next';
const config: NextConfig = {
  // Separate outputs let local preview and production compilation coexist.
  distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next-production',
  experimental: { cpus: 1, webpackBuildWorker: false },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.themealdb.com', pathname: '/images/**' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org', pathname: '/images/**' },
    ],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.themealdb.com https://images.openfoodfacts.org; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
export default config;
