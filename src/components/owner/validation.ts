import { Product, ProductCategory } from '../../types';

/**
 * The editor keeps every number field as raw text so an owner can clear a box or
 * type "12." mid-entry without the input fighting them. This form view is the single
 * source of truth for what is on screen; it is folded back into a `Product` only once
 * it validates. Keeping the text and the wire model separate is what lets us show
 * inline field errors before anything is sent to the shop service.
 */
export interface ProductForm {
  id: string;
  title: string;
  description: string;
  fabric: string;
  category: ProductCategory;
  price: string;
  compareAt: string;
  stockBySize: Record<string, string>;
  isNew: boolean;
  isBest: boolean;
  onSale: boolean;
  image: string;
}

export interface FieldErrors {
  title?: string;
  description?: string;
  price?: string;
  compareAt?: string;
  stock?: Record<string, string>;
}

export function formFromProduct(product: Product): ProductForm {
  const stockBySize: Record<string, string> = {};
  for (const size of product.sizes) {
    stockBySize[size] = String(product.stockPerSize[size] ?? 0);
  }
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    fabric: product.fabric,
    category: product.category,
    price: String(product.price),
    compareAt: product.originalPrice === undefined || product.originalPrice === null ? '' : String(product.originalPrice),
    stockBySize,
    isNew: product.isNewArrival === true,
    isBest: product.isBestSeller === true,
    onSale: product.onSale === true,
    image: product.image,
  };
}

/**
 * Merges the edited fields back onto the untouched product so colours, craft notes,
 * ratings and everything else the panel does not expose survive a save. Only called
 * after `validateForm` reports no errors, so the numeric coercion is safe.
 */
export function buildProduct(base: Product, form: ProductForm): Product {
  const stockPerSize: Record<string, number> = {};
  for (const size of base.sizes) {
    const raw = (form.stockBySize[size] ?? '').trim();
    stockPerSize[size] = /^\d+$/.test(raw) ? Number(raw) : 0;
  }
  const compareAt = form.compareAt.trim() === '' ? undefined : Number(form.compareAt);
  return {
    ...base,
    title: form.title.trim(),
    description: form.description.trim(),
    fabric: form.fabric.trim(),
    category: form.category,
    price: Number(form.price),
    originalPrice: compareAt,
    image: form.image,
    stockPerSize,
    isNewArrival: form.isNew,
    isBestSeller: form.isBest,
    onSale: form.onSale,
  };
}

const PRICE_RE = /^\d+(?:\.\d{1,2})?$/;
const INT_RE = /^\d+$/;

function priceError(raw: string, required: boolean): string | undefined {
  const value = raw.trim();
  if (!value) return required ? 'Enter a price.' : undefined;
  if (!PRICE_RE.test(value)) return 'Use a number with at most 2 decimal places.';
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 100000) return 'Must be between 1 and 100,000.';
  return undefined;
}

function stockError(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return 'Enter a count, or 0.';
  if (!INT_RE.test(value)) return 'Whole numbers only.';
  const n = Number(value);
  if (n > 9999) return '9,999 is the maximum.';
  return undefined;
}

export function validateForm(form: ProductForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = 'Give the piece a name.';
  if (!form.description.trim()) errors.description = 'Add a short description.';
  const price = priceError(form.price, true);
  if (price) errors.price = price;
  const compare = priceError(form.compareAt, false);
  if (compare) errors.compareAt = compare;
  const stock: Record<string, string> = {};
  for (const size of Object.keys(form.stockBySize)) {
    const err = stockError(form.stockBySize[size]);
    if (err) stock[size] = err;
  }
  if (Object.keys(stock).length) errors.stock = stock;
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Boolean(errors.title || errors.description || errors.price || errors.compareAt || errors.stock);
}

/** The shop service flags a stale-revision rejection with this exact sentence. */
export function isStaleRevisionMessage(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.includes('Reload to see the latest');
}
