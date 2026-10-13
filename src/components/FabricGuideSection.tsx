import React, { useState } from 'react';
import { ALL_FABRICS } from '../data/products';
import { Reveal } from './Reveal';
import { AnimatedHeadline } from './AnimatedHeadline';

interface FabricNote {
  weave: string;
  weight: string;
  feel: string;
  best: string;
  swatch: string;
  line: string;
}

const FABRIC_NOTES: Record<string, FabricNote> = {
  'Organic Mulmul Cotton': {
    weave: 'Fine plain weave, 80 × 80 count',
    weight: 'Ultra-light · around 90 GSM',
    feel: 'Cool and airy, softens with every wash',
    best: 'Summer kurtas, kaftans, everyday layering',
    swatch: '#E3DACB',
    line: 'The fabric Rajasthani households have slept under for generations — woven thin enough for a 42°C afternoon.',
  },
  'Chanderi Silk-Cotton': {
    weave: 'Satin weave with fine zari-style lines',
    weight: 'Light · around 120 GSM',
    feel: 'Barely-there sheen with a crisp hand',
    best: 'Occasion co-ords, dinner kurtas, gifting sets',
    swatch: '#D9C9AE',
    line: 'Chanderi in Madhya Pradesh is woven on pit looms. The translucent grain you see is the hand, not a defect.',
  },
  'Handloom Khadi Cotton': {
    weave: 'Hand-spun, hand-woven, uneven by design',
    weight: 'Mid · around 160 GSM',
    feel: 'Textured, warm, absorbs dye deeply',
    best: 'Structured tunics, overshirts, cooler months',
    swatch: '#CFC2AC',
    line: 'Slubs and thin stretches are proof of a handloom. Machine-made khadi has none of them.',
  },
  '300TC Percale Cotton': {
    weave: 'Tightly combed 300 thread-count percale',
    weight: 'Crisp · around 180 GSM',
    feel: 'Cool, matte, hotel-sheet crispness',
    best: 'Bedsheets, pillow covers, table linen',
    swatch: '#E7E1D6',
    line: 'Percale is a weave, not a fibre count — one over, one under, combed long-staple cotton.',
  },
  'Slub Linen & Cotton': {
    weave: 'Linen-cotton blend with deliberate slub',
    weight: 'Mid-light · around 150 GSM',
    feel: 'Dry handle that relaxes and drapes over time',
    best: 'Co-ord sets, wide-leg pants, travel layers',
    swatch: '#CBBEA6',
    line: 'Linen creases. Blended with mulmul it still does, only gently — and it dries in a fraction of the time.',
  },
};

export const FabricGuideSection: React.FC = () => {
  const [activeFabric, setActiveFabric] = useState(ALL_FABRICS[0]);
  const note = FABRIC_NOTES[activeFabric];

  return (
    <section id="fabric-guide" className="py-16 lg:py-24 bg-[#FDFBF7] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="max-w-2xl mb-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
            Fabric Guide · Read The Weave
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] font-normal tracking-tight text-balance">
            <AnimatedHeadline text="Five Cloths, Four Seasons." startDelay={0} stepDelay={150} keyPrefix="fabric" />
          </h2>
          <p className="text-[#5C5349] text-base leading-relaxed font-light">
            Every Ram Rass piece names its fabric plainly. Tap through the five weaves we work with and see
            exactly how each one behaves on the body and in the wash.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Fabric selector */}
          <Reveal variant="side" className="lg:col-span-4 flex flex-col gap-1.5">
            {ALL_FABRICS.map((fabric) => {
              const isActive = fabric === activeFabric;
              return (
                <button
                  key={fabric}
                  onClick={() => setActiveFabric(fabric)}
                  aria-pressed={isActive}
                  className={`group flex items-center gap-3 px-4 py-3.5 text-left border transition-all ${
                    isActive
                      ? 'border-[#1E1B18] bg-[#1E1B18] text-[#FDFBF7]'
                      : 'border-[#EDE6DC] bg-white text-[#5C5349] hover:border-[#C6934B] hover:text-[#1E1B18]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 shrink-0 rounded-full border border-[#1E1B18]/25"
                    style={{ backgroundColor: FABRIC_NOTES[fabric].swatch }}
                  />
                  <span className="text-xs uppercase tracking-wider font-medium leading-tight">{fabric}</span>
                  <span
                    className={`ml-auto text-[10px] uppercase tracking-widest transition-transform ${
                      isActive ? 'text-[#C6934B] translate-x-0' : 'text-[#B8ACA0] -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
                  >
                    View
                  </span>
                </button>
              );
            })}
          </Reveal>

          {/* Selected fabric detail — key change replays the entry animation */}
          <div className="lg:col-span-8">
            <div key={activeFabric} className="clotex-fade-up border border-[#EDE6DC] bg-[#FAF7F2] p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#E0D7CB] pb-5">
                <h3 className="font-serif text-2xl sm:text-3xl text-[#1E1B18]">{activeFabric}</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#A8523C] font-medium">
                  {note.weight}
                </p>
              </div>

              <p className="text-[#5C5349] leading-relaxed font-light text-sm sm:text-base italic">
                {note.line}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                {[
                  { term: 'Weave', detail: note.weave },
                  { term: 'Hand feel', detail: note.feel },
                  { term: 'Best for', detail: note.best },
                ].map((row) => (
                  <div key={row.term} className="space-y-1.5 pt-4 border-t border-[#E0D7CB]">
                    <dt className="uppercase tracking-[0.2em] text-[#7A6B5D] font-semibold">{row.term}</dt>
                    <dd className="text-[#1E1B18] leading-relaxed">{row.detail}</dd>
                  </div>
                ))}
              </dl>

              {/* Weight bar for a quick read of heaviness */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#7A6B5D]">
                  <span>Feather-light</span>
                  <span>Structured</span>
                </div>
                <div className="h-1 bg-[#E8DDD1] overflow-hidden">
                  <div
                    className="h-full bg-[#C6934B] clotex-draw"
                    style={{ width: `${Math.min(100, Math.round((parseInt(note.weight.match(/\d+/)?.[0] ?? '120', 10) / 200) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
