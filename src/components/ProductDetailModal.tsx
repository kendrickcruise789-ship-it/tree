import React, { useState, useEffect } from 'react';
import { Product, Currency, ProductColor } from '../types';
import { formatPrice } from '../utils/currency';
import { productImages, resolveImage } from '../shop/schema';
import { SafeImage } from './SafeImage';
import {
  X,
  Heart,
  ShoppingBag,
  Ruler,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
} from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface ProductDetailModalProps {
  product: Product | null;
  currency: Currency;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: ProductColor, qty: number) => void;
  onBuyNow: (product: Product, size: string, color: ProductColor, qty: number) => void;
  onOpenSizeGuide: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onOpenSizeGuide,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Accordion states
  const [openSection, setOpenSection] = useState<'craft' | 'fabric' | 'care' | 'shipping' | null>('craft');

  // Reset selections whenever a different product is opened
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'Standard');
      setSelectedColor(product.colors[0]);
      setQuantity(1);
      setImageIndex(0);
    }
  }, [product?.id]);

  useOverlayBehavior(!!product, onClose);

  if (!product) return null;

  const activeSize = selectedSize || product.sizes[0] || 'Standard';
  const activeColor = selectedColor ?? product.colors[0];
  const gallery = productImages(product);
  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)] ?? product.image;

  const toggleSection = (section: 'craft' | 'fabric' | 'care' | 'shipping') => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleAdd = () => {
    onAddToCart(product, activeSize, activeColor, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuy = () => {
    onBuyNow(product, activeSize, activeColor, quantity);
  };

  const currentStock = product.stockPerSize[activeSize] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Product details"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl bg-[#FDFBF7] border border-[#EDE6DC] shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Floating close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-[#1E1B18] hover:bg-white shadow-sm transition-colors"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-10">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative aspect-[3/4] w-full bg-[#F4EFEA] overflow-hidden border border-[#EDE6DC]">
              <SafeImage
                src={resolveImage(activeImage)}
                alt={product.title}
                category={product.category}
                fallbackLabel={product.title}
                className="w-full h-full object-cover object-top"
              />
              <button
                onClick={() => onToggleWishlist(product)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-[#1E1B18] hover:text-[#A8523C] shadow-sm transition-colors"
                aria-label="Wishlist toggle"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted ? 'fill-[#A8523C] text-[#A8523C]' : ''
                  }`}
                />
              </button>
            </div>

            {gallery.length > 1 && (
              <ul className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Product pictures">
                {gallery.map((ref, index) => (
                  <li key={`${ref}-${index}`}>
                    <button
                      type="button"
                      onClick={() => setImageIndex(index)}
                      aria-label={`Show picture ${index + 1} of ${gallery.length}`}
                      aria-current={index === Math.min(imageIndex, gallery.length - 1)}
                      className={`block w-16 aspect-[3/4] overflow-hidden border transition-colors ${
                        index === Math.min(imageIndex, gallery.length - 1)
                          ? 'border-[#C6934B] ring-1 ring-[#C6934B]/40'
                          : 'border-[#EDE6DC] hover:border-[#C6934B]'
                      }`}
                    >
                      <SafeImage
                        src={resolveImage(ref)}
                        alt=""
                        category={product.category}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Artisan authenticity badge under image */}
            <div className="p-3 bg-[#F7F3ED] border border-[#E8DDD1] flex items-center gap-3 text-xs text-[#5C5349]">
              <Sparkles className="w-4 h-4 text-[#C6934B] shrink-0" />
              <span>Authentic Jaipur Hand-Block Print · Small-Batch Craftsmanship</span>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs tracking-wider uppercase text-[#7A6B5D]">
                <span>{product.category}</span>
                <div className="flex items-center gap-1.5 normal-case font-medium text-[#1E1B18]">
                  <Star className="w-3.5 h-3.5 fill-[#C6934B] text-[#C6934B]" />
                  <span>{product.rating}</span>
                  <span className="text-[#7A6B5D] font-light">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] font-normal leading-tight">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 tabular-nums">
                <span className="text-2xl font-semibold text-[#1E1B18]">
                  {formatPrice(product.price, currency)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-[#9B8F82] line-through">
                    {formatPrice(product.originalPrice, currency)}
                  </span>
                )}
                <span className="text-xs text-[#7A6B5D]">Inclusive of all craft taxes</span>
              </div>

              <p className="text-sm text-[#5C5349] leading-relaxed font-light">
                {product.description}
              </p>

              {/* Color Selection */}
              <div className="space-y-2 pt-2 border-t border-[#EDE6DC]">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-wider font-medium text-[#1E1B18]">
                    Dye Shade: <span className="font-normal text-[#5C5349]">{activeColor.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-all ${
                        activeColor.name === c.name
                          ? 'border-[#1E1B18] bg-[#F4EFEA] font-semibold text-[#1E1B18]'
                          : 'border-[#EDE6DC] text-[#5C5349] hover:border-[#B8ACA0]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-wider font-medium text-[#1E1B18]">
                    Size: <span className="font-normal text-[#5C5349]">{activeSize}</span>
                  </span>
                  <button
                    onClick={onOpenSizeGuide}
                    className="flex items-center gap-1 text-[#7A6B5D] hover:text-[#1E1B18] underline underline-offset-2"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide & Measurements</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((sz) => {
                    const isSelected = activeSize === sz;
                    const stock = product.stockPerSize[sz] || 0;
                    const isOut = stock === 0;

                    return (
                      <button
                        key={sz}
                        disabled={isOut}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-2 text-xs font-medium border text-center transition-all ${
                          isSelected
                            ? 'bg-[#1E1B18] border-[#1E1B18] text-white shadow-sm'
                            : isOut
                            ? 'border-[#EDE6DC] text-[#C5BDB3] line-through bg-[#FAF7F2] cursor-not-allowed'
                            : 'border-[#D5C9B9] text-[#1E1B18] hover:border-[#1E1B18] bg-white'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Stock Urgency indicator */}
                <div className="text-xs pt-1">
                  {currentStock > 0 && currentStock <= 3 ? (
                    <span className="text-[#A8523C] font-medium">
                      Low stock: Only {currentStock} left in size {activeSize}
                    </span>
                  ) : currentStock > 0 ? (
                    <span className="text-[#2F6F4E] font-medium">In Stock & Ready for Dispatch</span>
                  ) : (
                    <span className="text-red-600 font-medium">Currently Sold Out in size {activeSize}</span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs uppercase tracking-wider font-medium text-[#1E1B18]">Quantity:</span>
                <div className="flex items-center border border-[#D5C9B9] bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="px-3 py-1.5 text-xs text-[#5C5349] hover:bg-[#F3EFEA] transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-semibold tabular-nums text-[#1E1B18]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                    aria-label="Increase quantity"
                    className="px-3 py-1.5 text-xs text-[#5C5349] hover:bg-[#F3EFEA] transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buy & Add To Bag Action Buttons */}
              <div className="space-y-2.5 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={currentStock === 0}
                    className="flex-1 py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {addedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#E8DDD1]" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuy}
                    disabled={currentStock === 0}
                    className="flex-1 py-3.5 bg-[#A8523C] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8F4430] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span>Instant Checkout</span>
                  </button>
                </div>
              </div>

              {/* Guarantee markers */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-[11px] text-[#5C5349]">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#7A6B5D]" />
                  <span>Ships in 24-48 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-[#7A6B5D]" />
                  <span>14-Day Easy Returns</span>
                </div>
              </div>

              {/* Accordion Sections: Craft, Fabric, Care */}
              <div className="pt-4 border-t border-[#EDE6DC] space-y-2 text-xs">
                
                {/* Craft Technique */}
                <div className="border border-[#EDE6DC]">
                  <button
                    onClick={() => toggleSection('craft')}
                    className="w-full p-3 flex items-center justify-between text-left font-medium uppercase tracking-wider text-[#1E1B18] bg-[#FAF7F2] hover:bg-[#F3EFEA]"
                  >
                    <span>Artisanal Technique</span>
                    {openSection === 'craft' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSection === 'craft' && (
                    <div className="p-3.5 text-[#5C5349] leading-relaxed border-t border-[#EDE6DC] bg-white">
                      {product.craftTechnique}
                    </div>
                  )}
                </div>

                {/* Fabric & Material */}
                <div className="border border-[#EDE6DC]">
                  <button
                    onClick={() => toggleSection('fabric')}
                    className="w-full p-3 flex items-center justify-between text-left font-medium uppercase tracking-wider text-[#1E1B18] bg-[#FAF7F2] hover:bg-[#F3EFEA]"
                  >
                    <span>Fabric & Fit Notes</span>
                    {openSection === 'fabric' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSection === 'fabric' && (
                    <div className="p-3.5 text-[#5C5349] leading-relaxed border-t border-[#EDE6DC] bg-white space-y-1">
                      <p><strong>Fabric:</strong> {product.fabric}</p>
                      <p><strong>Silhouette:</strong> {product.fitNote}</p>
                    </div>
                  )}
                </div>

                {/* Care Guide */}
                <div className="border border-[#EDE6DC]">
                  <button
                    onClick={() => toggleSection('care')}
                    className="w-full p-3 flex items-center justify-between text-left font-medium uppercase tracking-wider text-[#1E1B18] bg-[#FAF7F2] hover:bg-[#F3EFEA]"
                  >
                    <span>Washing & Fabric Care</span>
                    {openSection === 'care' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSection === 'care' && (
                    <div className="p-3.5 text-[#5C5349] leading-relaxed border-t border-[#EDE6DC] bg-white">
                      {product.careInstructions}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
