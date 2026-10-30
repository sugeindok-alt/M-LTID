const aliases: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  dl: 'dl',
  ts: 'ts',
  ss: 'ss',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
};
export function parseMeasure(value: string): { amount: number; unit: string } | null {
  // Deliberately conservative: no ranges, heaped spoonfuls, packages or size assumptions.
  const match = value
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .match(/^(\d+(?:\.\d+)?|\d+\/\d+|\d+ \d+\/\d+)\s*([a-z]*)$/);
  if (!match || (match[2] && !aliases[match[2]])) return null;
  const amount = match[1].split(' ').reduce((sum, part) => {
    const [a, b] = part.split('/').map(Number);
    return sum + (b === undefined ? a : a / b);
  }, 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;
  return { amount, unit: aliases[match[2]] ?? '' };
}
export function formatMeasure(amount: number, unit: string) {
  return `${Number(amount.toFixed(3)).toLocaleString('nn-NO', { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ''}`;
}
export function scaleMeasure(value: string, factor: number) {
  const p = parseMeasure(value);
  return p ? formatMeasure(p.amount * factor, p.unit) : value;
}
