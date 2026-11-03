export const dayNames = [
  'Måndag',
  'Tysdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Laurdag',
  'Sundag',
] as const;
function asDate(iso: string) {
  return new Date(iso + 'T12:00:00Z');
}
export function isWeek(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = asDate(value);
  return d.getUTCDay() === 1 && d.toISOString().slice(0, 10) === value;
}
export function plusDays(iso: string, days: number) {
  const d = asDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function thisWeek(now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return plusDays(today, -(asDate(today).getUTCDay() + 6) % 7);
}
export function dateLabel(iso: string) {
  // Some browsers ship without nn-NO locale data. Use the same Nynorsk label
  // on server and client so hydration never replaces the active day editor.
  const months = [
    'jan.',
    'feb.',
    'mars',
    'apr.',
    'mai',
    'juni',
    'juli',
    'aug.',
    'sep.',
    'okt.',
    'nov.',
    'des.',
  ];
  const d = asDate(iso);
  return d.getUTCDate() + '. ' + months[d.getUTCMonth()];
}
