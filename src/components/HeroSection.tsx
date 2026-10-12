import React from 'react';
import { HERO_IMAGE } from '../data/products';
import { SafeImage } from './SafeImage';
import { AnimatedHeadline } from './AnimatedHeadline';
import { Reveal } from './Reveal';
import { useParallax } from '../hooks/useParallax';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onShopClick: () => void;
  onCraftClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopClick,
  onCraftClick,
}) => {
  const imageRef = useParallax<HTMLDivElement>(0.06, 42);
  return (
    <section className="relative overflow-hidden bg-[#F7F3ED] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Editorial text */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal variant="fade">
              <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#7A6B5D] font-medium">
                <span>Collection 2026</span>
                <span aria-hidden="true">·</span>
                <span>Jaipur Handcraft</span>
              </div>
            </Reveal>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1E1B18] leading-[1.15] font-normal tracking-tight text-balance">
              <AnimatedHeadline text="Handcrafted Heritage. Modern Ease." startDelay={120} stepDelay={160} keyPrefix="hero" />
            </h1>

            <Reveal delay={760} className="space-y-5">
              <p className="text-[#5C5349] text-base sm:text-lg leading-relaxed font-light">
                Rooted in the timeless art of wooden hand-block printing and breathable natural mulmul. Clotex brings unhurried, mindful artisanal silhouettes for the contemporary woman.
              </p>

              {/* Micro value props - clean unboxed typography */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#7A6B5D] tracking-wide">
                <span>100% Organic Mulmul & Chanderi</span>
                <span aria-hidden="true">·</span>
                <span>AZO-Free Eco Dyes</span>
                <span aria-hidden="true">·</span>
                <span>Fair Artisan Wages</span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onShopClick}
                  className="px-8 py-3.5 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-[0.2em] font-medium whitespace-nowrap hover:bg-[#342F2A] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow group"
                >
                  <span>Shop New Arrivals</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={onCraftClick}
                  className="px-8 py-3.5 bg-transparent border border-[#3C352D] text-[#1E1B18] text-xs uppercase tracking-[0.2em] font-medium whitespace-nowrap hover:bg-[#EDE6DC] transition-all flex items-center justify-center"
                >
                  <span>Artisan Process</span>
                </button>
              </div>
            </Reveal>
          </div>

          {/* Right: Editorial Image */}
          <div className="lg:col-span-7 relative">
            <Reveal variant="pop" delay={260}>
              <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] overflow-hidden bg-[#EDE6DC] shadow-lg">
                <div ref={imageRef} className="absolute inset-x-0 -inset-y-[8%]">
                  <SafeImage
                    src={HERO_IMAGE}
                    alt="Clotex Solstice Collection hand block-printed tiered maxi dress"
                    category="Dresses"
                    fallbackLabel="Solstice Collection"
                    className="w-full h-full object-cover object-center scale-[1.06]"
                  />
                </div>

                {/* Subtle scrim & editorial caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6 md:p-8">
                  <div className="text-white space-y-1 clotex-fade-up" style={{ animationDelay: '900ms' }}>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#E8DDD1]">Featured Silhouette</p>
                    <p className="font-serif text-xl sm:text-2xl font-normal">Aurelia Hand-Blocked Tiered Maxi</p>
                    <p className="text-xs text-white/80 font-light">Crafted in soft mulmul cotton with teak block stamping</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};
