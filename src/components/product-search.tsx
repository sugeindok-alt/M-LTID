'use client';
import { useState, type FormEvent } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { Product } from '@/lib/products';
import { Photo } from './photo';
import { NovaBadge } from './shared';
export function ProductSearch({ onSelect }: { onSelect?: (product: Product) => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState('');
  async function search(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setProducts(null);
    try {
      const q = query.trim();
      const key = /^\d{8,14}$/.test(q) ? 'barcode' : 'q';
      const response = await fetch(`/api/products?${key}=${encodeURIComponent(q)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Produktsøket svarar ikkje.');
      setProducts(result.products);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="product-search">
      <form onSubmit={search}>
        <label htmlFor={onSelect ? 'recipe-product' : 'product-query'}>
          Søk etter eit produktnamn eller ein strekkode
        </label>
        <div className="search-field" style={{ marginTop: 8 }}>
          <Search size={18} />
          <input
            id={onSelect ? 'recipe-product' : 'product-query'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Til dømes produktnamn eller 13 siffer"
            minLength={2}
            maxLength={80}
            required
          />
          <button className="button" disabled={busy}>
            {busy ? 'Søkjer …' : 'Søk'}
          </button>
        </div>
      </form>
      <p className="source-note">
        Trykk Søk for å hente data. Strekkoden gir eit meir presist treff. Namnesøk kan gi andre
        produkt.
      </p>
      {error && (
        <div className="form-message error" role="alert" style={{ marginTop: 15 }}>
          {error} Du kan prøve søket igjen.
        </div>
      )}
      <div aria-live="polite">
        {products?.length === 0 && (
          <p className="notice">Ingen produkt vart funne. Kontroller namnet eller strekkoden.</p>
        )}
        {products && products.length > 0 && (
          <div className="product-results">
            {products.map((product) => (
              <article key={product.code} className="product-card">
                {product.image && (
                  <div className="product-image">
                    <Photo src={product.image} alt={product.name} contain sizes="70px" />
                  </div>
                )}
                <div>
                  <h3>{product.name}</h3>
                  <p>
                    {product.brands} · {product.code}
                  </p>
                  <NovaBadge group={product.nova} />
                  <p style={{ marginTop: 9 }}>
                    Klassifisering registrert i Open Food Facts.
                    <br />
                    Ikkje uavhengig verifisert av MÅLTID.
                  </p>
                  <a className="text-link" href={product.url} target="_blank" rel="noreferrer">
                    Sjå produktkjelda <ArrowUpRight size={13} />
                  </a>
                  {onSelect && (
                    <div>
                      <button
                        className="button secondary small"
                        disabled={!!selecting}
                        onClick={async () => {
                          setSelecting(product.code);
                          try {
                            await onSelect(product);
                          } finally {
                            setSelecting('');
                          }
                        }}
                      >
                        {selecting === product.code ? 'Lagrar …' : 'Dette er produktet eg brukar'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <p className="source-note">
        Produktdata:{' '}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
          Open Food Facts
        </a>{' '}
        · Database: ODbL · Innhald: DbCL · Produktfoto: CC BY-SA. Manglande NOVA betyr «ukjent».
        Data kan vere ufullstendige.
      </p>
    </div>
  );
}
