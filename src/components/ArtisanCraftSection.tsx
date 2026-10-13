import React from 'react';
import { CRAFT_IMAGE } from '../data/products';
import { SafeImage } from './SafeImage';
import { Reveal } from './Reveal';
import { useParallax } from '../hooks/useParallax';
import { Sparkles, Leaf, HeartHandshake } from 'lucide-react';

export const ArtisanCraftSection: React.FC = () => {
  const craftImageRef = useParallax<HTMLDivElement>(0.05, 36);

  return (
    <section id="craft-story" className="py-16 lg:py-24 bg-[#F5EFE6] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <Reveal className="max-w-2xl mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
            Artisanal Heritage · Jaipur Workshop
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] font-normal tracking-tight text-balance">
            The Rhythm of the Wooden Block
          </h2>
          <p className="text-[#5C5349] text-base leading-relaxed font-light">
            Every garment from Ram Rass begins not in a factory line, but on long wooden print tables where master artisans align hand-carved teak wood stamps to pure organic cotton.
          </p>
        </Reveal>

        {/* 2-Column Split: Image & Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Image */}
          <Reveal variant="side" className="lg:col-span-7">
            <div className="relative aspect-[16/10] lg:h-full overflow-hidden bg-[#EDE6DC] shadow-md">
              <div ref={craftImageRef} className="absolute inset-x-0 -inset-y-[7%]">
                <SafeImage
                  src={CRAFT_IMAGE}
                  alt="Artisan hands using carved teak block on organic cotton textile"
                  category="Craft"
                  fallbackLabel="Jaipur Workshop"
                  className="w-full h-full object-cover scale-[1.05]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6">
                <p className="text-xs text-white/90 font-light tracking-wide">
                  Master artisan stamping botanical indigo resist in our Bagru cooperative workshop.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Right Column: 3 Pillars with Editorial Numbering */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              
              {/* Pillar 1 */}
              <Reveal delay={120} className="space-y-2 pb-6 border-b border-[#E0D7CB]">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl text-[#A8523C] font-semibold">01.</span>
                  <h3 className="font-serif text-lg font-medium text-[#1E1B18]">
                    Teak Wood Carving
                  </h3>
                </div>
                <p className="text-xs text-[#5C5349] leading-relaxed pl-8">
                  Intricate motifs are hand-chiseled into seasoned Sheesham and Teak wood by hereditary carvers. Each relief takes up to 10 days to sculpt to millimeter precision.
                </p>
              </Reveal>

              {/* Pillar 2 */}
              <Reveal delay={260} className="space-y-2 pb-6 border-b border-[#E0D7CB]">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl text-[#A8523C] font-semibold">02.</span>
                  <h3 className="font-serif text-lg font-medium text-[#1E1B18]">
                    Botanical & AZO-Free Pigments
                  </h3>
                </div>
                <p className="text-xs text-[#5C5349] leading-relaxed pl-8">
                  Our color palette is drawn from natural madder root, fermented indigo leaves, pomegranate rinds, and non-toxic certified water-based eco dyes that age with grace.
                </p>
              </Reveal>

              {/* Pillar 3 */}
              <Reveal delay={400} className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl text-[#A8523C] font-semibold">03.</span>
                  <h3 className="font-serif text-lg font-medium text-[#1E1B18]">
                    Mindful, Fair-Wage Production
                  </h3>
                </div>
                <p className="text-xs text-[#5C5349] leading-relaxed pl-8">
                  We reject fast fashion cycles. Our tailors and printers work in safe, sunlit ateliers with healthcare provisions, equitable living wages, and complete creative dignity.
                </p>
              </Reveal>

            </div>

            {/* Bottom Proof Quote */}
            <Reveal variant="fade" delay={200} className="p-4 bg-white/70 border border-[#EDE6DC] text-xs text-[#5C5349] italic">
              "When you wear Ram Rass, you wear the patient breath and steady hand of an artist whose lineage stretches back four hundred years."
            </Reveal>

          </div>

        </div>

      </div>
    </section>
  );
};
