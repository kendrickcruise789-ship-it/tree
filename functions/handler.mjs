// Ram Rass shop service. One place where the customer-facing catalogue is read and the
// only place the owner's edits are accepted: identity comes from the Gateway-injected
// context, storage paths are derived here, and nothing about ownership is taken from
// the browser.
import { getUser, requireUser, UserContextError } from './auth.mjs';
import { verifyUploadedObject } from './storage-validation.mjs';

const OWNER_PATH = 'shop/owner.json';
const CATALOGUE_PATH = 'shop/catalogue.json';
const IMAGE_DIRECTORY = 'img';
const MAX_JSON_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_PRODUCTS = 300;
const IMAGE_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const SHOP_IMAGE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const BUNDLED_KEYS = [
  'mannequinDress', 'mannequinCoord', 'mannequinKurta', 'mannequinKaftan', 'bedsheet',
  'homeCushion', 'gifts', 'sale', 'tunicFlatlay', 'craftArtisan',
];

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
});
const fail = (code, status) => json({ error: code }, status);

const cleanText = (value, max) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!trimmed || new TextEncoder().encode(trimmed).length > max) return null;
  return trimmed;
};

const numberWithin = (value, { min, max, integer = false }) => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  // Integer fields reject 1.5 instead of quietly rounding it: a stock count the owner
  // typed is theirs, and silently changing it would misreport the shop.
  const clamped = integer ? (Number.isInteger(n) ? n : null) : Math.round(n * 100) / 100;
  if (clamped === null || clamped < min || clamped > max) return null;
  return clamped;
};

const boolFlag = (value) => value === true;

// Image references are an allowlist, not arbitrary strings: this is what stops the
// panel from turning the storefront into a redirector to any host on the internet.
function cleanImageRef(value) {
  const ref = cleanText(value, 512);
  if (!ref || /[\s@]/.test(ref)) return null;
  if (ref.startsWith('bundled:')) {
    return BUNDLED_KEYS.includes(ref.slice(8)) ? ref : null;
  }
  if (ref.startsWith('shop:')) {
    return SHOP_IMAGE.test(ref.slice(5)) ? ref : null;
  }
  // Anything that is not one of the two schemes above must be a plain https resource,
  // which also rejects javascript:, data: and file: before URL parsing.
  if (!ref.startsWith('https://')) return null;
  let url;
  try { url = new URL(ref); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')) return null;
  return ref;
}

function cleanColors(value) {
  if (!Array.isArray(value) || value.length > 8) return null;
  const colors = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const name = cleanText(entry.name, 40);
    const hex = cleanText(entry.hex, 7);
    if (!name || !hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
    colors.push({ name, hex });
  }
  return colors;
}

function cleanSizes(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const sizes = [];
  for (const entry of value) {
    const size = cleanText(entry, 24);
    if (!size || sizes.includes(size)) return null;
    sizes.push(size);
  }
  return sizes;
}

function cleanStock(value, sizes) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value;
  const stock = {};
  for (const size of sizes) {
    const count = numberWithin(source[size], { min: 0, max: 9999, integer: true });
    if (count === null) return null;
    stock[size] = count;
  }
  return stock;
}

// A category is free text now, because the owner creates new ones from the admin panel.
// It is still shape-checked: no angle brackets, quotes or backslashes can reach a document.
function cleanCategory(value) {
  const category = cleanText(value, 40);
  if (!category || category.length < 2) return null;
  if (/[<>"'`\\\/]/.test(category)) return null;
  return category;
}

const MAX_IMAGES = 6;

function cleanImages(value, primary) {
  if (value === undefined || value === null) return [primary];
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_IMAGES) return null;
  const refs = [];
  for (const entry of value) {
    const ref = cleanImageRef(entry);
    if (!ref) return null;
    refs.push(ref);
  }
  return refs;
}

const GST_RATES = [0, 5, 12, 18, 28];

/** Optional field: blank or missing means "not set", anything present must validate. */
function optionalNumber(value, { min, max, integer = false, allowed }) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = numberWithin(value, { min, max, integer });
  if (n === null) return null;
  if (allowed && !allowed.includes(n)) return null;
  return n;
}

