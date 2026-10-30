'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { api } from '@/lib/client-api';
import { useToast } from './providers';
import { categoryLabels } from '@/lib/recipes';
export function Profile({
  user,
  preferences,
  count,
}: {
  user: { name: string; email: string };
  preferences: { theme: string; favoriteCategory: string };
  count: number;
}) {
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  const router = useRouter();
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    localStorage.setItem('maltid-theme', preferences.theme);
  }, [preferences.theme]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const data = {
      name: String(form.get('name')),
      theme: String(form.get('theme')),
      favoriteCategory: String(form.get('favoriteCategory')),
    };
    try {
      await api('profile', data);
      document.documentElement.dataset.theme = data.theme;
      localStorage.setItem('maltid-theme', data.theme);
      notify('Profilen din er oppdatert.');
      router.refresh();
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error('Utlogginga feila. Prøv igjen.');
      router.push('/');
      router.refresh();
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-grid">
      <form className="profile-form form-stack" onSubmit={save}>
        <label>
          Namn
          <input
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={80}
            required
            autoComplete="name"
          />
        </label>
        <label>
          E-postadresse
          <input value={user.email} readOnly type="email" />
        </label>
        <p className="source-note">
          Stadfesta e-postadresse. E-postbyte er ikkje støtta i denne versjonen.
        </p>
        <label>
          Favorittkategori
          <select name="favoriteCategory" defaultValue={preferences.favoriteCategory}>
            <option value="">Ingen vald</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visuelt tema
          <select name="theme" defaultValue={preferences.theme}>
            <option value="olive">Olive & Cream</option>
            <option value="tomato">Tomato & Vanilla</option>
            <option value="nordic">Nordic</option>
            <option value="dark">Dark Gourmet</option>
            <option value="basil">Basil & Pastel</option>
          </select>
        </label>
        <button className="button" disabled={busy}>
          Lagre endringar
        </button>
        <Link href="/gloymt-passord" className="text-link">
          Endre passord med sikker e-postlenkje <ArrowUpRight size={15} />
        </Link>
        <button className="text-link" type="button" onClick={logout} disabled={busy}>
          <LogOut size={16} /> Logg ut
        </button>
      </form>
      <aside className="profile-aside">
        <p className="eyebrow">DI OPPSKRIFTSBOK</p>
        <p>
          <strong>{count}</strong>lagra {count === 1 ? 'oppskrift' : 'oppskrifter'}
        </p>
        <Link href="/favorittar" className="text-link">
          Sjå favorittane dine <ArrowUpRight size={16} />
        </Link>
        {preferences.favoriteCategory && (
          <p style={{ marginTop: 30 }}>
            <Link
              className="text-link"
              href={`/oppskrifter?category=${encodeURIComponent(preferences.favoriteCategory)}`}
            >
              Utforsk {categoryLabels[preferences.favoriteCategory] || preferences.favoriteCategory}{' '}
              <ArrowUpRight size={16} />
            </Link>
          </p>
        )}
      </aside>
    </div>
  );
}
