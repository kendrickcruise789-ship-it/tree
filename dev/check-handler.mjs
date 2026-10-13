// Exercises the published handler in-process against the fake bucket. This proves
// application behaviour only: not the Gateway, not the real bucket, not provider policies.
import { createAppHandler } from '../functions/handler.mjs';
import { createFakeStorage } from './fake-storage.mjs';
import { encodeUserContext } from './shop-server.mjs';

const OWNER = 'owner-account';
const OTHER = 'somebody-else';

function contextFor(userId) {
  if (!userId) return {};
  return { 'x-qoder-user-context': encodeUserContext(userId) };
}

const results = [];
async function check(name, expectation, run) {
  try {
    const actual = await run();
    const ok = await expectation(actual);
    results.push({ name, ok: ok === true, actual });
  } catch (error) {
    results.push({ name, ok: false, actual: `threw ${error?.message ?? error}` });
  }
}

const status = (response) => response.status;

function makeSetup() {
  const storage = createFakeStorage();
  const handler = createAppHandler({ storage });
  const call = (action, { method = 'GET', user = OWNER, body, headers = {}, type = 'json' } = {}) => {
    const base = contextFor(user);
    const init = { method, headers: { ...base, ...headers } };
    if (body !== undefined) {
      if (type === 'json') {
        init.headers['content-type'] = 'application/json';
        init.body = JSON.stringify(body);
      } else {
        init.headers['content-type'] = type;
        init.body = body;
      }
    }
    return handler(new Request(`http://localhost/functions/v1/app?action=${action}`, init));
  };
  return { storage, handler, call };
}

const validProduct = (overrides = {}) => ({
  id: 'dr-001',
  title: 'Aurelia Tiered Maxi Dress',
  category: 'Dresses',
  price: 138,
  originalPrice: 165,
  image: 'bundled:mannequinDress',
  colors: [{ name: 'Sage Green', hex: '#879883' }],
  sizes: ['S', 'M'],
  stockPerSize: { S: 4, M: 2 },
  description: 'Tiered mulmul cotton dress with botanical block prints.',
  fabric: 'Organic Mulmul Cotton',
  craftTechnique: 'Double-stamped Bagru block print.',
  careInstructions: 'Gentle hand wash in cold water.',
  fitNote: 'Relaxed fit.',
  rating: 4.9,
  reviewsCount: 42,
  isBestSeller: true,
  ...overrides,
});

const { call, storage, handler } = makeSetup();

await check('unknown action is not a success', (s) => s === 404, async () => status(await call('nonsense')));
await check('catalogue before seeding is missing, not empty', (s) => s === 404, async () => status(await call('catalogue')));
await check('session works with no login', async (s) => s.ok === true && s.role === 'visitor', async () => {
  const r = await call('session', { user: null });
  return await r.json();
});
await check('owner claim needs a login', (s) => s === 401, async () => status(await call('owner.claim', { user: null, body: {}, method: 'POST' })));
await check('owner claim succeeds once', (s) => s.ok === true && s.role === 'owner', async () => await (await call('owner.claim', { body: {}, method: 'POST' })).json());
await check('second claim from another account is refused', (s) => s === 409, async () => status(await call('owner.claim', { user: OTHER, body: {}, method: 'POST' })));
await check('another account cannot write the catalogue', (s) => s === 403, async () => status(await call('product.save', { user: OTHER, method: 'POST', body: { baseRevision: 0, product: validProduct() } })));
await check('anonymous cannot write the catalogue', (s) => s === 401, async () => status(await call('product.save', { user: null, method: 'POST', body: { baseRevision: 0, product: validProduct() } })));
await check('saving a product that does not exist is refused', (s) => s === 404, async () =>
  status(await call('product.save', { method: 'POST', body: { baseRevision: 0, product: validProduct() } })));
await check('GET must not mutate', async (s) => s.revision === 1, async () => {
  const saved = await call('product.create', { method: 'POST', body: { baseRevision: 0, product: validProduct() } });
  const doc = await saved.json();
  await call('catalogue');
  await call('session');
  return doc;
});
await check('creating the same id twice is refused', (s) => s === 409, async () =>
  status(await call('product.create', { method: 'POST', body: { baseRevision: 1, product: validProduct() } })));
await check('stale revision is refused', (s) => s === 409, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 0, product: validProduct({ price: 99 }) } })));
await check('out-of-range price is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ price: -5 }) } })));
await check('non-integer stock is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ stockPerSize: { S: 1.5, M: 2 } }) } })));
await check('image pointing at another host is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ image: 'http://evil.example/a.jpg' }) } })));
await check('javascript: image is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ image: 'javascript:alert(1)' }) } })));
await check('category with markup or a path is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ category: 'Weapons/<x>' }) } })));
await check('one-letter category is refused', (s) => s === 400, async () => status(await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ category: 'W' }) } })));
await check('unknown extra field is dropped, not stored', (s) => s.price === 138 && s.adminNote === undefined, async () => {
  await call('product.save', { method: 'POST', body: { baseRevision: 1, product: validProduct({ adminNote: 'leak' }) } });
  const doc = await (await call('catalogue', { user: null })).json();
  return doc.products[0];
});
await check('non-JSON body is refused', (s) => s === 400, async () =>
  status(await call('product.save', { method: 'POST', type: 'text/plain', body: 'not json' })));