// The server is the authority on what a product may contain: unknown keys are dropped
// and any out-of-range value rejects the whole product rather than being clamped.
function cleanProduct(value, { requireId }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value;
  const id = cleanText(raw.id, 64);
  if (!id || (requireId && !/^[a-z0-9][a-z0-9-]{1,63}$/.test(id))) return null;
  if (requireId && id === 'new') return null;
  const title = cleanText(raw.title, 140);
  const description = cleanText(raw.description, 1200);
  const fabric = cleanText(raw.fabric, 80);
  const craftTechnique = cleanText(raw.craftTechnique, 400);
  const careInstructions = cleanText(raw.careInstructions, 400);
  const fitNote = cleanText(raw.fitNote, 300);
  const image = cleanImageRef(raw.image);
  const colors = cleanColors(raw.colors);
  const sizes = cleanSizes(raw.sizes);
  const price = numberWithin(raw.price, { min: 1, max: 100000 });
  if (!title || !description || !fabric || !craftTechnique || !careInstructions || !fitNote) return null;
  if (!image || !colors || !sizes || price === null) return null;
  const category = cleanCategory(raw.category);
  if (!category) return null;
  const images = cleanImages(raw.images, image);
  if (!images) return null;
  const stockPerSize = cleanStock(raw.stockPerSize, sizes);
  if (!stockPerSize) return null;
  const originalPrice = raw.originalPrice === undefined || raw.originalPrice === null || raw.originalPrice === ''
    ? undefined
    : numberWithin(raw.originalPrice, { min: 1, max: 100000 });
  if (raw.originalPrice !== undefined && raw.originalPrice !== null && raw.originalPrice !== '' && originalPrice === null) return null;
  const rating = numberWithin(raw.rating ?? 0, { min: 0, max: 5 });
  const reviewsCount = numberWithin(raw.reviewsCount ?? 0, { min: 0, max: 1000000, integer: true });
  if (rating === null || reviewsCount === null) return null;
  const sku = raw.sku === undefined || raw.sku === null || raw.sku === '' ? undefined : cleanText(raw.sku, 64);
  if (raw.sku && sku === null) return null;
  const hsnCode = raw.hsnCode === undefined || raw.hsnCode === null || raw.hsnCode === ''
    ? undefined
    : cleanText(raw.hsnCode, 20);
  if (raw.hsnCode && hsnCode === null) return null;
  const gstPercent = optionalNumber(raw.gstPercent, { min: 0, max: 28, integer: true, allowed: GST_RATES });
  if (gstPercent === null) return null;
  const weightGrams = optionalNumber(raw.weightGrams, { min: 1, max: 5000, integer: true });
  if (weightGrams === null) return null;
  return {
    id,
    title,
    category,
    price,
    ...(originalPrice === undefined ? {} : { originalPrice }),
    // The primary picture is always the first gallery entry, so every existing surface
    // that reads `image` keeps working after the gallery is reordered.
    image: images[0],
    images,
    colors,
    sizes,
    stockPerSize,
    description,
    fabric,
    craftTechnique,
    careInstructions,
    fitNote,
    rating,
    reviewsCount,
    ...(sku === undefined ? {} : { sku }),
    ...(hsnCode === undefined ? {} : { hsnCode }),
    ...(gstPercent === undefined ? {} : { gstPercent }),
    ...(weightGrams === undefined ? {} : { weightGrams }),
    status: raw.status === 'draft' ? 'draft' : 'published',
    isNewArrival: boolFlag(raw.isNewArrival),
    isBestSeller: boolFlag(raw.isBestSeller),
    onSale: boolFlag(raw.onSale),
  };
}

async function readBoundedBody(request, maxBytes) {
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > maxBytes) return { error: 'too_large' };
  const reader = request.body?.getReader();
  if (!reader) return { error: 'invalid_input' };
  const deadline = Date.now() + 20000;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        await reader.cancel().catch(() => {});
        return { error: 'write_result_unknown' };
      }
      let timer;
      const raced = await Promise.race([
        reader.read(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('slow_body')), remaining); }),
      ]).catch(() => 'timeout');
      clearTimeout(timer);
      if (raced === 'timeout') {
        await reader.cancel().catch(() => {});
        return { error: 'write_result_unknown' };
      }
      const { done, value } = raced;
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        return { error: 'too_large' };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { bytes };
}

async function readJsonBody(request) {
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return { error: 'invalid_input' };
  const body = await readBoundedBody(request, MAX_JSON_BYTES);
  if (body.error) return body;
  try {
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body.bytes)) };
  } catch {
    return { error: 'invalid_input' };
  }
}

