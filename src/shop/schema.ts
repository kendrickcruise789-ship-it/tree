import { Product, ProductCategory, ProductColor } from '../types';
import { ALL_FABRICS, CATEGORIES, IMAGES } from '../data/products';

/**
 * The catalogue document is the single thing the owner edits and the storefront
 * reads. It lives in the site's own storage, so `revision` is what lets the panel
 * notice that somebody else changed the shop while this tab was open.
 */
export interface CatalogueDocument {
  revision: number;
  updatedAt: string;
  products: Product[];
}

export interface OwnerIdentity {
  name: string;
  picture: string;
  claimedAt: string;
}

export type SessionState =
  /** No shop service behind this copy (the GitHub Pages build, or the service is down). */
  | { status: 'service_unavailable' }
  /** Nobody has claimed this shop yet, so the visitor can. */
  | { status: 'unclaimed' }
  | { status: 'signed_out'; ownerClaimed: boolean }
  | { status: 'owner'; owner: OwnerIdentity }
  | { status: 'not_owner'; ownerClaimed: boolean };

/** Image references stored in the catalogue. Only these three forms are accepted. */
export type BundledImage = `bundled:${string}`;
export type ShopImage = `shop:${string}`;
export type ExternalImage = `https://${string}`;
export type ImageRef = BundledImage | ShopImage | ExternalImage;

export const BUNDLED_IMAGE_KEYS = Object.keys(IMAGES);
const BUNDLED_SOURCES = IMAGES as Record<string, string>;

export function bundledImageOptions(): { key: string; src: string }[] {
  return BUNDLED_IMAGE_KEYS.map((key) => ({ key, src: BUNDLED_SOURCES[key] }));
}

/**
 * Turns a stored image reference into something an <img> can load. Uploaded files
 * are fetched through the shop service because the file bucket itself is private.
 */
export function resolveImage(ref: string | undefined): string {
  if (!ref) return '';
  if (ref.startsWith('bundled:')) {
    const key = ref.slice('bundled:'.length);
    return BUNDLED_SOURCES[key] ?? '';
  }
  if (ref.startsWith('shop:')) {
    return `/functions/v1/app?action=image&id=${encodeURIComponent(ref.slice('shop:'.length))}`;
  }
  if (/^https:\/\//.test(ref) && !/\s/.test(ref)) return ref;
  return '';
}

export function isUsableImage(ref: string | undefined): boolean {
  if (!ref) return false;
  if (ref.startsWith('bundled:')) return BUNDLED_IMAGE_KEYS.includes(ref.slice('bundled:'.length));
  if (ref.startsWith('shop:')) return /^shop:[A-Za-z0-9_-]{8,64}\.(jpg|jpeg|png|webp)$/i.test(ref);
  return /^https:\/\/[^\s]+$/.test(ref) && ref.length <= 512;
}

const BUNDLED_KEY_BY_SRC = new Map<string, string>(
  BUNDLED_IMAGE_KEYS.map((key) => [BUNDLED_SOURCES[key], key]),
);

/**
 * The catalogue baked into this build names imported asset files; the shop speaks
 * `bundled:` refs. Fold the two spellings into one so the starter list and the live
 * list can be edited with the same picker.
 */
export function asImageRef(image: string | undefined): string {
  if (isUsableImage(image)) return image as string;
  const key = image ? BUNDLED_KEY_BY_SRC.get(image) : undefined;
  return key ? `bundled:${key}` : 'bundled:mannequinDress';
}

export const EDITABLE_CATEGORIES = CATEGORIES.filter(
  (cat): cat is ProductCategory => cat !== 'All Collections',
);

export const EDITABLE_PRODUCT_FIELDS = [
  'id',
  'title',
  'category',
  'price',
  'originalPrice',
  'image',
  'colors',
  'sizes',
  'stockPerSize',
  'description',
  'fabric',
  'craftTechnique',
  'careInstructions',
  'fitNote',
  'rating',
  'reviewsCount',
  'isNewArrival',
  'isBestSeller',
  'onSale',
] as const;

export function totalStock(product: Product): number {
  return Object.values(product.stockPerSize).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}

/** A draft for a brand new product, deliberately starting with no stock. */
export function blankProduct(id: string): Product {
  return {
    id,
    title: 'Untitled piece',
    category: 'Dresses',
    price: 100,
    image: 'bundled:mannequinDress',
    colors: [{ name: 'Parchment Ivory', hex: '#EDE8DF' }] satisfies ProductColor[],
    sizes: ['S', 'M', 'L'],
    stockPerSize: { S: 0, M: 0, L: 0 },
    description: 'Add a short description of the cut, the cloth and how it wears.',
    fabric: ALL_FABRICS[0],
    craftTechnique: 'Hand block printed in Bagru.',
    careInstructions: 'Gentle hand wash in cold water. Shade dry.',
    fitNote: 'Relaxed fit.',
    rating: 0,
    reviewsCount: 0,
  };
}
