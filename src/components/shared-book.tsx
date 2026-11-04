'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { PublicBook } from '@/lib/book-sharing';
export function SharedBook({ id }: { id: string }) {
  const [book, setBook] = useState<PublicBook | null>(null),
    [message, setMessage] = useState('Hentar kokeboka …');
  useEffect(() => {
    let controller: AbortController | undefined;
    async function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      if (document.visibilityState === 'hidden') {
        setBook(null);
        return;
      }
      try {
        const response = await fetch('/api/delte-boker/' + id, {
          cache: 'no-store',
          signal: request.signal,
        });
        if (!response.ok) {
          setBook(null);
          setMessage(
            response.status === 404
              ? 'Denne kokeboka er ikkje offentleg.'
              : 'Klarte ikkje å hente kokeboka.',
          );
          return;
        }
        const data: PublicBook = await response.json();
        if (!request.signal.aborted) setBook(data);
      } catch {
        if (!request.signal.aborted) {
          setBook(null);
          setMessage('Klarte ikkje å hente kokeboka.');
        }
      }
    }
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [id]);
  return (
    <div className="container page-shell book-page">
      {book ? (
        <>
          <div className="page-intro">
            <p className="eyebrow">OFFENTLEG KOKEBOK</p>
            <h1>{book.title}</h1>
            <p>{book.description}</p>
          </div>
          <nav aria-label="Oppskrifter i boka">
            <ul className="shared-index">
              {book.recipes.map((r) => (
                <li key={r.id}>
                  <a className="text-link" href={'#rett-' + r.id}>
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {book.recipes.map((r) => (
            <article key={r.id} id={'rett-' + r.id} className="shared-recipe">
              <h2>{r.title}</h2>
              <p>
                {r.servings} {r.servings === 1 ? 'porsjon' : 'porsjonar'}
              </p>
              {r.photo && (
                <Image
                  unoptimized
                  width={512}
                  height={384}
                  src={'/api/delte-boker/' + id + '/bilete/' + r.id}
                  alt={r.title}
                />
              )}
              <h3>Ingrediensar</h3>
              <ul>
                {r.ingredients.map((i, n) => (
                  <li key={n}>
                    {i.measure} {i.name}
                  </li>
                ))}
              </ul>
              <h3>Slik gjer du</h3>
              <ol>
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </article>
          ))}
        </>
      ) : (
        <p role="status">{message}</p>
      )}
    </div>
  );
}
