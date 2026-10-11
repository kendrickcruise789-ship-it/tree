import React from 'react';
import { Currency } from '../types';
import {
  CURRENCY_CONFIGS,
  FREE_SHIPPING_THRESHOLD_USD,
} from '../data/products';
import { formatPrice } from '../utils/currency';
import { Globe, ShieldCheck } from 'lucide-react';

interface AnnouncementBarProps {
  currentCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onTrackOrderClick: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  currentCurrency,
  onCurrencyChange,
  onTrackOrderClick,
}) => {
  return (
    <div className="bg-[#1E1B18] text-[#F3EFEA] text-[11px] tracking-wider uppercase py-2 px-4 border-b border-[#2D2924]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Trust pledge */}
        <div className="hidden sm:flex items-center gap-2 text-[#D2C8BC]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C6934B]" />
          <span>Handcrafted in Jaipur · 100% Pure Organic Cotton</span>
        </div>

        {/* Center: Main announcement */}
        <div className="flex-1 text-center font-medium tracking-widest text-[#E8DDD1]">
          <span>
            Complimentary Express Shipping on Orders Above{' '}
            {formatPrice(FREE_SHIPPING_THRESHOLD_USD, currentCurrency).replace(/\.00$/, '')}
          </span>
        </div>

        {/* Right: Currency switcher & Order Tracking */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onTrackOrderClick}
            className="hidden md:inline-block text-[#B8ACA0] hover:text-white transition-colors"
          >
            Track Order
          </button>

          <div className="flex items-center gap-1.5 pl-3 border-l border-[#3E3831]">
            <Globe className="w-3 h-3 text-[#A89C8F]" />
            <select
              value={currentCurrency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="bg-transparent text-[#F3EFEA] font-medium text-[11px] focus:outline-none cursor-pointer pr-1"
              aria-label="Select currency"
            >
              {Object.keys(CURRENCY_CONFIGS).map((curr) => (
                <option key={curr} value={curr} className="bg-[#1E1B18] text-white">
                  {curr} ({CURRENCY_CONFIGS[curr as Currency].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
