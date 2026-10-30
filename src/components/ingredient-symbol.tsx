import { Apple, Carrot, Fish, Wheat, Sprout, Leaf } from 'lucide-react';
export function IngredientSymbol({ group }: { group: string }) {
  const Icon =
    (
      {
        Grønsaker: Carrot,
        'Frukt og bær': Apple,
        'Fisk og kjøt': Fish,
        Belgfrukter: Sprout,
        'Urter og krydder': Leaf,
      } as Record<string, typeof Leaf>
    )[group] || Wheat;
  return (
    <span className="ingredient-symbol" aria-hidden="true">
      <Icon strokeWidth={1.2} />
    </span>
  );
}
