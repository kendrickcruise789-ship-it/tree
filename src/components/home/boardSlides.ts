import type { Product } from '../../types';
import { totalStock } from '../../shop/schema';

export type BoardReason = 'bestseller' | 'newarrival' | 'sale' | 'rating';

export interface BoardSlideData {
  product: Product;
  reason: BoardReason;
  eyebrow: string;
}

const MAX_SLIDES = 5;

/** Same low-stock threshold the ProductCard uses, so the two never disagree. */
export const LOW_STOCK = 8;

const BASE_EYEBROWS: Record<BoardReason, string> = {
  bestseller: 'Bestseller',
  newarrival: 'New on the cutting table',
  sale: 'Block-print sale',
  rating: 'Top rated',
};

export function isOnSale(product: Product): boolean {
  return typeof product.originalPrice === 'number' && product.originalPrice > product.price;
}

function reasonFor(product: Product): BoardReason {
  if (product.isBestSeller) return 'bestseller';
  if (product.isNewArrival) return 'newarrival';
  if (isOnSale(product)) return 'sale';
  return 'rating';
}

const TIER: Record<BoardReason, number> = {
  bestseller: 0,
  newarrival: 1,
  sale: 2,
  rating: 3,
};

/**
 * Picks 2-5 slides from the live catalogue: bestsellers first, then new
 * arrivals, then real price drops, then highest-rated, skipping sold-out
 * pieces so the board never advertises cloth the shop cannot ship.
 */
export function buildBoardSlides(products: Product[]): BoardSlideData[] {
  const inStock = products.filter((product) => totalStock(product) > 0);
  const sorted = [...inStock].sort((a, b) => {
    const byTier = TIER[reasonFor(a)] - TIER[reasonFor(b)];
    if (byTier !== 0) return byTier;
    return b.rating - a.rating;
  });

  const seen = new Set<string>();
  const slides: BoardSlideData[] = [];
  for (const product of sorted) {
    if (slides.length >= MAX_SLIDES) break;
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    const reason = reasonFor(product);
    const eyebrow =
      reason === 'rating' && product.rating > 0
        ? `${BASE_EYEBROWS.rating} — ${product.rating.toFixed(1)}★`
        : BASE_EYEBROWS[reason];
    slides.push({ product, reason, eyebrow });
  }
  return slides;
}
