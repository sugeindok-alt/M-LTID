export type NovaGroup = 1 | 2 | 3 | 4 | null;
export function novaGroup(value: unknown): NovaGroup {
  return (typeof value === 'number' || (typeof value === 'string' && /^[1-4]$/.test(value))) &&
    [1, 2, 3, 4].includes(Number(value))
    ? (Number(value) as NovaGroup)
    : null;
}
export const novaNames = {
  1: 'Uprosessert eller minimalt prosessert',
  2: 'Prosesserte kulinariske ingrediensar',
  3: 'Prosessert',
  4: 'Ultraprosessert',
};
export function novaVerdict(group: NovaGroup) {
  return group === 4 ? 'Ultraprosessert' : group ? 'Ikkje ultraprosessert etter NOVA' : 'Ukjent';
}
