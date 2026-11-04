'use client';
import { useState, useRef, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { OwnerBook, Preview } from '@/lib/book-sharing';

async function bookRequest<T>(input: object): Promise<T> {
  const response = await fetch('/api/boksamling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Klarte ikkje å lagre boka.');
  return data;
}
const subscribe = () => () => {};
function useReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
export function BookCreator() {
  const ready = useReady(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fields = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { id } = await bookRequest<{ id: string }>({
        action: 'create',
        title: fields.get('title'),
        description: fields.get('description'),
      });
      router.push('/kokebok/boker/' + id);
    } catch {
      setError('Boka vart ikkje oppretta. Kontroller felta og prøv igjen.');
      setBusy(false);
    }
  }
  return (
    <details className="collection-creator">
      <summary>Opprett ei kokebok</summary>
      <form onSubmit={submit}>
        <label>
          Tittel på kokeboka
          <input name="title" maxLength={120} required />
        </label>
        <label>
          Skildring (valfritt)
          <textarea name="description" maxLength={1000} />
        </label>
        <p>Den nye boka er privat. Du kan velje kva du vil dele seinare.</p>
        <button className="button" disabled={!ready || busy}>
          Opprett privat kokebok
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}
type Choice = { id: string; title: string; hasImage: boolean };
export function BookManager({ initial, recipes }: { initial: OwnerBook; recipes: Choice[] }) {
  const ready = useReady(),
    lock = useRef(false);
  const [book, setBook] = useState(initial),
    [title, setTitle] = useState(initial.title),
    [description, setDescription] = useState(initial.description),
    [members, setMembers] = useState(initial.recipeIds);
  const [publicChoice, setPublicChoice] = useState(Boolean(initial.publishedAt)),
    [selected, setSelected] = useState(initial.published.map(({ id, photo }) => ({ id, photo })));
  const [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState('');
  const dirty =
    title !== book.title ||
    description !== book.description ||
    JSON.stringify(members) !== JSON.stringify(book.recipeIds);
  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus('');
    setError('');
    try {
      await fn();
    } catch (e) {
      setPreview(null);
      setError(
        e instanceof TypeError
          ? 'Fekk ikkje kontakt med tenesta. Prøv igjen.'
          : e instanceof Error
            ? e.message
            : 'Klarte ikkje å lagre boka.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    const response = await fetch('/api/boksamling?id=' + book.id, { cache: 'no-store' });
    if (!response.ok) throw new Error('Last boka på nytt.');
    const saved: OwnerBook = await response.json();
    setBook(saved);
    setTitle(saved.title);
    setDescription(saved.description);
    setMembers(saved.recipeIds);
    setSelected(
      saved.published
        .filter((p) => saved.recipeIds.includes(p.id))
        .map(({ id, photo }) => ({ id, photo })),
    );
    setPublicChoice(Boolean(saved.publishedAt));
    setPreview(null);
  }
  function toggleMember(id: string) {
    setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPreview(null);
  }
  const sharePath = '/boker/' + book.id;
  return (
    <div className="container page-shell book-editor collection-editor">
      <Link href="/kokebok" className="text-link">
        ← Mi kokebok
      </Link>
      <header className="page-intro">
        <p className="eyebrow">{book.publishedAt ? 'OFFENTLEG KOKEBOK' : 'PRIVAT KOKEBOK'}</p>
        <h1>{book.title}</h1>
      </header>
      <fieldset disabled={!ready || busy}>
        <legend>Bokinnhald</legend>
        <label>
          Tittel på kokeboka
          <input
            value={title}
            maxLength={120}
            onChange={(e) => {
              setTitle(e.target.value);
              setPreview(null);
            }}
          />
        </label>
        <label>
          Skildring
          <textarea
            value={description}
            maxLength={1000}
            onChange={(e) => {
              setDescription(e.target.value);
              setPreview(null);
            }}
          />
        </label>
        <h2>Oppskrifter i boka</h2>
        <p>Du kan bruke den same oppskrifta i fleire bøker.</p>
        {recipes.map((r) => (
          <label className="collection-check" key={r.id}>
            <input
              type="checkbox"
              checked={members.includes(r.id)}
              onChange={() => toggleMember(r.id)}
            />
            {r.title}
          </label>
        ))}
        {!recipes.length && (
          <Link href="/kokebok/ny" className="text-link">
            Skriv den første oppskrifta di →
          </Link>
        )}
        <button
          className="button secondary"
          disabled={!dirty || !title.trim()}
          onClick={() =>
            run(async () => {
              await bookRequest({
                action: 'save',
                id: book.id,
                revision: book.revision,
                title,
                description,
                recipeIds: members,
              });
              await refresh();
              setStatus('Bokinnhaldet er lagra.');
            })
          }
        >
          Lagre bokinnhald
        </button>
      </fieldset>
      <fieldset disabled={!ready || busy}>
        <legend>Kven kan lese boka?</legend>
        <label className="collection-check">
          <input
            type="radio"
            name="audience"
            checked={!publicChoice}
            onChange={() => {
              setPublicChoice(false);
              setPreview(null);
            }}
          />
          Privat – berre du kan sjå boka
        </label>
        <label className="collection-check">
          <input
            type="radio"
            name="audience"
            checked={publicChoice}
            onChange={() => {
              setPublicChoice(true);
              setPreview(null);
            }}
          />
          Offentleg – alle kan lese boka
        </label>
        {!publicChoice && book.publishedAt && (
          <button
            className="button"
            onClick={() =>
              run(async () => {
                await bookRequest({ action: 'withdraw', id: book.id });
                await refresh();
                setStatus('Boka er privat. Delingslenkja er stengd.');
              })
            }
          >
            Gjer boka privat
          </button>
        )}
        {publicChoice && (
          <>
            <h2>Vel kva som skal delast</h2>
            <p>
              Berre avkryssa oppskrifter og foto blir delte. Seinare endringar i originalane blir
              først synlege når du publiserer ei ny utgåve.
            </p>
            {dirty && <p role="status">Lagre bokinnhaldet først.</p>}
            {recipes
              .filter((r) => book.recipeIds.includes(r.id))
              .map((r) => {
                const choice = selected.find((s) => s.id === r.id);
                return (
                  <div className="share-choice" key={r.id}>
                    <label className="collection-check">
                      <input
                        type="checkbox"
                        checked={!!choice}
                        onChange={() => {
                          setSelected((prev) =>
                            choice
                              ? prev.filter((s) => s.id !== r.id)
                              : [...prev, { id: r.id, photo: false }],
                          );
                          setPreview(null);
                        }}
                      />
                      Del oppskrifta «{r.title}»
                    </label>
                    {choice && r.hasImage && (
                      <label className="collection-check">
                        <input
                          type="checkbox"
                          checked={choice.photo}
                          onChange={() => {
                            setSelected((prev) =>
                              prev.map((s) => (s.id === r.id ? { ...s, photo: !s.photo } : s)),
                            );
                            setPreview(null);
                          }}
                        />
                        Del også fotoet til «{r.title}»
                      </label>
                    )}
                  </div>
                );
              })}
            <button
              className="button secondary"
              disabled={!selected.length || dirty}
              onClick={() =>
                run(async () => {
                  setPreview(null);
                  setPreview(
                    await bookRequest<Preview>({
                      action: 'preview',
                      id: book.id,
                      selections: selected,
                    }),
                  );
                })
              }
            >
              Førehandsvis delinga
            </button>
            {preview && (
              <SharePreview
                key={preview.approval}
                preview={preview}
                publish={() =>
                  run(async () => {
                    await bookRequest({
                      action: 'publish',
                      id: book.id,
                      selections: selected,
                      approval: preview.approval,
                    });
                    await refresh();
                    setStatus('Den viste utgåva er publisert.');
                  })
                }
              />
            )}
          </>
        )}
      </fieldset>
      {book.publishedAt && (
        <section>
          <h2>Delingslenkje</h2>
          <a href={sharePath} className="text-link">
            Opne den offentlege kokeboka →
          </a>
          <button
            className="button secondary"
            onClick={() =>
              run(async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(sharePath, window.location.origin).href,
                  );
                } catch {
                  throw new Error(
                    'Klarte ikkje å kopiere lenkja. Opne den offentlege kokeboka og kopier adressa frå nettlesaren.',
                  );
                }
                setStatus('Delingslenkja er kopiert.');
              })
            }
          >
            Kopier lenkja
          </button>
        </section>
      )}
      <p role="status">{status}</p>
      {error && (
        <p role="alert" className="form-message error">
          {error}
        </p>
      )}
    </div>
  );
}

