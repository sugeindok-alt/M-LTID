'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Heart, Mail, ShoppingBag, Check, Info, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/client-api';
import { type Recipe, ingredientSlug } from '@/lib/recipes';
import { parseMeasure, scaleMeasure } from '@/lib/quantities';
import { useToast } from './providers';
import { ProductSearch } from './product-search';
import { NovaBadge } from './shared';
import type { Product } from '@/lib/products';
const subscribe = () => () => {};
export function RecipeActions({
  recipe,
  accountsReady,
}: {
  recipe: Recipe;
  accountsReady: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState('');
  const [loaded, setLoaded] = useState(!accountsReady);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const notify = useToast();
  useEffect(() => {
    let active = true;
    if (accountsReady)
      api<{ recipes: Recipe[] }>('favorites')
        .then((data) => {
          if (active) setSaved(data.recipes.some((r) => r.id === recipe.id));
        })
        .catch(() => {
          if (active)
            setLoadError('Favorittstatusen kunne ikkje lastast. Logg inn eller prøv igjen.');
        })
        .finally(() => {
          if (active) setLoaded(true);
        });
    return () => {
      active = false;
    };
  }, [accountsReady, recipe.id, attempt]);
  async function act(kind: 'favorite' | 'email') {
    setBusy(kind);
    try {
      if (kind === 'favorite') {
        await api('favorites', { recipeId: recipe.id, saved: !saved });
        setSaved(!saved);
        notify(
          saved
            ? 'Oppskrifta er fjerna frå favorittane.'
            : 'Oppskrifta er lagra i favorittane dine.',
        );
      } else {
        const result = await api<{ message: string }>('email', { recipeId: recipe.id });
        notify(result.message);
      }
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="detail-tools">
      <button
        className="button"
        onClick={() => act('favorite')}
        disabled={!!busy || !hydrated || !loaded || !!loadError}
        aria-pressed={saved}
      >
        <motion.span animate={{ scale: saved ? [1, 1.25, 1] : 1 }}>
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </motion.span>
        {!loaded
          ? 'Lastar favorittstatus …'
          : busy === 'favorite'
            ? 'Lagrar …'
            : saved
              ? 'Lagra i favorittar'
              : 'Lagre oppskrift'}
      </button>
      <button
        className="button secondary"
        onClick={() => act('email')}
        disabled={!!busy || !hydrated}
      >
        <Mail size={17} />
        {busy === 'email' ? 'Sender …' : 'Send til e-posten min'}
      </button>
      {loadError && (
        <div role="alert" className="form-message error">
          {loadError}{' '}
          <button
            className="text-link"
            onClick={() => {
              setLoadError('');
              setLoaded(false);
              setAttempt((value) => value + 1);
            }}
          >
            Prøv igjen
          </button>
        </div>
      )}
      <span className="source-note">
        Foto og oppskrift: TheMealDB · <Link href="/logg-inn">Logg inn for å lagre</Link>
      </span>
    </div>
  );
}
export function IngredientsPanel({ recipe }: { recipe: Recipe }) {
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const notify = useToast();
  const scalable =
    recipe.ingredients.length > 0 && recipe.ingredients.every((i) => parseMeasure(i.measure));
  async function add() {
    setBusy(true);
    try {
      await api('shopping', { recipeId: recipe.id, requestId });
      notify('Ingrediensane er lagra i handlelista.');
      setRequestId(crypto.randomUUID());
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="ingredient-panel">
      <p className="eyebrow">DETTE TRENG DU</p>
      <h2>Ingrediensar</h2>
      {scalable ? (
        <div className="scale-control">
          <label htmlFor="scale">Mengdefaktor</label>
          <select
            id="scale"
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          >
            <option value={0.5}>½ ×</option>
            <option value={1}>1 ×</option>
            <option value={2}>2 ×</option>
          </select>
        </div>
      ) : (
        <p className="source-note">
          Originalmengder frå kjelda. Porsjonstal er ikkje oppgitt; mengdene blir ikkje skalerte
          automatisk.
        </p>
      )}
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={`${ingredient.name}-${index}`}>
            <Link href={`/ingrediensar/${ingredientSlug(ingredient.name)}`}>{ingredient.name}</Link>
            <span>{scaleMeasure(ingredient.measure, scale) || 'Ikkje oppgitt'}</span>
          </li>
        ))}
      </ul>
      <button className="button" onClick={add} disabled={busy}>
        <ShoppingBag size={16} />
        {busy ? 'Legg til …' : 'Legg til i handlelista'}
      </button>
      {scalable && scale !== 1 && (
        <p className="source-note">Handlelista brukar originalmengdene (1 ×).</p>
      )}
      <p className="source-note" style={{ marginTop: 14 }}>
        Bruk konkrete produkt og kontroller allergen på pakninga.
      </p>
    </aside>
  );
}
export function CookingSteps({ steps, recipeId }: { steps: string[]; recipeId: string }) {
  const [done, setDone] = useState<number[]>([]);
  return (
    <ol className="step-list" key={recipeId}>
      {steps.map((step, index) => (
        <li key={index} className={`step ${done.includes(index) ? 'complete' : ''}`}>
          <button
            aria-label={`Merk steg ${index + 1} som ${done.includes(index) ? 'uferdig' : 'ferdig'}`}
            aria-pressed={done.includes(index)}
            onClick={() =>
              setDone(done.includes(index) ? done.filter((i) => i !== index) : [...done, index])
            }
          >
            {done.includes(index) ? (
              <Check size={16} style={{ margin: 'auto' }} />
            ) : (
              String(index + 1).padStart(2, '0')
            )}
          </button>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  );
}
type LinkedProduct = { ingredient: string; barcode: string; product: Product | null };
export function ProcessingPanel({
  recipe,
  accountsReady,
}: {
  recipe: Recipe;
  accountsReady: boolean;
}) {
  const [linked, setLinked] = useState<LinkedProduct[]>([]);
  const [ingredient, setIngredient] = useState(recipe.ingredients[0]?.name || '');
  const notify = useToast();
  useEffect(() => {
    if (accountsReady)
      api<{ products: LinkedProduct[] }>(`products?recipeId=${recipe.id}`)
        .then((result) => setLinked(result.products))
        .catch(() => {});
  }, [accountsReady, recipe.id]);
  async function select(product: Product) {
    try {
      const result = await api<{ product: Product }>('products', {
        recipeId: recipe.id,
        ingredient,
        barcode: product.code,
      });
      setLinked((previous) => [
        ...previous.filter((p) => p.ingredient !== ingredient),
        { ingredient, barcode: product.code, product: result.product },
      ]);
      notify('Produktet er knytt til ingrediensen din.');
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  const hasNova4 = linked.some((p) => p.product?.nova === 4);
  return (
    <section className="processing-panel">
      <p className="eyebrow">KJENN MATEN DIN</p>
      <h2>Kor prosessert er denne retten?</h2>
      <p>
        Generelle ingrediensnamn fortel ikkje kva produkt du brukar. Vi gir derfor ikkje heile
        retten ein NOVA-klasse. Søk opp den konkrete vara og kontroller at ho samsvarar med pakninga
        di.
      </p>
      <div className="processing-status">
        <Info size={17} />
        <span>
          {hasNova4
            ? 'Inneheld minst éin registrert NOVA 4-vare i produktvala dine'
            : 'Ikkje nok informasjon om dei konkrete produkta'}
        </span>
      </div>
      {linked.length > 0 && (
        <div className="product-results">
          {linked.map((p) => (
            <div className="product-card" key={p.ingredient}>
              <div>
                <p>{p.ingredient} · produkt valt av deg</p>
                <h3>{p.product?.name || p.barcode}</h3>
                <NovaBadge group={p.product?.nova ?? null} />
                <p>Registrert i Open Food Facts. Ikkje kontrollert av MÅLTID.</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <details>
        <summary>Undersøk eit produkt du brukar</summary>
        <p>
          Logg inn for å lagre koplinga. Produktresultat er søkjetreff, ikkje automatiske
          ingrediensmatchar.
        </p>
        <label>
          Ingrediens
          <select value={ingredient} onChange={(e) => setIngredient(e.target.value)}>
            {recipe.ingredients.map((i, index) => (
              <option key={index}>{i.name}</option>
            ))}
          </select>
        </label>
        <ProductSearch onSelect={select} />
      </details>
      <Link href="/om-maten" className="text-link" style={{ marginTop: 22 }}>
        Kva kan NOVA fortelje oss? <ArrowUpRight size={15} />
      </Link>
    </section>
  );
}
