import React from 'react';
import { HERO_IMAGE } from '../data/products';
import { SafeImage } from './SafeImage';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onShopClick: () => void;
  onCraftClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopClick,
  onCraftClick,
}) => {
  return (
    <section className="relative overflow-hidden bg-[#F7F3ED] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Editorial text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#7A6B5D] font-medium">
              <span>Collection 2026</span>
              <span aria-hidden="true">·</span>
              <span>Jaipur Handcraft</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1E1B18] leading-[1.15] font-normal tracking-tight text-balance">
              Handcrafted Heritage. Modern Ease.
            </h1>

            <p className="text-[#5C5349] text-base sm:text-lg leading-relaxed font-light">
              Rooted in the timeless art of wooden hand-block printing and breathable natural mulmul. Clotex brings unhurried, mindful artisanal silhouettes for the contemporary woman.
            </p>

            {/* Micro value props - clean unboxed typography */}
            <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#7A6B5D] tracking-wide">
              <span>100% Organic Mulmul & Chanderi</span>
              <span aria-hidden="true">·</span>
              <span>AZO-Free Eco Dyes</span>
              <span aria-hidden="true">·</span>
              <span>Fair Artisan Wages</span>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onShopClick}
                className="px-8 py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#342F2A] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                <span>Shop New Arrivals</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onCraftClick}
                className="px-8 py-3.5 bg-transparent border border-[#3C352D] text-[#1E1B18] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#EDE6DC] transition-all flex items-center justify-center"
              >
                <span>Artisan Process</span>
              </button>
            </div>
          </div>

          {/* Right: Editorial Image */}
          <div className="lg:col-span-7 relative">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] overflow-hidden bg-[#EDE6DC] shadow-lg">
              <SafeImage
                src={HERO_IMAGE}
                alt="Clotex Solstice Collection hand block-printed tiered maxi dress"
                category="Dresses"
                fallbackLabel="Solstice Collection"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
              />
              
              {/* Subtle scrim & editorial caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6 md:p-8">
                <div className="text-white space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#E8DDD1]">Featured Silhouette</p>
                  <p className="font-serif text-xl sm:text-2xl font-normal">Aurelia Hand-Blocked Tiered Maxi</p>
                  <p className="text-xs text-white/80 font-light">Crafted in soft mulmul cotton with teak block stamping</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
