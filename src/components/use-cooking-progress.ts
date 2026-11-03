'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { readCooking, type CookingProgress } from '@/lib/cooking';

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
  return () => {
    window.removeEventListener('storage', refresh);
    window.removeEventListener(changes, refresh);
  };
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
