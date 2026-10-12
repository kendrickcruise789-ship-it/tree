import React from 'react';
import { Reveal } from './Reveal';
import { AnimatedHeadline } from './AnimatedHeadline';
import { CloudSnow, Sun, Layers, Shirt, Leaf, Scale, PackageOpen, Undo2 } from 'lucide-react';

const CARE_STEPS = [
  {
    icon: CloudSnow,
    title: 'Wash cold, first wash alone',
    body: '30°C or below, mild liquid detergent, no bleach. Botanical indigo and madder release a little colour in the first two washes — keep them separate.',
  },
  {
    icon: Sun,
    title: 'Dry in shade, never tucked',
    body: 'Line-dry away from direct sun. A tumble dryer shrinks mulmul and bakes the block print stiff; hang it and it keeps its drape.',
  },
  {
    icon: Shirt,
    title: 'Iron on the reverse',
    body: 'Medium heat while the cloth is still damp, printed side down. Pressing the face of a block print flattens the relief you paid for.',
  },
  {
    icon: Layers,
    title: 'Store breathable',
    body: 'Fold with unbleached muslin between the layers, in a cotton or cedar box. Plastic bags trap moisture and dull natural dyes over a season.',
  },
];

const PROMISES = [
  {
    icon: Leaf,
    title: 'Natural fibres only',
    body: 'Mulmul, chanderi, khadi, percale and linen. No polyester blends hiding in a "cotton" label.',
  },
  {
    icon: Scale,
    title: 'Published artisan wages',
    body: 'Printers, carvers and tailors are paid above the Bagru cooperative floor rate, and we print the numbers each season.',
  },
  {
    icon: PackageOpen,
    title: 'Plastic-free packaging',
    body: 'Recycled kraft boxes, paper tape, compostable mailers. Nothing in the parcel needs a landfill.',
  },
  {
    icon: Undo2,
    title: '30 unhurried days',
    body: 'Free returns within 30 days, and a repair desk instead of a bin if a seam gives out later.',
  },
];

export const CarePromiseSection: React.FC = () => {
  return (
    <section id="care-promises" className="py-16 lg:py-24 bg-[#F5EFE6] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Care rituals */}
        <div className="space-y-8">
          <Reveal className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
              Care · Make It Last A Decade
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] font-normal tracking-tight text-balance">
              <AnimatedHeadline text="Four Rituals, No Dry Cleaner." startDelay={0} stepDelay={140} keyPrefix="care" />
            </h2>
            <p className="text-[#5C5349] text-base leading-relaxed font-light">
              Hand-block cloth is not fragile — it just asks for a slightly slower routine. Four habits and a
              Clotex piece outlives the wardrobe it came from.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CARE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} variant="pop" delay={i * 120}>
                  <div className="h-full bg-[#FDFBF7] border border-[#EDE6DC] p-6 space-y-3 hover:border-[#C6934B] hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <Icon className="w-5 h-5 text-[#A8523C]" />
                      <span className="font-serif text-lg text-[#C6934B]">0{i + 1}</span>
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#1E1B18] leading-snug">{step.title}</h3>
                    <p className="text-xs text-[#5C5349] leading-relaxed">{step.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Promises */}
        <div className="space-y-8 pt-4 border-t border-[#E0D7CB]">
          <Reveal className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
              Promises · What We Hold Ourselves To
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1B18] font-normal tracking-tight text-balance">
              <AnimatedHeadline text="Four Commitments We Print." startDelay={0} stepDelay={140} keyPrefix="promise" />
            </h2>
            <p className="text-[#5C5349] text-base leading-relaxed font-light">
              If we cannot measure it and publish it, we do not claim it. These four are on every collection
              sheet we print.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROMISES.map((promise, i) => {
              const Icon = promise.icon;
              return (
                <Reveal key={promise.title} variant="pop" delay={i * 120}>
                  <div className="h-full bg-[#1E1B18] text-[#F3EFEA] p-6 space-y-3 hover:bg-[#2D2924] transition-colors duration-300">
                    <Icon className="w-5 h-5 text-[#C6934B]" />
                    <h3 className="font-serif text-lg font-medium text-[#FDFBF7] leading-snug">{promise.title}</h3>
                    <p className="text-xs text-[#B8ACA0] leading-relaxed">{promise.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
