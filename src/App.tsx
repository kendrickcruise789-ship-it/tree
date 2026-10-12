import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, Currency, ProductColor, OrderConfirmationData, UserAccount, FilterOptions, SitePage } from './types';
import { MAX_PRICE_CEILING, categoryLabel } from './data/products';
import { loadCatalogue, bundledCatalogue, CURRENCY_CODES, type CatalogueSource } from './shop/api';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { CategoryNav } from './components/CategoryNav';
import { FilterDrawer } from './components/FilterDrawer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { SearchModal } from './components/SearchModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { OwnerPanel } from './components/owner/OwnerPanel';
import { MarqueeStrip } from './components/MarqueeStrip';
import { AnimatedHeadline } from './components/AnimatedHeadline';
import { Reveal } from './components/Reveal';
import { Footer } from './components/Footer';

const STORAGE_KEY = 'clotex_state_v1';
const USER_KEY = 'clotex_user';
const KNOWN_COUPONS = new Set(['CLOTEX10', 'WELCOME15']);
const MAX_CART_LINES = 60;
const MAX_QUANTITY_PER_LINE = 99;

/**
 * A saved bag holds ids, never prices or product copies: the amount a shopper pays
 * always comes from the catalogue the shop is serving right now.
 */
interface CartLine {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

interface PersistedState {
  cartLines: CartLine[];
  wishlistIds: string[];
  currency: Currency;
  appliedCoupon: string;
  giftWrap: boolean;
}

const isCurrency = (value: unknown): value is Currency =>
  typeof value === 'string' && (CURRENCY_CODES as string[]).includes(value);

const firstString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) if (typeof candidate === 'string' && candidate) return candidate;
  return '';
};

function readCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const lines = new Map<string, CartLine>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    // Bags saved by the earlier build stored a whole product per line; only its id is reused.
    const legacyProduct = record.product && typeof record.product === 'object' && !Array.isArray(record.product)
      ? (record.product as Record<string, unknown>)
      : {};
    const legacyColor = record.selectedColor && typeof record.selectedColor === 'object' && !Array.isArray(record.selectedColor)
      ? (record.selectedColor as Record<string, unknown>)
      : {};
    const productId = firstString(record.productId, legacyProduct.id);
    const size = firstString(record.size, record.selectedSize);
    const color = firstString(record.color, legacyColor.name);
    const quantity = typeof record.quantity === 'number' ? record.quantity : Number(record.quantity);
    if (!productId || !size || !Number.isInteger(quantity) || quantity < 1) continue;
    const key = `${productId}|${size}|${color}`;
    const kept = lines.get(key);
    lines.set(key, {
      productId,
      size,
      color,
      quantity: Math.min(MAX_QUANTITY_PER_LINE, (kept?.quantity ?? 0) + quantity),
    });
    if (lines.size >= MAX_CART_LINES) break;
  }
  return [...lines.values()];
}

// Anything the browser hands back is treated as untrusted input, including a bag the
// owner edited by hand in dev tools.
function readPersisted(): PersistedState {
  let parsed: unknown = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const record = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
  const wishlistIds = Array.isArray(record.wishlistIds)
    ? record.wishlistIds.filter((id): id is string => typeof id === 'string' && id.length <= 64).slice(0, 200)
    : [];
  const coupon = typeof record.appliedCoupon === 'string' && KNOWN_COUPONS.has(record.appliedCoupon)
    ? record.appliedCoupon
    : '';
  return {
    cartLines: readCartLines(record.cartLines ?? record.cartItems),
    wishlistIds,
    currency: isCurrency(record.currency) ? record.currency : 'USD',
    appliedCoupon: coupon,
    giftWrap: record.giftWrap === true,
  };
}

function readPersistedUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const id = firstString(record.id);
    const fullName = firstString(record.fullName);
    const email = firstString(record.email);
    if (!id || !fullName || !email) return null;
    // Addresses stay out of long-lived storage: checkout re-asks for them.
    return { id, fullName, email, phone: firstString(record.phone) || undefined };
  } catch {
    return null;
  }
}

