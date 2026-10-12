import React, { useState } from 'react';
import { Product, Currency, ProductColor } from '../types';
import { formatPrice } from '../utils/currency';
import { resolveImage } from '../shop/schema';
import { SafeImage } from './SafeImage';
import { Heart, Eye, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: ProductColor) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onQuickAdd,
}) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [showQuickSizes, setShowQuickSizes] = useState(false);

  // Check low stock count
  const totalStock = Object.values(product.stockPerSize).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="group relative flex flex-col bg-[#FDFBF7] border border-[#EFE9DF] hover:border-[#D5C9B9] transition-all duration-300">
      
      {/* Visual Image Slot */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F4EFEA]">
        <SafeImage
          src={resolveImage(product.image)}
          alt={product.title}
          category={product.category}
          fallbackLabel={product.title}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-[#1E1B18] hover:text-[#A8523C] hover:bg-white shadow-sm transition-all"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-[#A8523C] text-[#A8523C]' : ''
            }`}
          />
        </button>

        {/* Clean Editorial Badges (Single text tag, no pill clusters) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNewArrival && (
            <span className="bg-[#1E1B18] text-[#FDFBF7] text-[10px] uppercase tracking-widest px-2.5 py-1 font-medium">
              New Drop
            </span>
          )}
          {product.isBestSeller && !product.isNewArrival && (
            <span className="bg-[#A8523C] text-[#FDFBF7] text-[10px] uppercase tracking-widest px-2.5 py-1 font-medium">
              Artisan Favorite
            </span>
          )}
        </div>

        {/* Action Bar — always visible on touch, hover/focus revealed on desktop */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity flex items-center justify-between gap-2">
          <button
            onClick={() => onQuickView(product)}
            className="flex-1 py-2.5 bg-white/95 hover:bg-white text-[#1E1B18] text-[11px] uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          <button
            onClick={() => setShowQuickSizes(!showQuickSizes)}
            className="flex-1 py-2.5 bg-[#1E1B18]/95 hover:bg-[#1E1B18] text-[#FDFBF7] text-[11px] uppercase tracking-wider font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#E8DDD1]" />
            <span>+ Quick Bag</span>
          </button>
        </div>

        {/* Quick Size Flyout */}
        {showQuickSizes && (
          <div className="absolute inset-x-0 bottom-0 bg-[#FDFBF7] p-3 border-t border-[#EDE6DC] z-10 shadow-lg animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#1E1B18]">Select Size</span>
              <button
                onClick={() => setShowQuickSizes(false)}
                className="text-[11px] text-[#7A6B5D] hover:text-[#1E1B18]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {product.sizes.map((sz) => {
                const stock = product.stockPerSize[sz] || 0;
                const isOutOfStock = stock === 0;
                return (
                  <button
                    key={sz}
                    disabled={isOutOfStock}
                    onClick={() => {
                      onQuickAdd(product, sz, selectedColor);
                      setShowQuickSizes(false);
                    }}
                    className={`py-2 text-xs font-medium border text-center transition-colors ${
                      isOutOfStock
                        ? 'border-[#EDE6DC] text-[#C5BDB3] line-through cursor-not-allowed bg-[#F8F5F1]'
                        : 'border-[#3C352D] text-[#1E1B18] hover:bg-[#1E1B18] hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Content & Typography */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Category & Craft note */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7A6B5D]">
            <span>{product.category}</span>
            {totalStock <= 8 && (
              <span className="text-[#A8523C] font-medium lowercase">only {totalStock} left</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-medium text-[#1E1B18]">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="text-left hover:text-[#7A6B5D] line-clamp-1 transition-colors"
            >
              {product.title}
            </button>
          </h3>

          {/* Fabric subtitle */}
          <p className="text-xs text-[#7A6B5D] line-clamp-1 font-light">
            {product.fabric}
          </p>
        </div>

        {/* Bottom Row: Swatches & Price */}
        <div className="pt-2 border-t border-[#F2ECE3] flex items-center justify-between">
          {/* Color swatch dots */}
          <div className="flex items-center gap-1.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c)}
                title={c.name}
                aria-label={`Select color ${c.name}`}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedColor.name === c.name
                    ? 'ring-1 ring-offset-1 ring-[#1E1B18] border-black/30'
                    : 'border-black/20 hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          {/* Price with tabular numerals */}
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-sm font-semibold text-[#1E1B18]">
              {formatPrice(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#9B8F82] line-through">
                {formatPrice(product.originalPrice, currency)}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
