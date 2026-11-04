import { Photo } from './photo';

export function RawIngredientPhoto({
  ingredient,
  detail = false,
}: {
  ingredient: { name: string; image: string };
  detail?: boolean;
}) {
  if (!ingredient.image) return <span className="raw-image-missing">{ingredient.name}</span>;
  return (
    <Photo
      src={ingredient.image}
      alt={ingredient.name}
      priority={detail}
      contain
      sizes={
        detail
          ? '(max-width: 800px) 90vw, 490px'
          : '(max-width: 520px) 40vw, (max-width: 800px) 28vw, 240px'
      }
    />
  );
}
