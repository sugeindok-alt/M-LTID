'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
export function Photo({
  src,
  alt,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw',
  contain = false,
  natural = false,
  unoptimized = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  contain?: boolean;
  natural?: boolean;
  unoptimized?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src)
    return (
      <div className="photo-fallback" role="img" aria-label={`Bilete manglar: ${alt}`}>
        <ImageOff size={28} />
        <span>Biletet er ikkje tilgjengeleg</span>
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      {...(natural ? { width: 1200, height: 900 } : { fill: true })}
      preload={priority}
      unoptimized={unoptimized}
      sizes={sizes}
      className={natural ? 'photo-natural' : contain ? 'photo-contain' : 'photo-cover'}
      onError={() => setFailed(true)}
    />
  );
}
