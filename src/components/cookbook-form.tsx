'use client';
import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client-api';
import { type CookbookFields, recipeFields } from '@/lib/cookbook-types';

const subscribe = () => () => {};
async function photoForUpload(file: File) {
  if (
    file.size > 20 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  )
    throw new Error('Vel eit JPG-, PNG- eller WebP-foto under 20 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Fekk ikkje lese fotoet.'));
    reader.readAsDataURL(file);
  });
  const photo = new window.Image();
  photo.src = data;
  try {
    await photo.decode();
  } catch {
    throw new Error('Fekk ikkje lese fotoet. Vel eit anna bilete.');
  }
  const scale = Math.min(1, 1024 / Math.max(photo.naturalWidth, photo.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(photo.width * scale));
  canvas.height = Math.max(1, Math.round(photo.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nettlesaren kunne ikkje klargjere fotoet.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
  const jpeg = canvas.toDataURL('image/jpeg', 0.8);
  if (!jpeg.startsWith('data:image/jpeg;') || jpeg.length > 800000)
    throw new Error('Biletet er for stort. Prøv eit mindre utsnitt.');
  return jpeg;
}
type Props = {
  initial?: CookbookFields;
  edit?: { id: string; revision: number; hasImage: boolean };
  original: { id: string; title: string } | null;
};
export function CookbookForm({ initial, edit, original }: Props) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [draft, setDraft] = useState<CookbookFields>(
    initial ?? { title: '', servings: 4, ingredients: [{ name: '', measure: '' }], steps: [''] },
  );
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false),
    [loadingPhoto, setLoadingPhoto] = useState(false),
    [error, setError] = useState('');
  const requestId = useRef<string | null>(null),
    submitting = useRef(false),
    fileInput = useRef<HTMLInputElement>(null);
  const preview =
    image === undefined && edit?.hasImage
      ? '/api/kokebok/' + edit.id + '/bilete?v=' + edit.revision
      : image;
  async function choose(file: File) {
    setLoadingPhoto(true);
    setError('');
    try {
      setImage(await photoForUpload(file));
    } catch (e) {
      setError((e as Error).message);
      if (fileInput.current) fileInput.current.value = '';
    } finally {
      setLoadingPhoto(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || loadingPhoto) return;
    const parsed = recipeFields.safeParse(draft);
    if (!parsed.success) {
      setError(
        'Fyll ut namn, porsjonstal, mengd og råvare for kvar ingrediens og teksten i kvart steg.',
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      requestId.current ??= crypto.randomUUID();
      const result = await api<{ id: string }>(
        'cookbook',
        {
          ...parsed.data,
          image,
          ...(edit
            ? { id: edit.id, revision: edit.revision }
            : { id: requestId.current, originalId: original?.id ?? null }),
        },
        edit ? 'PATCH' : 'POST',
      );
      // Fetch the saved revision directly, including when this detail page was visited before.
      window.location.replace('/kokebok/' + result.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Fekk ikkje lagra oppskrifta. Kontroller tilkoplinga og prøv igjen.',
      );
      submitting.current = false;
      setBusy(false);
    }
  }
  const updateIngredient = (index: number, patch: Partial<CookbookFields['ingredients'][number]>) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  return (
    <div className="container page-shell book-page book-editor">
      <Link href={edit ? '/kokebok/' + edit.id : '/kokebok'} className="text-link">
        ← {edit ? 'Til oppskrifta' : 'Mi kokebok'}
      </Link>
      <header className="page-intro">
        <p className="eyebrow">MI KOKEBOK · PRIVAT</p>
        <h1>{edit ? 'Rediger oppskrifta.' : original ? 'Lag min variant.' : 'Ny oppskrift.'}</h1>
        <p>
          {original ? (
            <>
              Original frå MÅLTID:{' '}
              <Link href={'/oppskrifter/' + original.id} className="text-link">
                {original.title}
              </Link>
              . Endringane dine blir lagra i di eiga oppskrift.
            </>
          ) : (
            'Oppskrifta blir lagra på kontoen din.'
          )}
        </p>
      </header>
      <form onSubmit={save}>
        <fieldset disabled={!ready || busy || loadingPhoto}>
          <label>
            Namn på oppskrifta
            <input
              value={draft.title}
              maxLength={140}
              required
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Porsjonstal
            <input
              className="book-portions"
              type="number"
              min={1}
              max={24}
              required
              value={draft.servings || ''}
              onChange={(e) => setDraft({ ...draft, servings: Number(e.target.value) })}
            />
          </label>
          <section>
            <h2>Ingrediensar</h2>
            {draft.ingredients.map((item, i) => (
              <div className="book-ingredient" key={i}>
                <label>
                  Råvare {i + 1}
                  <input
                    required
                    maxLength={100}
                    value={item.name}
                    placeholder="Til dømes poteter"
                    onChange={(e) => updateIngredient(i, { name: e.target.value })}
                  />
                </label>
                <label>
                  Mengd {i + 1}
                  <input
                    required
                    maxLength={80}
                    value={item.measure}
                    placeholder="400 g"
                    onChange={(e) => updateIngredient(i, { measure: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="book-remove"
                  disabled={draft.ingredients.length === 1}
                  aria-label={'Fjern ingrediens ' + (i + 1)}
                  onClick={() =>
                    setDraft({ ...draft, ingredients: draft.ingredients.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button secondary"
              disabled={draft.ingredients.length >= 60}
              onClick={() =>
                setDraft({
                  ...draft,
                  ingredients: [...draft.ingredients, { name: '', measure: '' }],
                })
              }
            >
              <Plus size={16} />
              Legg til ingrediens
            </button>
          </section>
          <section>
            <h2>Slik gjer du</h2>
            {draft.steps.map((step, i) => (
              <div className="book-step" key={i}>
                <label>
                  Steg {i + 1}
                  <textarea
                    required
                    rows={2}
                    maxLength={2400}
                    value={step}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        steps: draft.steps.map((s, j) => (j === i ? e.target.value : s)),
                      })
                    }
                  />
                </label>
                <button
                  className="book-remove"
                  type="button"
                  disabled={draft.steps.length === 1}
                  aria-label={'Fjern steg ' + (i + 1)}
                  onClick={() =>
                    setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              className="button secondary"
              type="button"
              disabled={draft.steps.length >= 40}
              onClick={() => setDraft({ ...draft, steps: [...draft.steps, ''] })}
            >
              <Plus size={16} />
              Legg til steg
            </button>
          </section>
          <section>
            <h2>Eige foto</h2>
            <p>Valfritt. Vel eit JPG-, PNG- eller WebP-bilete frå eininga di.</p>
            <label className="button secondary book-file">
              Vel bilete
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void choose(file);
                }}
              />
            </label>
            {preview && (
              <div className="book-preview">
                <Image
                  unoptimized
                  src={preview}
                  width={192}
                  height={144}
                  alt="Foto til oppskrifta"
                />
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setImage(null);
                    if (fileInput.current) fileInput.current.value = '';
                  }}
                >
                  Fjern biletet
                </button>
              </div>
            )}
          </section>
          <div className="book-submit">
            <button className="button">
              {busy
                ? 'Lagrar …'
                : edit
                  ? 'Lagre endringar'
                  : original
                    ? 'Lagre varianten'
                    : 'Lagre oppskrifta'}
            </button>
          </div>
        </fieldset>
        {loadingPhoto && <p role="status">Klargjer biletet …</p>}
        {error && (
          <p role="alert" className="form-message error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
