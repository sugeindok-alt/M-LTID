import atlases from '../../docs/RAW-IMAGE-ATLAS.json';

// The manifest records exactly which original illustration was selected for
// each ingredient. Unknown ingredients deliberately have no image.
const images = new Map(
  atlases.flatMap((atlas) =>
    atlas.cells.map(
      (cell) =>
        [cell.name, `/images/ravarer/r${atlas.sheet}-${cell.row}-${cell.column}.webp`] as const,
    ),
  ),
);

export function rawImage(name: string) {
  return images.get(name) ?? '';
}
