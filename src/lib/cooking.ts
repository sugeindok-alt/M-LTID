import { z } from 'zod';

export const initialCooking = () => ({
  step: null as number | null,
  done: [] as number[],
  scale: 1,
  timer: null as { step: number; end: number } | null,
});
export type CookingProgress = ReturnType<typeof initialCooking>;

const index = z.number().int().nonnegative();
const storedProgress = z.object({
  step: index.nullable(),
  done: z.array(index),
  scale: z.union([z.literal(0.5), z.literal(1), z.literal(2)]),
  timer: z.object({ step: index, end: z.number().int().positive() }).nullable(),
});
export function readCooking(raw: string | null, count: number): CookingProgress {
  if (!raw) return initialCooking();
  try {
    const data = storedProgress.parse(JSON.parse(raw));
    return {
      ...data,
      step: data.step === null ? null : Math.min(data.step, count - 1),
      done: [...new Set(data.done.filter((i) => i < count))],
      timer: data.timer && data.timer.step < count ? data.timer : null,
    };
  } catch {
    return initialCooking();
  }
}

// Read only explicit quantities of time. The catalogue also has steps with two
// different durations, and uses decimal hours as in «2,5–3 timar».
export function timerChoices(text: string) {
  const choices = new Set<number>();
  const matches = text.matchAll(
    /\b(\d+(?:[.,]\d+)?|ein|eitt)(?:\s*(?:[–—-]|til)\s*(\d+(?:[.,]\d+)?))?\s+(minutt(?:a|ar)?|timar|time|sekund(?:a|ar)?)\b/giu,
  );
  for (const [, first, last, unit] of matches) {
    const factor = unit.startsWith('tim') ? 3600 : unit.startsWith('min') ? 60 : 1;
    const start = Math.round((/\d/.test(first) ? Number(first.replace(',', '.')) : 1) * factor);
    const end = last ? Math.round(Number(last.replace(',', '.')) * factor) : start;
    if (start <= 0 || end < start || end > 86400) continue;
    for (let seconds = start; seconds < end; seconds += Math.min(60, factor)) choices.add(seconds);
    choices.add(end);
  }
  return [...choices];
}
export function durationLabel(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60} minutt` : `${seconds} sekund`;
}
export function clockLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
