import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Currency, ProductColor, OrderConfirmationData, UserAccount, FilterOptions } from './types';
import { PRODUCTS, HERO_IMAGE, MAX_PRICE_CEILING } from './data/products';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
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
import { ArtisanCraftSection } from './components/ArtisanCraftSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';

const STORAGE_KEY = 'clotex_state_v1';

interface PersistedState {
  cartItems: CartItem[];
  wishlistIds: string[];
  currency: Currency;
  appliedCoupon: string;
  giftWrap: boolean;
}

function readPersisted(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
  } catch {
    return {};
  }
}

export default function App() {
  const persisted = useMemo(readPersisted, []);

  // Currency State
  const [currency, setCurrency] = useState<Currency>(persisted.currency ?? 'USD');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('clotex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Category & Sorting
  const [activeCategory, setActiveCategory] = useState<string>('All Collections');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Filters State
  const initialFilters: FilterOptions = {
    category: 'All Collections',
    minPrice: 0,
    maxPrice: MAX_PRICE_CEILING,
    fabrics: [],
    sizes: [],
    colors: [],
    inStockOnly: false,
    onSaleOnly: false,
  };
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(persisted.cartItems ?? []);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>(persisted.appliedCoupon ?? '');
  const [giftWrap, setGiftWrap] = useState<boolean>(persisted.giftWrap ?? false);

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
    setFilters({
      category: cat,
      minPrice: 0,
      maxPrice: MAX_PRICE_CEILING,
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

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    let list = [...PRODUCTS];

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
    if (filters.minPrice > 0 || filters.maxPrice < MAX_PRICE_CEILING) {
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
  }, [activeCategory, filters, sortBy]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All Collections') count++;
    count += filters.fabrics.length;
    count += filters.sizes.length;
    count += filters.colors.length;
    if (filters.inStockOnly) count++;
    if (filters.onSaleOnly && activeCategory !== 'Sale') count++;
    if (filters.minPrice > 0 || filters.maxPrice < MAX_PRICE_CEILING) count++;
    return count;
  }, [filters, activeCategory]);

  const handleResetFilters = () => {
    setFilters({
      ...initialFilters,
      category: activeCategory,
    });
  };

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount, rememberDevice: boolean) => {
    setCurrentUser(user);
    try {
      if (rememberDevice) {
        localStorage.setItem('clotex_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('clotex_user');
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('clotex_user');
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
    return PRODUCTS.filter((p) => wishlistIds.has(p.id));
  }, [wishlistIds]);

  // Cart Actions
  const stockFor = (product: Product, size: string) => product.stockPerSize[size] ?? 0;

  const handleAddToCart = (
    product: Product,
    selectedSize: string,
    selectedColor: ProductColor,
    quantity: number
  ) => {
    const stock = stockFor(product, selectedSize);
    if (stock <= 0) return;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) =>
          it.product.id === product.id &&
          it.selectedSize === selectedSize &&
          it.selectedColor.name === selectedColor.name
      );

      if (existingIdx > -1) {
        const current = prev[existingIdx].quantity;
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(stock, current + quantity),
        };
        return next;
      }
      return [
        ...prev,
        {
          product,
          selectedSize,
          selectedColor,
          quantity: Math.min(stock, quantity),
        },
      ];
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const next = [...prev];
      next[index] = {
        ...target,
        quantity: Math.min(stockFor(target.product, target.selectedSize), newQty),
      };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyCoupon = (code: string): boolean => {
    if (code === 'CLOTEX10' || code === 'WELCOME15') {
      setAppliedCoupon(code);
      return true;
    }
    return false;
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
  const handleOrderCompleted = (order: OrderConfirmationData) => {
    setCartItems([]);
    setAppliedCoupon('');
    setGiftWrap(false);
  };

  // Keep the shopper's bag, wishlist and currency across reloads
  useEffect(() => {
    try {
      const state: PersistedState = {
        cartItems,
        wishlistIds: [...wishlistIds],
        currency,
        appliedCoupon,
        giftWrap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — shopping still works in-memory
    }
  }, [cartItems, wishlistIds, currency, appliedCoupon, giftWrap]);

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
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTracking={() => setTrackingModalOpen(true)}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
      />

      {/* 3. Hero Campaign Section */}
      <HeroSection
        onShopClick={() => {
          const el = document.getElementById('catalog-grid');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onCraftClick={() => {
          const el = document.getElementById('craft-story');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

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
              {activeCategory}
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
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
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
            ))}
          </div>
        )}
      </main>

      {/* 6. Artisan Craft Section */}
      <ArtisanCraftSection />

      {/* 7. Patron Reviews Section */}
      <ReviewsSection />

      {/* 8. Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        onOpenTracking={() => setTrackingModalOpen(true)}
      />

      {/* DRAWERS & MODALS */}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        filters={filters}
        currency={currency}
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

      {/* Instant Search Dialog */}
      <SearchModal
        isOpen={searchModalOpen}
        products={PRODUCTS}
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