async function downloadJson(storage, path) {
  try {
    const response = await storage.download(path);
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > MAX_JSON_BYTES) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function uploadJson(storage, path, value) {
  await storage.upload(path, new TextEncoder().encode(JSON.stringify(value)), {
    contentType: 'application/json; charset=utf-8',
    upsert: true,
  });
}

async function readOwner(storage) {
  const raw = await downloadJson(storage, OWNER_PATH);
  if (!raw || typeof raw !== 'object') return null;
  const userId = cleanText(raw.userId, 128);
  if (!userId) return null;
  return {
    userId,
    name: cleanText(raw.name, 60) ?? 'Shop owner',
    picture: typeof raw.picture === 'string' && /^https:\/\//.test(raw.picture) ? raw.picture : '',
    claimedAt: cleanText(raw.claimedAt, 40) ?? '',
  };
}

async function readCatalogue(storage) {
  const raw = await downloadJson(storage, CATALOGUE_PATH);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.products)) return null;
  const revision = numberWithin(raw.revision, { min: 0, max: Number.MAX_SAFE_INTEGER, integer: true });
  if (revision === null) return null;
  return {
    revision,
    updatedAt: cleanText(raw.updatedAt, 40) ?? '',
    products: raw.products.map((p) => cleanProduct(p, { requireId: true })).filter(Boolean),
  };
}

const catalogueResponse = (doc) => json({ ok: true, action: 'catalogue', ...doc });

/**
 * Owner-only compare-and-set: the editor states the revision it last saw, so two people
 * in the panel cannot silently overwrite each other. This detects the common collision;
 * it is not an exclusive lock, and the read-back below classifies an unknown write.
 */
async function writeCatalogue(storage, baseRevision, apply) {
  const current = await readCatalogue(storage);
  const baseline = current ?? { revision: 0, updatedAt: '', products: [] };
  if (baseRevision !== baseline.revision) return fail('catalogue_changed', 409);
  const result = apply(baseline);
  if (result.error) return fail(result.error, result.status ?? 400);
  const next = {
    revision: baseline.revision + 1,
    updatedAt: new Date().toISOString(),
    products: result.products,
  };
  try {
    await uploadJson(storage, CATALOGUE_PATH, next);
  } catch {
    return fail('write_result_unknown', 503);
  }
  const confirmed = await readCatalogue(storage);
  if (!confirmed || confirmed.revision !== next.revision) return fail('write_result_unknown', 503);
  return json({ ok: true, ...confirmed });
}

