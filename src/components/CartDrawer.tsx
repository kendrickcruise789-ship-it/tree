import React, { useState } from 'react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { resolveImage } from '../shop/schema';
import {
  FREE_SHIPPING_THRESHOLD_USD,
  EXPRESS_SHIPPING_FEE_USD,
} from '../data/products';
import { SafeImage } from './SafeImage';
import { X, Trash2, Gift, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useOverlayBehavior } from '../utils/useOverlayBehavior';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  currency: Currency;
  onClose: () => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  appliedCoupon: string;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
  giftWrap: boolean;
  onToggleGiftWrap: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  currency,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  giftWrap,
  onToggleGiftWrap,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  useOverlayBehavior(isOpen, onClose);

  if (!isOpen) return null;

  // Free shipping threshold in USD
  const rawSubtotalUSD = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const giftWrapCostUSD = giftWrap ? 5 : 0;

  // Coupon discount
  let discountUSD = 0;
  if (appliedCoupon === 'RAMRASS10') {
    discountUSD = rawSubtotalUSD * 0.1;
  } else if (appliedCoupon === 'WELCOME15') {
    discountUSD = rawSubtotalUSD * 0.15;
  }

  const isFreeShipping = rawSubtotalUSD >= FREE_SHIPPING_THRESHOLD_USD;
  const shippingUSD =
    rawSubtotalUSD === 0 || isFreeShipping ? 0 : EXPRESS_SHIPPING_FEE_USD;
  const totalUSD = Math.max(0, rawSubtotalUSD - discountUSD + giftWrapCostUSD + shippingUSD);

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_USD - rawSubtotalUSD
  );
  const progressPercent = Math.min(
    100,
    Math.round((rawSubtotalUSD / FREE_SHIPPING_THRESHOLD_USD) * 100)
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const success = onApplyCoupon(couponInput.trim().toUpperCase());
    if (success) {
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try RAMRASS10');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-[#EDE6DC]">
        
        {/* Top Header */}
        <div className="p-5 border-b border-[#EDE6DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#1E1B18]">Shopping Bag</h2>
            <span className="text-xs text-[#7A6B5D] uppercase tracking-wider">
              ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6B5D] hover:text-[#1E1B18] transition-colors"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress bar */}
        {items.length > 0 && (
          <div className="bg-[#FAF7F2] p-4 border-b border-[#EDE6DC] space-y-2">
            <div className="flex items-center justify-between text-xs">
              {isFreeShipping ? (
                <span className="text-[#2F6F4E] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6934B]" />
                  <span>You've unlocked Complimentary Express Shipping!</span>
                </span>
              ) : (
                <span className="text-[#5C5349]">
                  Add <strong>{formatPrice(amountNeededForFreeShipping, currency)}</strong> more for Free Shipping
                </span>
              )}
              <span className="text-[11px] tabular-nums text-[#7A6B5D] font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E8DDD1] h-1.5 overflow-hidden">
              <div
                className="bg-[#1E1B18] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bag Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F4EFEA] flex items-center justify-center text-[#7A6B5D]">
                <X className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-xl font-normal text-[#1E1B18]">Your bag is currently empty</p>
                <p className="text-xs text-[#7A6B5D]">Discover our handcrafted women's slow fashion silhouettes.</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-widest font-medium hover:bg-[#342F2A] transition-colors"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                className="flex gap-4 p-3 bg-white border border-[#EFE9DF] transition-all"
              >
                {/* Thumbnail */}
                <div className="w-20 h-24 bg-[#F4EFEA] shrink-0 overflow-hidden border border-[#EDE6DC]">
                  <SafeImage
                    src={resolveImage(item.product.image)}
                    alt={item.product.title}
                    category={item.product.category}
                    fallbackLabel={item.product.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-medium text-[#1E1B18] line-clamp-1">
                        {item.product.title}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-[#9B8F82] hover:text-[#A8523C] transition-colors p-0.5"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#7A6B5D]">
                      <span>Size: {item.selectedSize}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />
                        <span>{item.selectedColor.name}</span>
                      </span>
                    </div>

                    <p className="text-xs font-semibold tabular-nums text-[#1E1B18]">
                      {formatPrice(item.product.price, currency)}
                    </p>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-[#EDE6DC]">
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product.title}`}
                        className="px-3 py-1.5 text-xs text-[#5C5349] hover:bg-[#F3EFEA]"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#1E1B18]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product.title}`}
                        disabled={item.quantity >= (item.product.stockPerSize[item.selectedSize] ?? 0)}
                        className="px-3 py-1.5 text-xs text-[#5C5349] hover:bg-[#F3EFEA] disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-medium text-[#5C5349] tabular-nums">
                      Subtotal: {formatPrice(item.product.price * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Drawer Actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#EDE6DC] bg-[#FAF7F2] space-y-4">
            
            {/* Gift Wrap option */}
            <div className="flex items-center justify-between text-xs text-[#5C5349]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={onToggleGiftWrap}
                  className="rounded text-[#1E1B18] focus:ring-0"
                />
                <Gift className="w-3.5 h-3.5 text-[#C6934B]" />
                <span>Artisanal Gift Packaging (+{formatPrice(5, currency)})</span>
              </label>
            </div>

            {/* Coupon Code section */}
            <div className="space-y-1.5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 bg-[#EFE9DF] text-xs">
                  <span className="text-[#2F6F4E] font-medium">Coupon <strong>{appliedCoupon}</strong> Applied</span>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-[#A8523C] hover:underline uppercase text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter Coupon (e.g. RAMRASS10)"
                    className="flex-1 px-3 py-1.5 text-xs border border-[#D5C9B9] bg-white focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#1E1B18] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#342F2A]"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-[#A8523C]">{couponError}</p>}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs text-[#5C5349] border-t border-[#E8DDD1] pt-3 tabular-nums">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatPrice(rawSubtotalUSD, currency)}</span>
              </div>
              {discountUSD > 0 && (
                <div className="flex justify-between text-[#2F6F4E] font-medium">
                  <span>Artisan Discount ({appliedCoupon})</span>
                  <span>-{formatPrice(discountUSD, currency)}</span>
                </div>
              )}
              {giftWrap && (
                <div className="flex justify-between">
                  <span>Gift Box & Handwritten Note</span>
                  <span>{formatPrice(giftWrapCostUSD, currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{isFreeShipping ? 'FREE' : formatPrice(shippingUSD, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#1E1B18] pt-2 border-t border-[#EDE6DC]">
                <span>Total Amount</span>
                <span>{formatPrice(totalUSD, currency)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security pledge */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6B5D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F4E]" />
              <span>Demo checkout &mdash; no card is charged</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
