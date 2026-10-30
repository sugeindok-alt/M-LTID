import Link from 'next/link';
export function PrivateNavigation({ current }: { current: string }) {
  return (
    <nav className="private-tabs" aria-label="Mine sider">
      {[
        ['/favorittar', 'Favorittar'],
        ['/handleliste', 'Handleliste'],
        ['/profil', 'Min konto'],
      ].map(([href, label]) => (
        <Link href={href} key={href} aria-current={current === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
