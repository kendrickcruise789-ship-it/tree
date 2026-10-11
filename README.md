# Clotex

A storefront prototype for a hand-block-printed apparel and home-textiles brand: 80 products across
dresses, co-ords, kurtas, kaftans, bedsheets, home and gifts, with cart, wishlist, coupons, four
currencies and a multi-step checkout.

Built with React 19, Vite, TypeScript and Tailwind CSS v4. No backend — everything runs in the
browser and shopping state lives in `localStorage`.

> **Demo flows.** Sign-in accepts any email and password, card / UPI / 1-tap / cash-on-delivery
> payments are simulated, and parcel tracking shows invented shipment stages. No money moves, and
> no email or SMS is sent. Every one of these screens says so in the UI.

## Quick start

**No commands.** Install [Node.js](https://nodejs.org) once, then double-click **`Open Clotex.bat`**.
It serves the finished site in `dist/` at http://localhost:8080 and opens your browser.

**Or from the command line:**

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | `tsc --noEmit` type check |

## Project layout

```
src/
  App.tsx                 central state: cart, wishlist, currency, filters, session
  components/             19 screens and overlays (product grid, drawers, checkout, modals)
  data/products.ts        the whole catalogue, currencies, filter vocabularies, shipping rules
  utils/                  price formatting, overlay behaviour, image fallbacks
public/                   favicon and social preview image
dist/                     committed production build
```

The catalogue is plain TypeScript, so adding or editing a product means editing one array in
`src/data/products.ts` — the price filter ceiling and colour vocabulary derive from it.

## How the storefront behaves

- **Persistence** — cart, wishlist, chosen currency, coupon and gift wrap survive a reload under the
  `clotex_state_v1` key. The signed-in session is stored separately and only when "Remember this
  device" is ticked.
- **Stock** — each size carries its own stock count; quantity steppers clamp to it and disable when
  reached. Out-of-stock sizes are unclickable.
- **Money** — prices convert through `CURRENCY_CONFIGS` (USD, INR, EUR, GBP). Free express shipping
  starts at a USD 120 subtotal (`FREE_SHIPPING_THRESHOLD_USD`), otherwise a flat courier fee applies;
  both the banner and the checkout copy derive from those constants.
- **Coupons** — `CLOTEX10` and `WELCOME15`.
- **Accessibility** — all nine overlays respond to Escape, close on backdrop click, lock background
  scroll, expose `role="dialog"` / `aria-modal`, and move focus into the panel. Product actions are
  visible on touch devices rather than hover-only.

## Deploying

`vite.config.ts` sets `base: './'`, so `dist/` works from any path — including GitHub Pages
(Settings → Pages → Deploy from branch → `dist` / `main`), Netlify, Vercel or any static host.
The repo tracks `dist/`; rebuild it (`npm run build`) whenever `src/` changes.

## Known limitations

- Roughly 80 products share 10 studio photographs, so similar items look alike.
- Small 10–12px text in `#7A6B5D` / `#A89C8F` on the cream background falls below WCAG AA contrast.
- No search backend, reviews are hard-coded, and there is no order history persistence.
