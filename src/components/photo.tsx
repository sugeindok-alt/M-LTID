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
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="photo-fallback">
        <ImageOff size={28} />
        <span>Biletet er ikkje tilgjengeleg</span>
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={contain ? 'photo-contain' : 'photo-cover'}
      onError={() => setFailed(true)}
    />
  );
}
