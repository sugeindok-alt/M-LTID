import type { ReactNode } from 'react';
import { Photo } from './photo';

/*
 * Felles sidetopp i same stil som panela på forsida: bilete over heile breidda,
 * mørkt slør og stor kvit tekst. Utan bilete blir toppen eit reint mørkt band.
 */
export function PageHero({
  kicker,
  title,
  text,
  image,
  children,
}: {
  kicker: string;
  title: string;
  text?: ReactNode;
  image?: { src: string; alt: string; illustration?: boolean } | null;
  children?: ReactNode;
}) {
  return (
    <section className="cine cine-page">
      <div className="cine-media">
        {image && (
          <>
            <Photo src={image.src} alt={image.alt} priority sizes="100vw" />
            {image.illustration && <span className="image-label">Illustrasjon</span>}
          </>
        )}
      </div>
      <div className="container cine-content">
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        {text && <p className="cine-text">{text}</p>}
        {children}
      </div>
    </section>
  );
}
