import React, { useMemo, useState } from 'react';
import {
  CATEGORY_FALLBACK_IMAGES,
  getBeigePlaceholderSvg,
} from '../utils/imageFallback';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Clotex artisanal product',
  category,
  fallbackLabel,
  className = '',
  ...props
}) => {
  // stage: 0 = bundled src, 1 = CDN category photo, 2 = inline SVG placeholder
  const [stage, setStage] = useState(0);

  const categoryFallback = category
    ? CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.Dresses
    : CATEGORY_FALLBACK_IMAGES.Dresses;

  const placeholder = useMemo(
    () => getBeigePlaceholderSvg(fallbackLabel || category || 'CLOTEX'),
    [fallbackLabel, category]
  );

  // Reset the cascade whenever the requested image changes
  const [lastSrc, setLastSrc] = useState(src);
  if (lastSrc !== src) {
    setLastSrc(src);
    setStage(0);
  }

  const currentSrc = stage === 0 ? (src || categoryFallback) : stage === 1 ? categoryFallback : placeholder;

  const handleError = () => {
    if (stage < 2) {
      setStage((prev) => prev + 1);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
