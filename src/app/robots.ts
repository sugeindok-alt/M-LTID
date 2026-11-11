import type { MetadataRoute } from 'next';
import { publicUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/kokebok',
        '/boker/',
        '/mi-veke',
        '/favorittar',
        '/handleliste',
        '/profil',
        '/logg-inn',
        '/registrer',
        '/gloymt-passord',
        '/gløymt-passord',
        '/nytt-passord',
        '/stadfest-epost',
        '/konto/',
      ],
    },
    sitemap: publicUrl('/sitemap.xml'),
  };
}