await check('customers can read the seeded catalogue', async (s) => s.ok === true && s.products.length === 1, async () => await (await call('catalogue', { user: null })).json());

// Upload a real image, then make sure it is only served while the catalogue points at it.
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]);
let uploadedRef = '';
await check('image upload is verified against stored bytes', async (r) => r.ok === true && r.ref.startsWith('shop:'), async () => {
  const response = await call('image.upload', { method: 'POST', type: 'image/jpeg', body: jpeg });
  const jsonBody = await response.json();
  uploadedRef = jsonBody.ref ?? '';
  return jsonBody;
});
await check('unsupported upload type is refused', (s) => s === 415, async () => status(await call('image.upload', { method: 'POST', type: 'application/x-msdownload', body: jpeg })));
await check('image id with traversal is refused', (s) => s === 400, async () =>
  status(await handler(new Request('http://localhost/functions/v1/app?action=image&id=../../etc/passwd'))));
const fetchImage = (id) => handler(new Request(`http://localhost/functions/v1/app?action=image&id=${encodeURIComponent(id)}`));
await check('unreferenced upload is not servable', (s) => s === 404, async () =>
  status(await fetchImage(uploadedRef.slice('shop:'.length))));
await check('referenced image redirects to a signed url', (s) => s === 302, async () => {
  await call('product.save', { method: 'POST', body: { baseRevision: 2, product: validProduct({ image: uploadedRef }) } });
  return status(await fetchImage(uploadedRef.slice('shop:'.length)));
});
await check('retire removes the product', (s) => s.ok === true && s.products.length === 0, async () => {
  const doc = await (await call('product.retire', { method: 'POST', body: { baseRevision: 3, id: 'dr-001' } })).json();
  return doc;
});
await check('retiring a missing product is not a success', (s) => s === 404, async () => status(await call('product.retire', { method: 'POST', body: { baseRevision: 4, id: 'nope' } })));

// Full product management: a category the owner invented, a gallery of the owner's own
// photos, draft visibility and Indian compliance fields must all survive a round trip.
const first = async () => (await (await call('catalogue', { user: null })).json()).products[0];

await check('owner-created category is accepted', async (doc) => doc.ok === true && doc.products[0].category === 'Sarees', async () => {
  const created = await call('product.create', { method: 'POST', body: { baseRevision: 4, product: validProduct({ id: 'sa-001', category: 'Sarees' }) } });
  return await created.json();
});
await check('gallery keeps its order and mirrors the first photo into image', async (product) =>
  product.image === 'bundled:mannequinDress'
  && product.images.length === 2
  && product.images[0] === 'bundled:mannequinDress'
  && product.images[1] === uploadedRef, async () => {
  await call('product.save', { method: 'POST', body: { baseRevision: 5, product: validProduct({ id: 'sa-001', category: 'Sarees', images: ['bundled:mannequinDress', uploadedRef] }) } });
  return await first();
});
await check('bad photo inside a gallery rejects the whole product', (s) => s === 400, async () =>
  status(await call('product.save', { method: 'POST', body: { baseRevision: 6, product: validProduct({ id: 'sa-001', images: ['bundled:mannequinDress', 'http://evil.example/a.jpg'] }) } })));
await check('gallery longer than six photos is refused', (s) => s === 400, async () =>
  status(await call('product.save', { method: 'POST', body: { baseRevision: 6, product: validProduct({ id: 'sa-001', images: Array.from({ length: 7 }, () => 'bundled:mannequinDress') }) } })));
await check('gst rate outside the slabs is refused', (s) => s === 400, async () =>
  status(await call('product.save', { method: 'POST', body: { baseRevision: 6, product: validProduct({ id: 'sa-001', gstPercent: 7 }) } })));
await check('owner can add sizes the code never knew about', async (product) =>
  product.sizes.includes('XXXL') && product.stockPerSize.XXXL === 3, async () => {
  await call('product.save', { method: 'POST', body: { baseRevision: 6, product: validProduct({ id: 'sa-001', sizes: ['S', 'XXXL'], stockPerSize: { S: 4, XXXL: 3 } }) } });
  return await first();
});
await check('draft status and compliance fields round trip', async (product) =>
  product.status === 'draft' && product.sku === 'RB-SA-001' && product.hsnCode === '6204' && product.gstPercent === 12 && product.weightGrams === 350, async () => {
  await call('product.save', { method: 'POST', body: { baseRevision: 7, product: validProduct({ id: 'sa-001', status: 'draft', sku: 'RB-SA-001', hsnCode: '6204', gstPercent: 12, weightGrams: 350 }) } });
  return await first();
});

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      got: ${JSON.stringify(r.actual)}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
