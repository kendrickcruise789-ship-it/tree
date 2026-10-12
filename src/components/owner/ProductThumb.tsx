import React from 'react';
import { resolveImage } from '../../shop/schema';
import { ImageOff } from 'lucide-react';

interface ProductThumbProps {
  /** A stored image reference (`bundled:…`, `shop:…`, https URL) — resolved internally. */
  ref: string | undefined;
  alt?: string;
  className?: string;
}

/** Renders a catalogue thumbnail, falling back to a neutral block when the reference resolves to nothing. */
export const ProductThumb: React.FC<ProductThumbProps> = ({ ref, alt = '', className = 'w-16 h-20' }) => {
  const src = resolveImage(ref);
  if (!src) {
    return (
      <span
        className={`${className} shrink-0 bg-[#F4EFEA] border border-[#EDE6DC] flex items-center justify-center text-[#A89C8F]`}
        aria-hidden="true"
      >
        <ImageOff className="w-4 h-4" />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${className} shrink-0 object-cover object-top bg-[#F4EFEA] border border-[#EDE6DC]`}
    />
  );
};
