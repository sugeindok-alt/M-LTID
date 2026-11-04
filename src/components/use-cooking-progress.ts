'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { linkedServings, portionChoices, readCooking, type CookingProgress } from '@/lib/cooking';

const changes = 'maltid-cooking-change';
const fallback = new Map<string, string>();
function snapshot(key: string) {
  if (fallback.has(key)) return fallback.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function subscribe(refresh: () => void) {
  window.addEventListener('storage', refresh);
  window.addEventListener(changes, refresh);
  window.addEventListener('popstate', refresh);
  return () => {
    window.removeEventListener('storage', refresh);
    window.removeEventListener(changes, refresh);
    window.removeEventListener('popstate', refresh);
  };
}
export function useLinkedServings(initial: number | null) {
  return useSyncExternalStore(
    subscribe,
    () => linkedServings(new URLSearchParams(window.location.search).get('porsjonar')),
    () => initial,
  );
}
export function useRecipePortions(id: string, steps: number, base: number, initial: number | null) {
  const cooking = useCookingProgress(id, steps);
  const linked = useLinkedServings(initial);
  const remembered = Number((base * cooking.progress.scale).toFixed(3));
  const choices = portionChoices(base);
  const servings =
    linked !== null && choices.includes(linked)
      ? linked
      : choices.includes(remembered)
        ? remembered
        : base;
  function setScale(scale: number) {
    if (linked !== null) {
      const url = new URL(window.location.href);
      url.searchParams.set('porsjonar', String(Number((scale * base).toFixed(3))));
      window.history.replaceState(null, '', url);
    }
    cooking.update((progress) => ({ ...progress, scale }));
  }
  return { ...cooking, servings, scale: servings / base, setScale };
}
export function useCookingProgress(id: string, count: number) {
  const key = 'maltid:matlaging:v1:' + id;
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    () => null,
  );
  const progress = useMemo(() => readCooking(raw, count), [raw, count]);
  function update(change: (previous: CookingProgress) => CookingProgress) {
    const next = JSON.stringify(change(readCooking(snapshot(key), count)));
    try {
      window.localStorage.setItem(key, next);
      fallback.delete(key);
    } catch {
      fallback.set(key, next);
    }
    window.dispatchEvent(new Event(changes));
  }
  return {
    progress,
    update,
    localOnlyInMemory: typeof window !== 'undefined' && fallback.has(key),
  };
}
