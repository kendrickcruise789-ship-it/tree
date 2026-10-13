import { Currency, GST_RATES, Product, ProductColor } from '../types';
import { PRODUCTS, ALL_COLORS } from '../data/products';
import { CatalogueDocument, SessionState, asImageRef, isUsableImage } from './schema';
import { ApiError, requestJson } from './request';

const ENDPOINT = '/functions/v1/app';

const WRITE_MESSAGES: Record<string, string> = {
  login_required: 'Sign in with your Qoder account to manage the shop.',
  not_owner: 'This shop is already owned by another account. Sign in as that account to edit it.',
  owner_taken: 'Someone else has already claimed this shop.',
  already_owner: 'You already manage this shop.',
  owner_unclaimed: 'Claim this shop before publishing a catalogue to it.',
  catalogue_changed: 'The shop changed while you were editing. Reload to see the latest before saving again.',
  duplicate_id: 'That product number is already used by another piece.',
  not_found: 'That piece is no longer in the shop.',
  invalid_input: 'That entry was not accepted. Check the values you typed.',
  unsupported_image: 'Use a JPG, PNG or WebP picture under 6 MB.',
  too_large: 'That file is too big. Use a picture under 6 MB.',
  write_rejected: 'The change was refused. Nothing was saved.',
  write_result_unknown: 'The save did not finish cleanly. Reload and check the price before editing again.',
  service_unavailable: 'This copy of the site has no shop service behind it.',
};

const num = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const text = (value: unknown, fallback: string, max: number): string =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;

const flag = (value: unknown): boolean => value === true;

function parseColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];
  const known = new Map(ALL_COLORS.map((c) => [c.name.toLowerCase(), c]));
  return value.slice(0, 8).reduce<ProductColor[]>((acc, entry) => {
    if (typeof entry === 'string') {
      const match = known.get(entry.trim().toLowerCase());
      if (match) acc.push({ ...match });
      else if (/^#[0-9a-f]{6}$/i.test(entry.trim())) acc.push({ name: text(entry, 'Colour', 40), hex: entry.trim() });
      return acc;
    }
    if (entry && typeof entry === 'object') {
      const raw = entry as Record<string, unknown>;
      const hex = typeof raw.hex === 'string' && /^#[0-9a-f]{6}$/i.test(raw.hex.trim()) ? raw.hex.trim() : '';
      const name = text(raw.name, '', 40);
      if (name && hex) acc.push({ name, hex });
    }
    return acc;
  }, []);
}

function parseStock(value: unknown, sizes: string[]): Record<string, number> {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  const result: Record<string, number> = {};
  for (const size of sizes) {
    result[size] = Math.round(num(source[size], 0, 0, 9999));
  }
  return result;
}

/** Server rows are treated as untrusted input: anything malformed falls back to a safe value. */
export function parseProduct(value: unknown): Product | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = text(raw.id, '', 64);
  if (!id) return null;
  const sizes = Array.isArray(raw.sizes)
    ? raw.sizes.slice(0, 12).map((s) => text(s, '', 24)).filter(Boolean)
    : ['Standard'];
  // A category the owner created must survive a round trip, so this is free text and not
  // the built-in union — falling back to 'Dresses' would silently re-file their products.
  const category = text(raw.category, 'Dresses', 40);
  const price = Math.round(num(raw.price, 0, 1, 100000) * 100) / 100;
  const originalPrice = raw.originalPrice === undefined || raw.originalPrice === null || raw.originalPrice === ''
    ? undefined
    : Math.round(num(raw.originalPrice, price, 1, 100000) * 100) / 100;
  const image = text(raw.image, 'bundled:mannequinDress', 512);
  const images = Array.isArray(raw.images)
    ? raw.images.slice(0, 6).map((ref) => asImageRef(text(ref, '', 512))).filter((ref) => isUsableImage(ref))
    : [];
  // A missing GST rate stays missing: 0% is a real tax slab, not "unknown".
  const gst = raw.gstPercent === undefined || raw.gstPercent === null || raw.gstPercent === ''
    ? undefined
    : Math.round(num(raw.gstPercent, 0, 0, 28));
  const status = raw.status === 'draft' ? 'draft' : 'published';
  return {
    id,
    title: text(raw.title, 'Untitled piece', 140),
    category,
    price,
    originalPrice,
    image: asImageRef(image),
    images: images.length ? images : [asImageRef(image)],
    colors: parseColors(raw.colors),
    sizes,
    stockPerSize: parseStock(raw.stockPerSize, sizes),
    description: text(raw.description, '', 1200),
    fabric: text(raw.fabric, '', 80),
    craftTechnique: text(raw.craftTechnique, '', 400),
    careInstructions: text(raw.careInstructions, '', 400),
    fitNote: text(raw.fitNote, '', 300),
    rating: num(raw.rating, 0, 0, 5),
    reviewsCount: Math.round(num(raw.reviewsCount, 0, 0, 1000000)),
    sku: raw.sku === undefined || raw.sku === null ? undefined : text(raw.sku, '', 64) || undefined,
    hsnCode: raw.hsnCode === undefined || raw.hsnCode === null ? undefined : text(raw.hsnCode, '', 20) || undefined,
    gstPercent: gst !== undefined && GST_RATES.includes(gst as (typeof GST_RATES)[number]) ? gst : undefined,
    weightGrams: raw.weightGrams === undefined || raw.weightGrams === null
      ? undefined
      : Math.round(num(raw.weightGrams, 0, 0, 5000)) || undefined,
    status,
    isNewArrival: flag(raw.isNewArrival),
    isBestSeller: flag(raw.isBestSeller),
    onSale: flag(raw.onSale),
  };
}

