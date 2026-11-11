import type { Metadata } from 'next';
import Link from 'next/link';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-serif-display/latin-400.css';
import '@fontsource/dm-serif-display/latin-400-italic.css';
import './globals.css';
import './editorial.css';
import './design.css';
import './motion.css';
import { Header } from '@/components/header';
import { Providers } from '@/components/providers';
import { authConfigured } from '@/lib/auth';
export const metadata: Metadata = {
  title: { default: 'MÅLTID — God mat. Kvar dag.', template: '%s | MÅLTID' },
  description:
    'Norske kvardagsmiddagar, kjende råvarer og matglede for heile hushaldet. Finn middag etter tid, ingrediensar og smak.',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nn" suppressHydrationWarning>
      <body>
        <Providers>
          <a href="#hovudinnhald" className="skip-link">
            Hopp til innhald
          </a>
          <Header accountsReady={authConfigured()} />
          <main id="hovudinnhald">{children}</main>
          <footer className="footer">
            <div className="container footer-top">
              <div className="footer-brand">
                <Link href="/" className="wordmark">
                  MÅLTID<span>.</span>
                </Link>
                <p>Matglede byrjar med nysgjerrigheit. Norske kvardagsmiddagar for heile hushaldet.</p>
              </div>
              <nav aria-label="Botnmeny" className="footer-nav">
                <div>
                  <p className="eyebrow">Finn mat</p>
                  <Link href="/oppskrifter">Finn noko godt</Link>
                  <Link href="/middagsveker">Middagsveker</Link>
                  <Link href="/ingrediensar">Utforsk råvarene</Link>
                </div>
                <div>
                  <p className="eyebrow">Mine sider</p>
                  <Link href="/mi-veke">Mi veke</Link>
                  <Link href="/kokebok">Mi kokebok</Link>
                  <Link href="/handleliste">Handleliste</Link>
                </div>
                <div>
                  <p className="eyebrow">Om MÅLTID</p>
                  <Link href="/om-maten">Om maten</Link>
                  <Link href="/om-innhaldet">Om innhaldet</Link>
                  <Link href="/personvern">Personvern</Link>
                </div>
              </nav>
            </div>
            <div className="container footer-bottom">
              <span>Laga for gode kvardagar.</span>
              <span>
                <Link href="/om-innhaldet">
                  Oppskrifter: MÅLTID · KI-genererte matillustrasjonar
                </Link>{' '}
                · Produktdata:{' '}
                <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
                  Open Food Facts
                </a>
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