/**
 * Turns saved ids into bag lines against the live catalogue. A line whose piece was
 * retired or sold out stays in storage but is hidden until it is buyable again.
 */
function rehydrateCart(lines: CartLine[], catalogue: Product[]): CartItem[] {
  const items: CartItem[] = [];
  for (const line of lines) {
    const product = catalogue.find((p) => p.id === line.productId);
    if (!product) continue;
    const selectedColor = product.colors.find((c) => c.name === line.color) ?? product.colors[0];
    if (!selectedColor || !product.sizes.includes(line.size)) continue;
    const stock = product.stockPerSize[line.size] ?? 0;
    if (stock <= 0) continue;
    items.push({
      product,
      selectedSize: line.size,
      selectedColor,
      quantity: Math.min(stock, Math.max(1, line.quantity)),
    });
  }
  return items;
}

const pageFromHash = (): SitePage => {
  const hash = window.location.hash;
  if (hash === '#clothing') return 'clothing';
  if (hash === '#owner') return 'owner';
  return 'home';
};
const pageHash = (page: SitePage) => (page === 'clothing' ? '#clothing' : page === 'owner' ? '#owner' : '#home');

export default function App() {
  const persisted = useMemo(readPersisted, []);

  // Which half of the site the visitor is standing in
  const [page, setPage] = useState<SitePage>(pageFromHash);

  // The catalogue the shop is actually selling from
  const [catalogue, setCatalogue] = useState<Product[]>(() => bundledCatalogue().products);
  const [revision, setRevision] = useState(0);
  const [catalogueSource, setCatalogueSource] = useState<CatalogueSource>('bundled');

  // Currency State
  const [currency, setCurrency] = useState<Currency>(persisted.currency);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(readPersistedUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Category & Sorting
  const [activeCategory, setActiveCategory] = useState<string>('All Collections');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Filters State — the price range follows the shop's own most expensive piece
  const priceCeiling = useMemo(() => {
    const highest = catalogue.reduce((max, p) => Math.max(max, p.price), 0);
    return Math.max(MAX_PRICE_CEILING, Math.ceil(highest / 5) * 5);
  }, [catalogue]);

  const initialFilters: FilterOptions = {
    category: 'All Collections',
    minPrice: 0,
    maxPrice: priceCeiling,
    fabrics: [],
    sizes: [],
    colors: [],
    inStockOnly: false,
    onSaleOnly: false,
  };
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // When the owner reprices past the old top of the range, a shopper parked at that top
  // must not silently lose the new pieces.
  const lastCeiling = useRef(priceCeiling);
  useEffect(() => {
    const previous = lastCeiling.current;
    if (previous === priceCeiling) return;
    lastCeiling.current = priceCeiling;
    setFilters((prev) =>
      prev.maxPrice === previous || prev.maxPrice > priceCeiling
        ? { ...prev, maxPrice: priceCeiling }
        : prev,
    );
  }, [priceCeiling]);

  // Cart State — the bag is a list of ids, priced against the live catalogue on every render
  const [cartLines, setCartLines] = useState<CartLine[]>(persisted.cartLines);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>(persisted.appliedCoupon);
  const [giftWrap, setGiftWrap] = useState<boolean>(persisted.giftWrap);
  const cartItems = useMemo(() => rehydrateCart(cartLines, catalogue), [cartLines, catalogue]);

  // Wishlist State
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    () => new Set(persisted.wishlistIds ?? [])
  );
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState<boolean>(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);

  // Category normalization & matching helper
  const matchesCategory = (productCategory: string, targetCategory: string): boolean => {
    if (!targetCategory || targetCategory === 'All Collections' || targetCategory === 'All') {
      return true;
    }
    if (targetCategory === 'Sale') {
      return productCategory === 'Sale';
    }
    const normProduct = productCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normTarget = targetCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normProduct === normTarget) return true;

    // Forgiving matches for compound apparel names
    if (
      (normTarget.includes('kurta') || normTarget.includes('tunic')) &&
      (normProduct.includes('kurta') || normProduct.includes('tunic'))
    ) {
      return true;
    }
    if (normTarget.includes('coord') && normProduct.includes('coord')) {
      return true;
    }
    if (normTarget.includes('dress') && normProduct.includes('dress')) {
      return true;
    }
    if (normTarget.includes('kaftan') && normProduct.includes('kaftan')) {
      return true;
    }
    if (normTarget.includes('bedsheet') && normProduct.includes('bedsheet')) {
      return true;
    }
    if (normTarget.includes('home') && normProduct.includes('home')) {
      return true;
    }
    if (normTarget.includes('gift') && normProduct.includes('gift')) {
      return true;
    }

    return false;
  };

  // Sync category changes with filters & clean sub-filters
  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    goToPage('clothing');
    setFilters({
      category: cat,
      minPrice: 0,
      maxPrice: priceCeiling,
      fabrics: [],
      sizes: [],
      colors: [],
      inStockOnly: false,
      onSaleOnly: cat === 'Sale',
    });

    setTimeout(() => {
      const el = document.getElementById('catalog-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const goToPage = (nextPage: SitePage) => {
    setPage(nextPage);
    const nextHash = pageHash(nextPage);
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  };

  // Keep the address bar and the browser buttons in sync with the visible page
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Read the prices the shop is actually selling at. Falls back to the catalogue baked
  // into this build when there is no shop service behind it.
  // A catalogue the owner panel just wrote back is live shop data by definition, so a
  // change without a source only arrives from a successful shop write.
  const applyCatalogue = useCallback(
    (result: { products: Product[]; revision: number; source?: CatalogueSource }) => {
      setCatalogue(result.products);
      setRevision(result.revision);
      setCatalogueSource(result.source ?? 'shop');
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCatalogue(controller.signal).then((result) => {
      // An aborted read resolves to the baked catalogue; applying it would undo live prices.
      if (controller.signal.aborted) return;
      applyCatalogue(result);
    });
    return () => controller.abort();
  }, [applyCatalogue]);

  // Builds before this one stored whole address books; drop those fields on sight.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
      const record = parsed as Record<string, unknown>;
      const extra = Object.keys(record).filter(
        (k) => k !== 'id' && k !== 'fullName' && k !== 'email' && k !== 'phone',
      );
      if (extra.length === 0) return;
      const trimmed = readPersistedUser();
      if (trimmed) localStorage.setItem(USER_KEY, JSON.stringify(trimmed));
      else localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    let list = [...catalogue];

    // 1. Category Filter: check selected category
    const targetCat = activeCategory !== 'All Collections' ? activeCategory : filters.category;
    if (targetCat !== 'All Collections') {
      if (targetCat === 'Sale') {
        list = list.filter(
          (p) => p.category === 'Sale' || p.onSale || (p.originalPrice && p.originalPrice > p.price)
        );
      } else {
        list = list.filter((p) => matchesCategory(p.category, targetCat));
      }
    }

    // 2. Price Range (only if user changed range)
    if (filters.minPrice > 0 || filters.maxPrice < priceCeiling) {
      list = list.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    }

    // 3. Fabrics
    if (filters.fabrics.length > 0) {
      list = list.filter((p) => filters.fabrics.includes(p.fabric));
    }

    // 4. Sizes
    if (filters.sizes.length > 0) {
      list = list.filter((p) => p.sizes.some((sz) => filters.sizes.includes(sz)));
    }

    // 5. Colors
    if (filters.colors.length > 0) {
      list = list.filter((p) => p.colors.some((c) => filters.colors.includes(c.name)));
    }

    // 6. In Stock Only
    if (filters.inStockOnly) {
      list = list.filter((p) => {
        const total = Object.values(p.stockPerSize).reduce((acc, curr) => acc + curr, 0);
        return total > 0;
      });
    }

    // 7. On Sale Only (apply only if not already filtered by a specific category)
    if (filters.onSaleOnly && targetCat === 'All Collections') {
      list = list.filter(
        (p) => p.category === 'Sale' || p.onSale || (p.originalPrice && p.originalPrice > p.price)
      );
    }

    // 8. Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }

    return list;
  }, [catalogue, activeCategory, filters, sortBy]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All Collections') count++;
    count += filters.fabrics.length;
    count += filters.sizes.length;
    count += filters.colors.length;
    if (filters.inStockOnly) count++;
    if (filters.onSaleOnly && activeCategory !== 'Sale') count++;
    if (filters.minPrice > 0 || filters.maxPrice < priceCeiling) count++;
    return count;
  }, [filters, activeCategory, priceCeiling]);

  const handleResetFilters = () => {
    setFilters({
      ...initialFilters,
      category: activeCategory,
    });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount, rememberDevice: boolean) => {
    // Only what the greeting and checkout pre-fill need; addresses are re-asked for.
    const trimmed: UserAccount = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };
    setCurrentUser(trimmed);
    try {
      if (rememberDevice) {
        localStorage.setItem(USER_KEY, JSON.stringify(trimmed));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  };

  // Wishlist actions
  const toggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  };

  const wishlistProducts = useMemo(() => {
    return catalogue.filter((p) => wishlistIds.has(p.id));
  }, [catalogue, wishlistIds]);

  // Cart Actions
  const stockFor = (product: Product, size: string) => product.stockPerSize[size] ?? 0;

  const lineKey = (line: CartLine) => `${line.productId}|${line.size}|${line.color}`;

  const handleAddToCart = (
    product: Product,
    selectedSize: string,
    selectedColor: ProductColor,
    quantity: number
  ) => {
    const stock = stockFor(product, selectedSize);
    if (stock <= 0) return;

    setCartLines((prev) => {
      const line: CartLine = {
        productId: product.id,
        size: selectedSize,
        color: selectedColor.name,
        quantity: Math.max(1, quantity),
      };
      const existingIdx = prev.findIndex((l) => lineKey(l) === lineKey(line));
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(stock, next[existingIdx].quantity + line.quantity),
        };
        return next;
      }
      if (prev.length >= MAX_CART_LINES) return prev;
      return [...prev, { ...line, quantity: Math.min(stock, line.quantity) }];
    });
  };

  // Bag rows are addressed by position, storage by identity: resolve first, then mutate.
  const handleUpdateQuantity = (index: number, newQty: number) => {
    const target = cartItems[index];
    if (!target) return;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const line: CartLine = {
      productId: target.product.id,
      size: target.selectedSize,
      color: target.selectedColor.name,
      quantity: Math.min(stockFor(target.product, target.selectedSize), newQty),
    };
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => lineKey(l) === lineKey(line));
      if (idx === -1) return [...prev, line];
      const next = [...prev];
      next[idx] = line;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    const target = cartItems[index];
    if (!target) return;
    const key = lineKey({
      productId: target.product.id,
      size: target.selectedSize,
      color: target.selectedColor.name,
      quantity: 1,
    });
    // Drop every stored copy of that piece, including a hidden sold-out line.
    setCartLines((prev) => prev.filter((l) => lineKey(l) !== key));
  };

  const handleApplyCoupon = (code: string): boolean => {
    if (!KNOWN_COUPONS.has(code)) return false;
    setAppliedCoupon(code);
    return true;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
  };

  // Instant Buy Now
  const handleBuyNow = (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number
  ) => {
    handleAddToCart(product, size, color, quantity);
    setActiveProductModal(null);
    setCheckoutModalOpen(true);
  };

  // Move from wishlist to bag
  const handleMoveWishlistToBag = (product: Product) => {
    handleAddToCart(product, product.sizes[0] || 'Standard', product.colors[0], 1);
    toggleWishlist(product);
    setIsCartOpen(true);
  };

  // Order completed handler
  const handleOrderCompleted = (_order: OrderConfirmationData) => {
    setCartLines([]);
    setAppliedCoupon('');
    setGiftWrap(false);
  };

  // Keep the shopper's bag, wishlist and currency across reloads
  useEffect(() => {
    try {
      const state: PersistedState = {
        cartLines,
        wishlistIds: [...wishlistIds],
        currency,
        appliedCoupon,
        giftWrap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — shopping still works in-memory
    }
  }, [cartLines, wishlistIds, currency, appliedCoupon, giftWrap]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1E1B18]">
      
      {/* 1. Announcement Bar */}
      <AnnouncementBar
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        onTrackOrderClick={() => setTrackingModalOpen(true)}
      />

      {/* 2. Top Bar Navigation */}
      <Navbar
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={wishlistIds.size}
        currentUser={currentUser}
        page={page}
        onSelectPage={goToPage}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTracking={() => setTrackingModalOpen(true)}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
      />

      {page === 'owner' ? (
        /* ============ OWNER: the shop desk ============ */
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
            {catalogueSource !== 'shop' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-[#EDE6DC] bg-[#FBF8F2] px-4 py-3 text-xs text-[#5C5349]">
                <span>
                  {catalogueSource === 'unseeded'
                    ? 'Nothing has been published to this shop yet. The list below is the catalogue baked into the site — restore it to start selling, or add a product.'
                    : 'The shop service did not answer, so the list below is the catalogue baked into this build. Saving will not change what customers see until it responds.'}
                </span>
                <button
                  type="button"
                  onClick={() => void loadCatalogue().then(applyCatalogue)}
                  className="border border-[#1E1B18] text-[#1E1B18] uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <OwnerPanel
            products={catalogue}
            revision={revision}
            currency={currency}
            onCatalogueChange={applyCatalogue}
            onReloadRequested={() => void loadCatalogue().then(applyCatalogue)}
          />
        </main>
      ) : page === 'home' ? (
        /* ============ HOME: the house, its craft, its cloth ============ */
        <HomePage
          onGoToClothing={() => goToPage('clothing')}
          onSelectCategory={handleSelectCategory}
          products={catalogue}
          currency={currency}
          onViewProduct={(product) => setActiveProductModal(product)}
        />
      ) : (
        /* ============ CLOTHING: the shop ============ */
        <>
          <MarqueeStrip />

          <section className="bg-[#F7F3ED] border-b border-[#EDE6DC] py-9 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
                  Handblocked In Bagru · Small Batches
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] leading-tight font-normal tracking-tight text-balance">
                  <AnimatedHeadline
                    text="The Clothing Room."
                    startDelay={0}
                    stepDelay={180}
                    keyPrefix="clothing"
                  />
                </h1>
                <p className="text-[#5C5349] text-sm leading-relaxed font-light max-w-xl">
                  Apparel and home linen in five natural fabrics. Filter by cloth, size, colour or price and
                  add straight to the bag.
                </p>
              </div>
              <button
                onClick={() => {
                  goToPage('home');
                  setTimeout(() => {
                    const el = document.getElementById('craft-story');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 60);
                }}
                className="self-start sm:self-auto px-6 py-3 border border-[#3C352D] text-[11px] uppercase tracking-[0.2em] font-medium text-[#1E1B18] hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors whitespace-nowrap"
              >
                How We Make It
              </button>
            </div>
          </section>

          {/* 4. Filter, Category Tabs & Sort */}
          <CategoryNav
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            itemCount={displayedProducts.length}
            onOpenFilters={() => setIsFilterDrawerOpen(true)}
            activeFilterCount={activeFiltersCount}
          />

          {/* 5. Main Catalog Grid */}
          <main id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14 w-full flex-1">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#EDE6DC] pb-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
                  Curated Handcrafted Line · Jaipur Atelier
                </p>
                <h2 className="font-serif text-3xl font-normal text-[#1E1B18]">
                  {categoryLabel(activeCategory)}
                </h2>
              </div>
              <p className="text-xs text-[#7A6B5D]">
                Displaying <strong className="font-semibold text-[#1E1B18]">{displayedProducts.length}</strong> creations on neutral beige studio forms
              </p>
            </div>

            {/* 3-Column Desktop Product Grid */}
            {displayedProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-[#FAF7F2] border border-[#EDE6DC] p-8">
                <p className="font-serif text-2xl text-[#1E1B18]">No Silhouettes Match Your Filters</p>
                <p className="text-xs text-[#7A6B5D] max-w-sm mx-auto">
                  Try resetting your filter parameters or selecting a different collection department.
                </p>
                <button
                  onClick={() => handleSelectCategory('All Collections')}
                  className="px-6 py-2.5 bg-[#1E1B18] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#342F2A]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedProducts.map((product, index) => (
                  <Reveal key={product.id} variant="pop" delay={(index % 3) * 90} className="h-full [&>div]:h-full">
                    <ProductCard
                      product={product}
                      currency={currency}
                      isWishlisted={wishlistIds.has(product.id)}
                      onToggleWishlist={toggleWishlist}
                      onQuickView={(p) => setActiveProductModal(p)}
                      onQuickAdd={(p, sz, col) => {
                        handleAddToCart(p, sz, col, 1);
                        setIsCartOpen(true);
                      }}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* 8. Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        onOpenTracking={() => setTrackingModalOpen(true)}
        onOpenOwner={() => goToPage('owner')}
      />

      {/* DRAWERS & MODALS */}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        currency={currency}
        priceCeiling={priceCeiling}
        onClose={() => setIsFilterDrawerOpen(false)}
        onUpdateFilters={(newFilters) => {
          setFilters(newFilters);
          if (newFilters.category && newFilters.category !== activeCategory) {
            setActiveCategory(newFilters.category);
          }
        }}
        onResetFilters={handleResetFilters}
        totalResultsCount={displayedProducts.length}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        currency={currency}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setCheckoutModalOpen(true);
        }}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        giftWrap={giftWrap}
        onToggleGiftWrap={() => setGiftWrap(!giftWrap)}
      />

      {/* Slide-out Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        wishlistProducts={wishlistProducts}
        currency={currency}
        onClose={() => setIsWishlistOpen(false)}
        onRemoveFromWishlist={toggleWishlist}
        onMoveToBag={handleMoveWishlistToBag}
      />

      {/* Search Dialog */}
      <SearchModal
        isOpen={searchModalOpen}
        products={catalogue}
        currency={currency}
        onClose={() => setSearchModalOpen(false)}
        onSelectProduct={(p) => setActiveProductModal(p)}
      />

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
      />

      {/* Product Detail Modal (PDP) */}
      <ProductDetailModal
        product={activeProductModal}
        currency={currency}
        isWishlisted={activeProductModal ? wishlistIds.has(activeProductModal.id) : false}
        onClose={() => setActiveProductModal(null)}
        onToggleWishlist={toggleWishlist}
        onAddToCart={(prod, sz, col, qty) => {
          handleAddToCart(prod, sz, col, qty);
        }}
        onBuyNow={handleBuyNow}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
      />

      {/* Payment Gateway Checkout Modal */}
      <CheckoutPaymentModal
        isOpen={checkoutModalOpen}
        items={cartItems}
        currency={currency}
        appliedCoupon={appliedCoupon}
        giftWrap={giftWrap}
        currentUser={currentUser}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderCompleted={handleOrderCompleted}
        onOpenAuth={() => {
          setCheckoutModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

    </div>
  );
}
