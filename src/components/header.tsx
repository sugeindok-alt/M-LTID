'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Menu, X, ArrowUpRight, ShoppingBag, UserRound } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
const links = [
  ['/', 'Heim'],
  ['/oppskrifter', 'Middagar'],
  ['/ingrediensar', 'Ingrediensar'],
  ['/mi-veke', 'Mi veke'],
  ['/kokebok', 'Mi kokebok'],
  ['/favorittar', 'Favorittar'],
];
const subscribe = () => () => {};
export function Header({ accountsReady }: { accountsReady: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  function current(href: string) {
    if (pathname === href) return 'page';
    if (href !== '/' && pathname.startsWith(href + '/')) return 'location';
  }
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <header
      className="header"
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="container header-inner">
        <Link href="/" className="wordmark" aria-label="MÅLTID – heim">
          MÅLTID<span>.</span>
        </Link>
        <nav className="desktop-nav" aria-label="Hovudmeny">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={current(href)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/handleliste" className="icon-button bag-link" aria-label="Handleliste">
            <ShoppingBag size={20} />
          </Link>
          {accountsReady ? (
            <AccountLink />
          ) : (
            <Link className="login-link" href="/logg-inn">
              Min konto <ArrowUpRight size={16} />
            </Link>
          )}
          <button
            ref={toggle}
            className="icon-button mobile-toggle"
            disabled={!hydrated}
            aria-label={open ? 'Lukk meny' : 'Opne meny'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobilmeny">
          {[...links, ['/profil', 'Min konto'], ['/handleliste', 'Handleliste']].map(
            ([href, label]) => (
              <Link
                href={href}
                key={href}
                aria-current={current(href)}
                onClick={() => setOpen(false)}
              >
                {label}
                <ArrowUpRight size={18} />
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
function AccountLink() {
  const { data } = authClient.useSession();
  return (
    <Link className="login-link" href={data ? '/profil' : '/logg-inn'}>
      {data ? (
        <>
          <UserRound size={17} /> Min konto
        </>
      ) : (
        <>
          Min konto <ArrowUpRight size={16} />
        </>
      )}
    </Link>
  );
}
