import { GST_RATES, Product, ProductColor } from '../../types';
import { isUsableImage } from '../../shop/schema';

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
  craftTechnique: string;
  careInstructions: string;
  fitNote: string;
  category: string;
  newCategory: string;
  price: string;
  compareAt: string;
  sizes: string[];
  stockBySize: Record<string, string>;
  colors: ProductColor[];
  images: string[];
  sku: string;
  hsnCode: string;
  gstPercent: string;
  weightGrams: string;
  status: 'published' | 'draft';
  isNew: boolean;
  isBest: boolean;
  onSale: boolean;
}

export interface FieldErrors {
  title?: string;
  description?: string;
  price?: string;
  compareAt?: string;
  stock?: Record<string, string>;
  sizes?: string;
  colors?: string;
  images?: string;
  category?: string;
  sku?: string;
  hsnCode?: string;
  gstPercent?: string;
  weightGrams?: string;
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
    craftTechnique: product.craftTechnique,
    careInstructions: product.careInstructions,
    fitNote: product.fitNote,
    category: product.category,
    newCategory: '',
    price: String(product.price),
    compareAt: product.originalPrice === undefined || product.originalPrice === null ? '' : String(product.originalPrice),
    sizes: [...product.sizes],
    stockBySize,
    colors: product.colors.map((color) => ({ ...color })),
    images: (product.images ?? []).filter(isUsableImage).length
      ? (product.images as string[]).filter(isUsableImage)
      : [product.image],
    sku: product.sku ?? '',
    hsnCode: product.hsnCode ?? '',
    gstPercent: product.gstPercent === undefined ? '' : String(product.gstPercent),
    weightGrams: product.weightGrams === undefined ? '' : String(product.weightGrams),
    status: product.status === 'draft' ? 'draft' : 'published',
    isNew: product.isNewArrival === true,
    isBest: product.isBestSeller === true,
    onSale: product.onSale === true,
  };
}

/**
 * Merges the edited fields back onto the untouched product so ratings and anything else
 * this form does not expose survive a save. Only called after `validateForm` reports no
 * errors, so the numeric coercion is safe. Stock keys follow the size list, which is why
 * removing a size also drops its count.
 */
export function buildProduct(base: Product, form: ProductForm): Product {
  const stockPerSize: Record<string, number> = {};
  for (const size of form.sizes) {
    const raw = (form.stockBySize[size] ?? '').trim();
    stockPerSize[size] = /^\d+$/.test(raw) ? Number(raw) : 0;
  }
  const compareAt = form.compareAt.trim() === '' ? undefined : Number(form.compareAt);
  const category = (form.newCategory.trim() || form.category).trim();
  const images = form.images.filter(isUsableImage);
  const optional = (value: string) => (value.trim() === '' ? undefined : value.trim());
  return {
    ...base,
    title: form.title.trim(),
    description: form.description.trim(),
    fabric: form.fabric.trim(),
    craftTechnique: form.craftTechnique.trim(),
    careInstructions: form.careInstructions.trim(),
    fitNote: form.fitNote.trim(),
    category,
    price: Number(form.price),
    originalPrice: compareAt,
    image: images[0] ?? base.image,
    images,
    colors: form.colors.map((color) => ({ name: color.name.trim(), hex: color.hex })),
    sizes: [...form.sizes],
    stockPerSize,
    sku: optional(form.sku),
    hsnCode: optional(form.hsnCode),
    gstPercent: optional(form.gstPercent) === undefined ? undefined : Number(form.gstPercent),
    weightGrams: optional(form.weightGrams) === undefined ? undefined : Number(form.weightGrams),
    status: form.status,
    isNewArrival: form.isNew,
    isBestSeller: form.isBest,
    onSale: form.onSale,
  };
}

const PRICE_RE = /^\d+(?:\.\d{1,2})?$/;
const INT_RE = /^\d+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const CATEGORY_BAD = /[<>"'`\\\/]/;

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

/** Optional whole-number field with a range, e.g. courier weight. */
function optionalIntError(raw: string, max: number, label: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  if (!INT_RE.test(value)) return 'Whole numbers only.';
  const n = Number(value);
  if (n < 1 || n > max) return `Must be between 1 and ${max.toLocaleString('en-IN')}.`;
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

  if (form.sizes.length === 0) errors.sizes = 'A product needs at least one size.';
  else if (form.sizes.length > 12) errors.sizes = 'Twelve sizes is the maximum.';
  else if (new Set(form.sizes.map((s) => s.toLowerCase())).size !== form.sizes.length) {
    errors.sizes = 'Two sizes have the same name.';
  } else if (form.sizes.some((s) => !s.trim() || s.length > 24)) {
    errors.sizes = 'Keep each size label under 24 characters.';
  }

  if (form.colors.length === 0) errors.colors = 'Add at least one colour.';
  else if (form.colors.length > 8) errors.colors = 'Eight colours is the maximum.';
  else if (form.colors.some((c) => !c.name.trim() || c.name.trim().length > 40 || !HEX_RE.test(c.hex))) {
    errors.colors = 'Each colour needs a name and a hex value like #EDE8DF.';
  }

  if (form.images.length === 0) errors.images = 'Choose at least one picture.';
  else if (form.images.length > 6) errors.images = 'Six pictures is the maximum.';
  else if (form.images.some((ref) => !isUsableImage(ref))) errors.images = 'One picture reference is invalid.';

  const category = (form.newCategory.trim() || form.category).trim();
  if (category.length < 2) errors.category = 'A category name needs at least 2 characters.';
  else if (category.length > 40) errors.category = 'Keep the category name under 40 characters.';
  else if (CATEGORY_BAD.test(category)) errors.category = 'Avoid these characters in a category name: < > " \' ` \\ /';

  if (form.sku.trim().length > 64) errors.sku = 'Keep the SKU under 64 characters.';
  if (form.hsnCode.trim().length > 20) errors.hsnCode = 'Keep the HSN/SAC code under 20 characters.';
  if (form.gstPercent.trim() !== '' && !GST_RATES.includes(Number(form.gstPercent) as (typeof GST_RATES)[number])) {
    errors.gstPercent = 'Pick 0, 5, 12, 18 or 28.';
  }
  const weight = optionalIntError(form.weightGrams, 5000, 'weight');
  if (weight) errors.weightGrams = weight;

  const stock: Record<string, string> = {};
  for (const size of form.sizes) {
    const err = stockError(form.stockBySize[size] ?? '');
    if (err) stock[size] = err;
  }
  if (Object.keys(stock).length) errors.stock = stock;
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Boolean(
    errors.title ||
      errors.description ||
      errors.price ||
      errors.compareAt ||
      errors.stock ||
      errors.sizes ||
      errors.colors ||
      errors.images ||
      errors.category ||
      errors.sku ||
      errors.hsnCode ||
      errors.gstPercent ||
      errors.weightGrams,
  );
}

/** The shop service flags a stale-revision rejection with this exact sentence. */
export function isStaleRevisionMessage(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.includes('Reload to see the latest');
}