export function createAppHandler({ storage }) {
  const ownerOnlyActions = new Set(['owner.claim', 'product.save', 'product.create', 'product.retire', 'catalogue.seed', 'image.upload']);

  async function route(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') ?? '';

    if (request.method === 'GET' && action === 'catalogue') {
      const doc = await readCatalogue(storage);
      if (!doc) return fail('catalogue_missing', 404);
      return catalogueResponse(doc);
    }

    if (request.method === 'GET' && action === 'image') {
      const id = url.searchParams.get('id') ?? '';
      if (!SHOP_IMAGE.test(id)) return fail('invalid_input', 400);
      const doc = await readCatalogue(storage);
      // Only serve a file the published catalogue actually points at.
      const referenced = Boolean(doc?.products.some((p) => p.image === `shop:${id}`));
      if (!referenced) return fail('not_found', 404);
      const signed = await storage.createSignedUrl(`${IMAGE_DIRECTORY}/${id}`, 600);
      const target = signed?.signedUrl;
      if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return fail('image_unavailable', 503);
      return new Response(null, { status: 302, headers: { location: target, 'cache-control': 'no-store' } });
    }

    if (request.method === 'GET' && action === 'session') {
      const user = getUser(request);
      const owner = await readOwner(storage);
      if (!user) return json({ ok: true, action: 'session', role: 'visitor', signedIn: false, ownerClaimed: Boolean(owner) });
      if (owner && owner.userId === user.user_id) {
        return json({
          ok: true, action: 'session', role: 'owner', signedIn: true, ownerClaimed: true,
          owner: { name: owner.name, picture: owner.picture, claimedAt: owner.claimedAt },
        });
      }
      return json({ ok: true, action: 'session', role: 'visitor', signedIn: true, ownerClaimed: Boolean(owner) });
    }

    if (request.method !== 'POST') {
      return ownerOnlyActions.has(action)
        ? fail('method_not_allowed', 405)
        : fail('not_found', 404);
    }

    if (action === 'owner.claim') {
      const user = requireUser(request);
      const existing = await readOwner(storage);
      if (existing) return fail(existing.userId === user.user_id ? 'already_owner' : 'owner_taken', 409);
      const record = {
        userId: user.user_id,
        name: user.name || 'Shop owner',
        picture: user.picture || '',
        claimedAt: new Date().toISOString(),
      };
      try {
        await uploadJson(storage, OWNER_PATH, record);
      } catch {
        return fail('write_result_unknown', 503);
      }
      const confirmed = await readOwner(storage);
      if (!confirmed || confirmed.userId !== record.userId) return fail('write_result_unknown', 503);
      return json({ ok: true, action: 'owner.claim', role: 'owner' });
    }

    if (!ownerOnlyActions.has(action)) return fail('not_found', 404);

    // Every remaining action is a shop edit: verified sign-in plus the claimed owner.
    const user = requireUser(request);
    const owner = await readOwner(storage);
    if (!owner) return fail('owner_unclaimed', 409);
    if (owner.userId !== user.user_id) return fail('not_owner', 403);

    if (action === 'image.upload') {
      const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
      const extension = IMAGE_EXTENSIONS[type ?? ''];
      if (!extension) return fail('unsupported_image', 415);
      const body = await readBoundedBody(request, MAX_IMAGE_BYTES);
      if (body.error) return fail(body.error, body.error === 'too_large' ? 413 : 400);
      const id = `${crypto.randomUUID()}.${extension}`;
      const objectPath = `${IMAGE_DIRECTORY}/${id}`;
      try {
        await storage.upload(objectPath, body.bytes, { contentType: type, upsert: false });
      } catch {
        return fail('write_result_unknown', 503);
      }
      // Record the picture only once the stored bytes have been read back.
      try {
        await verifyUploadedObject(await storage.download(objectPath), {
          maxBytes: MAX_IMAGE_BYTES,
          expectedBytes: body.bytes.byteLength,
          allowedContentTypes: [type],
        });
      } catch {
        await storage.remove([objectPath]).catch(() => {});
        return fail('write_rejected', 400);
      }
      return json({ ok: true, action: 'image.upload', ref: `shop:${id}` });
    }

    const parsed = await readJsonBody(request);
    if (parsed.error) return fail(parsed.error, parsed.error === 'too_large' ? 413 : 400);
    const input = parsed.value && typeof parsed.value === 'object' ? parsed.value : {};
    const baseRevision = numberWithin(input.baseRevision, { min: 0, max: Number.MAX_SAFE_INTEGER, integer: true });
    if (baseRevision === null) return fail('invalid_input', 400);

    if (action === 'product.save' || action === 'product.create') {
      const product = cleanProduct(input.product, { requireId: true });
      if (!product) return fail('invalid_input', 400);
      return writeCatalogue(storage, baseRevision, (doc) => {
        const index = doc.products.findIndex((p) => p.id === product.id);
        if (action === 'product.save' && index === -1) return { error: 'not_found', status: 404 };
        if (action === 'product.create' && index !== -1) return { error: 'duplicate_id', status: 409 };
        const products = [...doc.products];
        if (index === -1) {
          if (products.length >= MAX_PRODUCTS) return { error: 'too_large', status: 413 };
          products.push(product);
        } else {
          products[index] = product;
        }
        return { products };
      });
    }

    if (action === 'product.retire') {
      const id = cleanText(input.id, 64);
      if (!id) return fail('invalid_input', 400);
      return writeCatalogue(storage, baseRevision, (doc) => {
        const products = doc.products.filter((p) => p.id !== id);
        if (products.length === doc.products.length) return { error: 'not_found', status: 404 };
        return { products };
      });
    }

    // catalogue.seed publishes a whole catalogue at once, field-validated the same way.
    if (action === 'catalogue.seed') {
      if (!Array.isArray(input.products) || input.products.length === 0 || input.products.length > MAX_PRODUCTS) {
        return fail('invalid_input', 400);
      }
      const products = [];
      const seen = new Set();
      for (const entry of input.products) {
        const product = cleanProduct(entry, { requireId: true });
        if (!product || seen.has(product.id)) return fail('invalid_input', 400);
        seen.add(product.id);
        products.push(product);
      }
      return writeCatalogue(storage, baseRevision, () => ({ products }));
    }

    return fail('not_found', 404);
  }

  return async (request) => {
    try {
      return await route(request);
    } catch (error) {
      if (error instanceof UserContextError) return fail(error.code, error.status);
      return fail('service_unavailable', 503);
    }
  };
}
