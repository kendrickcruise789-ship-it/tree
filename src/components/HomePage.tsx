import React from 'react';
import { Currency, Product } from '../types';
import { categoryLabel } from '../data/products';
import { FeaturedBoard } from './home/FeaturedBoard';
import { HeroSection } from './HeroSection';
import { MarqueeStrip } from './MarqueeStrip';
import { ArtisanCraftSection } from './ArtisanCraftSection';
import { FabricGuideSection } from './FabricGuideSection';
import { CarePromiseSection } from './CarePromiseSection';
import { ReviewsSection } from './ReviewsSection';
import { Reveal } from './Reveal';
import { AnimatedHeadline } from './AnimatedHeadline';
import { CountUp } from './CountUp';
import { ArrowRight } from 'lucide-react';

interface HomePageProps {
  onGoToClothing: () => void;
  onSelectCategory: (category: string) => void;
  products: Product[];
  currency: Currency;
  onViewProduct: (product: Product) => void;
}

const FACTS = [
  { to: 18, suffix: '', label: 'Resident artisans in Bagru' },
  { to: 5, suffix: '', label: 'Natural fabrics, no blends' },
  { to: 10, suffix: ' days', label: 'To carve a single block' },
  { to: 0, suffix: '', label: 'Polyester in the catalogue' },
];

const ROOMS = [
  { category: 'Dresses', note: 'Tiered maxis & day dresses' },
  { category: 'Co-ords', note: 'Matching top-and-trouser sets' },
  { category: 'Kurtas & Tunics', note: 'Anarkalis & handloom tunics' },
  { category: 'Kaftans', note: 'Botanical mulmul kaftans' },
  { category: 'Bedsheets', note: '300TC percale bedding' },
  { category: 'Home', note: 'Cushions & table linen' },
];

const scrollToCraft = () => {
  const el = document.getElementById('craft-story');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export const HomePage: React.FC<HomePageProps> = ({
  onGoToClothing,
  onSelectCategory,
  products,
  currency,
  onViewProduct,
}) => {
  return (
    <>
      <HeroSection onShopClick={onGoToClothing} onCraftClick={scrollToCraft} />

      <MarqueeStrip />

      {/* The exhibition: what the shop is pushing right now, from the live catalogue */}
      <FeaturedBoard
        products={products}
        currency={currency}
        onShopCategory={onSelectCategory}
        onViewProduct={onViewProduct}
        onGoToClothing={onGoToClothing}
      />

      {/* What the house actually does */}
      <section className="py-14 lg:py-20 bg-[#FDFBF7] border-b border-[#EDE6DC]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <Reveal variant="side" className="lg:col-span-5 space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
              The House · Since 2019
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1B18] leading-tight tracking-tight text-balance">
              <AnimatedHeadline text="A slow clothing house built around one printing table." startDelay={0} stepDelay={90} keyPrefix="house" />
            </h2>
            <p className="text-[#5C5349] text-sm sm:text-base leading-relaxed font-light">
              Clotex designs, blocks, dyes and stitches womenswear and home linen in the same Rajasthan
              workshops. We make small batches of cloth we can stand behind, sell them without a markup
              ladder, and tell you exactly who made each piece.
            </p>
          </Reveal>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            {FACTS.map((fact, i) => (
              <Reveal key={fact.label} variant="pop" delay={i * 140}>
                <div className="h-full border border-[#EDE6DC] bg-[#FAF7F2] p-5 space-y-2 hover:border-[#C6934B] transition-colors">
                  <CountUp
                    to={fact.to}
                    suffix={fact.suffix}
                    className="block font-serif text-3xl sm:text-4xl text-[#1E1B18] leading-none tabular-nums"
                  />
                  <p className="text-[11px] uppercase tracking-wider text-[#7A6B5D] leading-snug">{fact.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ArtisanCraftSection />

      <FabricGuideSection />

      <CarePromiseSection />

      {/* Shop by room — jumps straight into the Clothing page */}
      <section className="py-16 lg:py-20 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
                Continue To The Clothing Room
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] tracking-tight">
                Pick A Shelf And Browse
              </h2>
            </div>
            <button
              onClick={onGoToClothing}
              className="group self-start sm:self-auto px-6 py-3 border border-[#3C352D] text-[11px] uppercase tracking-[0.2em] font-medium text-[#1E1B18] hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors flex items-center gap-2"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROOMS.map((room, i) => (
              <Reveal key={room.category} variant="pop" delay={i * 90}>
                <button
                  onClick={() => onSelectCategory(room.category)}
                  className="w-full h-full text-left group border border-[#EDE6DC] bg-white p-6 flex items-center justify-between gap-4 hover:border-[#1E1B18] hover:shadow-md transition-all duration-300"
                >
                  <span className="space-y-1">
                    <span className="block font-serif text-xl text-[#1E1B18]">{categoryLabel(room.category)}</span>
                    <span className="block text-[11px] uppercase tracking-wider text-[#7A6B5D]">{room.note}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C6934B] shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Closing band */}
      <section className="relative overflow-hidden bg-[#1E1B18] text-[#FDFBF7] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <Reveal variant="fade">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C6934B]">Ready When You Are</p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-balance mx-auto max-w-3xl">
              <AnimatedHeadline text="Eighty pieces. Five fabrics. One printing table." startDelay={0} stepDelay={110} keyPrefix="closing" />
            </h2>
          </Reveal>
          <Reveal variant="pop" delay={260}>
            <button
              onClick={onGoToClothing}
              className="group px-10 py-4 bg-[#FDFBF7] text-[#1E1B18] text-xs uppercase tracking-[0.25em] font-semibold hover:bg-[#C6934B] hover:text-[#1E1B18] transition-colors inline-flex items-center gap-3"
            >
              <span>Enter The Clothing Room</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </button>
          </Reveal>
        </div>
      </section>
    </>
  );
};