function parseCatalogue(data: unknown): CatalogueDocument {
  const raw = (data ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(raw.products) ? raw.products : [];
  const products = rows.map(parseProduct).filter((p): p is Product => p !== null);
  if (!products.length) throw new ApiError('The shop service returned no products.', 'invalid_payload');
  return {
    revision: Math.round(num(raw.revision, 0, 0, Number.MAX_SAFE_INTEGER)),
    updatedAt: text(raw.updatedAt, '', 40),
    products,
  };
}

export function bundledCatalogue(): CatalogueDocument {
  return {
    revision: 0,
    updatedAt: '',
    products: PRODUCTS.map((product) => ({ ...product, image: asImageRef(product.image) })),
  };
}

export type CatalogueSource = 'shop' | 'unseeded' | 'bundled';

export interface CatalogueResult {
  products: Product[];
  revision: number;
  updatedAt: string;
  /** 'shop' is the owner's live data; 'unseeded' means the service answered but nothing is published; 'bundled' is the baked-in copy. */
  source: CatalogueSource;
}

/**
 * Customers must always be able to shop, so a missing or failing shop service falls
 * back to the catalogue baked into the build (which is what the GitHub Pages copy has).
 */
export async function loadCatalogue(signal?: AbortSignal): Promise<CatalogueResult> {
  const fallback = bundledCatalogue();
  try {
    const data = await requestJson(`${ENDPOINT}?action=catalogue`, { signal });
    const doc = parseCatalogue(data);
    return { ...doc, source: 'shop' };
  } catch (error) {
    const source: CatalogueSource =
      error instanceof ApiError && error.code === 'catalogue_missing' ? 'unseeded' : 'bundled';
    return { ...fallback, source };
  }
}

export async function fetchSession(): Promise<SessionState> {
  let data: unknown;
  try {
    data = await requestJson(`${ENDPOINT}?action=session`);
  } catch {
    return { status: 'service_unavailable' };
  }
  const raw = (data ?? {}) as Record<string, unknown>;
  const role = text(raw.role, 'visitor', 16);
  const ownerClaimed = flag(raw.ownerClaimed);
  if (role === 'owner') {
    const owner = (raw.owner ?? {}) as Record<string, unknown>;
    return {
      status: 'owner',
      owner: {
        name: text(owner.name, 'Shop owner', 60),
        picture: typeof owner.picture === 'string' && /^https:\/\//.test(owner.picture) ? owner.picture : '',
        claimedAt: text(owner.claimedAt, '', 40),
      },
    };
  }
  const signedIn = raw.signedIn === true;
  if (!signedIn) return { status: 'signed_out', ownerClaimed };
  if (!ownerClaimed) return { status: 'unclaimed' };
  return { status: 'not_owner', ownerClaimed: true };
}

export async function claimShop(): Promise<{ ok: boolean; error?: string }> {
  try {
    await requestJson(
      `${ENDPOINT}?action=owner.claim`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      WRITE_MESSAGES,
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.message : 'Could not claim the shop.' };
  }
}

export type ProductChange = { kind: 'save'; product: Product } | { kind: 'create'; product: Product } | { kind: 'retire'; id: string };

/** Every write carries the revision the editor last saw, so a stale tab cannot silently overwrite the shop. */
export async function applyChange(
  baseRevision: number,
  change: ProductChange,
): Promise<{ revision: number; products: Product[] } | { error: string; unknownOutcome: boolean }> {
  const action = change.kind === 'save' ? 'product.save' : change.kind === 'create' ? 'product.create' : 'product.retire';
  const payload = change.kind === 'retire' ? { id: change.id } : { product: change.product };
  try {
    const data = await requestJson(
      `${ENDPOINT}?action=${action}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, baseRevision }),
      },
      WRITE_MESSAGES,
    );
    const doc = parseCatalogue(data);
    return { revision: doc.revision, products: doc.products };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'That change did not go through.';
    return {
      error: message,
      unknownOutcome: error instanceof ApiError && error.code === 'write_result_unknown',
    };
  }
}

/** Replaces the live shop with the catalogue baked into this build. */
export async function resetCatalogueToBundled(baseRevision: number): Promise<{ revision: number; products: Product[] } | { error: string }> {
  const messages = WRITE_MESSAGES;
  try {
    const data = await requestJson(
      `${ENDPOINT}?action=catalogue.seed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseRevision, products: bundledCatalogue().products }),
      },
      messages,
    );
    const doc = parseCatalogue(data);
    return { revision: doc.revision, products: doc.products };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Reset did not finish.' };
  }
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadProductImage(file: File): Promise<{ ref: string } | { error: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: WRITE_MESSAGES.unsupported_image };
  if (file.size > MAX_IMAGE_BYTES) return { error: WRITE_MESSAGES.too_large };
  try {
    const data = await requestJson(
      `${ENDPOINT}?action=image.upload`,
      { method: 'POST', body: file, headers: { 'Content-Type': file.type } },
      WRITE_MESSAGES,
    );
    const ref = (data as Record<string, unknown>)?.ref;
    if (typeof ref !== 'string' || !ref.startsWith('shop:')) return { error: WRITE_MESSAGES.write_result_unknown };
    return { ref };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Upload failed.' };
  }
}

export const CURRENCY_CODES: Currency[] = ['USD', 'INR', 'EUR', 'GBP'];
