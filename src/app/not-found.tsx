import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container page-shell empty-state">
      <p className="eyebrow">404 · IKKJE PÅ MENYEN</p>
      <h1>Denne sida fann vi ikkje.</h1>
      <p>Men noko godt ventar like rundt hjørnet.</p>
      <Link href="/oppskrifter" className="button">
        Utforsk oppskrifter
      </Link>
    </div>
  );
}