function SharePreview({ preview, publish }: { preview: Preview; publish: () => void }) {
  const [photos, setPhotos] = useState<Record<string, 'loaded' | 'error'>>({});
  const waiting = preview.recipes.some((r) => r.photo && photos[r.id] !== 'loaded');
  return (
    <div className="share-preview">
      <h2>Dette blir offentleg</h2>
      <h3>{preview.title}</h3>
      <p>{preview.description}</p>
      {preview.recipes.map((r) => (
        <section key={r.id}>
          {r.photo && (
            <figure>
              <Image
                unoptimized
                loading="eager"
                src={'/api/kokebok/' + r.id + '/bilete?v=' + r.revision}
                width={256}
                height={192}
                alt={'Foto som blir delt: ' + r.title}
                onLoad={() => setPhotos((p) => ({ ...p, [r.id]: 'loaded' }))}
                onError={() => setPhotos((p) => ({ ...p, [r.id]: 'error' }))}
              />
              <figcaption>{r.title} · dette fotoet blir delt</figcaption>
              {photos[r.id] === 'error' && (
                <p role="alert">
                  Fekk ikkje vist fotoet. Prøv førehandsvisinga på nytt, eller ta bort fotovalet.
                </p>
              )}
            </figure>
          )}
          <details>
            <summary>
              {r.title} · {r.photo ? 'med foto' : 'utan foto'}
            </summary>
            <p>{r.servings} porsjonar</p>
            <ul>
              {r.ingredients.map((i, n) => (
                <li key={n}>
                  {i.measure} {i.name}
                </li>
              ))}
            </ul>
            <ol>
              {r.steps.map((s, n) => (
                <li key={n}>{s}</li>
              ))}
            </ol>
          </details>
        </section>
      ))}
      <button className="button" disabled={waiting} onClick={publish}>
        Publiser denne utgåva
      </button>
    </div>
  );
}
