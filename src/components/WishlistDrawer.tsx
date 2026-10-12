import React from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { resolveImage } from '../shop/schema';
import { SafeImage } from './SafeImage';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface WishlistDrawerProps {
  isOpen: boolean;
  wishlistProducts: Product[];
  currency: Currency;
  onClose: () => void;
  onRemoveFromWishlist: (product: Product) => void;
  onMoveToBag: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  wishlistProducts,
  currency,
  onClose,
  onRemoveFromWishlist,
  onMoveToBag,
}) => {
  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-[#EDE6DC]">
        
        {/* Top Header */}
        <div className="p-5 border-b border-[#EDE6DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#A8523C] fill-[#A8523C]" />
            <h2 className="font-serif text-2xl font-medium text-[#1E1B18]">Saved Pieces</h2>
            <span className="text-xs text-[#7A6B5D] uppercase tracking-wider">
              ({wishlistProducts.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F4EFEA] flex items-center justify-center text-[#7A6B5D]">
                <Heart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-xl font-normal text-[#1E1B18]">No pieces saved yet</p>
                <p className="text-xs text-[#7A6B5D]">
                  Tap the heart icon on any silhouette to curate your personal wardrobe wishlist.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-widest font-medium hover:bg-[#342F2A] transition-colors"
              >
                Browse Silhouettes
              </button>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 p-3 bg-white border border-[#EFE9DF] transition-all"
              >
                <div className="w-20 h-24 bg-[#F4EFEA] shrink-0 overflow-hidden border border-[#EDE6DC]">
                  <SafeImage
                    src={resolveImage(product.image)}
                    alt={product.title}
                    category={product.category}
                    fallbackLabel={product.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-medium text-[#1E1B18] line-clamp-1">
                        {product.title}
                      </h4>
                      <button
                        onClick={() => onRemoveFromWishlist(product)}
                        className="text-[#9B8F82] hover:text-[#A8523C] transition-colors p-0.5"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-[#7A6B5D]">{product.category}</p>
                    <p className="text-xs font-semibold tabular-nums text-[#1E1B18] pt-1">
                      {formatPrice(product.price, currency)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onMoveToBag(product);
                    }}
                    className="w-full mt-2 py-2 bg-[#1E1B18] text-[#FDFBF7] text-[11px] uppercase tracking-wider font-medium hover:bg-[#342F2A] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3 h-3 text-[#E8DDD1]" />
                    <span>Move to Bag</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 border-t border-[#EDE6DC] bg-white">
            <p className="text-[11px] text-[#7A6B5D] text-center">
              Items in wishlist remain saved in your browser session.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
