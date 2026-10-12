import React from 'react';
import type { Currency, Product } from '../../types';
import type { BoardSlideData } from './boardSlides';
import { LOW_STOCK, isOnSale } from './boardSlides';
import { resolveImage, totalStock } from '../../shop/schema';
import { formatPrice } from '../../utils/currency';
import { SafeImage } from '../SafeImage';
import { ArrowRight, Eye } from 'lucide-react';

interface WipeTitleProps {
  text: string;
}

/**
 * Same word-by-word wipe as AnimatedHeadline (.clotex-word from index.css),
 * but joined with real spaces instead of non-breaking ones: product titles are
 * much longer than hero copy and must be able to wrap at 360px.
 */
const WipeTitle: React.FC<WipeTitleProps> = ({ text }) => {
  const words = text.split(' ');
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <React.Fragment key={i}>
            <span
              className="clotex-word"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              {word}
            </span>{' '}
          </React.Fragment>
        ))}
      </span>
    </>
  );
};

interface BoardSlideViewProps {
  slide: BoardSlideData;
  position: number;
  total: number;
  isActive: boolean;
  reducedMotion: boolean;
  currency: Currency;
  onShopCategory: (category: string) => void;
  onViewProduct: (product: Product) => void;
}

export const BoardSlideView: React.FC<BoardSlideViewProps> = ({
  slide,
  position,
  total,
  isActive,
  reducedMotion,
  currency,
  onShopCategory,
  onViewProduct,
}) => {
  const { product, eyebrow } = slide;
  // Odd slides put the image on the right so the board reads as an
  // asymmetric editorial spread that alternates as it rotates.
  const flip = position % 2 === 1;
  const sale = isOnSale(product);
  const stock = totalStock(product);

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${position + 1} of ${total}: ${product.title}`}
      className="grid grid-cols-1 md:grid-cols-12 md:h-[29rem] lg:h-[31rem] bg-[#FDFBF7] border border-[#EDE6DC] shadow-sm"
    >
      {/* Image panel */}
      <div
        className={`relative overflow-hidden bg-[#EDE6DC] aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:col-span-7 ${
          flip ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <SafeImage
          src={resolveImage(product.image)}
          alt={product.title}
          category={product.category}
          fallbackLabel={product.title}
          loading={isActive ? 'eager' : 'lazy'}
          decoding="async"
          className={`h-full w-full object-cover ${
            isActive && !reducedMotion ? 'clotex-board-kenburns' : ''
          }`}
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Text panel */}
      <div
        className={`md:col-span-5 flex flex-col justify-center gap-5 p-6 md:p-8 lg:p-10 min-w-0 ${
          flip ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6934B] font-medium">{eyebrow}</p>

        <h3 className="font-serif text-3xl sm:text-4xl leading-[1.12] tracking-tight text-[#1E1B18] text-balance">
          {/* Remount on activation so the headline re-wipes with each slide change. */}
          <WipeTitle key={isActive ? 'live' : 'idle'} text={product.title} />
        </h3>

        {/* One line of hard catalogue data — never invented urgency copy. */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
          <span className="font-serif text-2xl text-[#1E1B18]">
            {formatPrice(product.price, currency)}
          </span>
          {sale ? (
            <>
              <span className="text-sm text-[#5C5349] line-through">
                {formatPrice(product.originalPrice ?? 0, currency)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#A8523C] font-medium">
                Save {formatPrice((product.originalPrice ?? 0) - product.price, currency)}
              </span>
            </>
          ) : stock <= LOW_STOCK ? (
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#5C5349] font-medium">
              Only {stock} left in stock
            </span>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => onShopCategory(product.category)}
            className="group px-7 py-3 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium whitespace-normal flex items-center justify-center gap-3 hover:bg-[#342F2A] transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]"
          >
            <span>Shop {product.category}</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => onViewProduct(product)}
            className="px-7 py-3 bg-transparent border border-[#3C352D] text-[#1E1B18] text-xs uppercase tracking-[0.2em] font-medium whitespace-normal flex items-center justify-center gap-2 hover:bg-[#EDE6DC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]"
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>View piece</span>
          </button>
        </div>
      </div>
    </div>
  );
};
