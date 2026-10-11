import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Aditi Mukherji',
      location: 'New Delhi, India',
      silhouette: 'Aurelia Chanderi Tiered Dress (Size M)',
      comment:
        'The drape of this chanderi dress is unbelievable. The block print has that subtle artisanal imperfection that proves it was pressed by human hands. Wore it to an evening garden dinner and received endless compliments.',
      rating: 5,
      date: 'Purchased March 2026',
    },
    {
      name: 'Elena Rostova',
      location: 'London, UK',
      silhouette: 'Indigo Bagh Relaxed Co-Ord Set (Size S)',
      comment:
        'Finding genuine natural indigo apparel with contemporary tailored proportions is rare. The pants are supremely comfortable and the cotton softens with every gentle wash. Delivery to London was faster than expected.',
      rating: 5,
      date: 'Purchased February 2026',
    },
    {
      name: 'Meera Patel',
      location: 'San Jose, California',
      silhouette: 'Sienna Pin-Tuck Handloom Tunic (Size L)',
      comment:
        'The mother-of-pearl buttons and micro pin-tucks reflect such thoughtful attention to detail. It feels breathable even during hot summer afternoons. I also appreciate the transparent artisan attribution.',
      rating: 5,
      date: 'Purchased April 2026',
    },
  ];

  return (
    <section className="py-16 bg-[#FDFBF7] border-b border-[#EDE6DC]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7A6B5D] font-medium">
            Verified Experiences
          </p>
          <h2 className="font-serif text-3xl font-normal text-[#1E1B18]">
            Loved by Women Across the Globe
          </h2>
          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#5C5349]">
            <div className="flex text-[#C6934B]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span>4.9 / 5.0 Average Rating Across 280+ Handcrafted Orders</span>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="p-6 bg-white border border-[#EFE9DF] flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-[#C6934B]">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#7A6B5D] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#2F6F4E]" />
                    Verified Patron
                  </span>
                </div>

                <p className="text-xs text-[#5C5349] leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#F4EFEA] space-y-0.5">
                <p className="font-serif font-medium text-sm text-[#1E1B18]">{r.name}</p>
                <p className="text-[11px] text-[#7A6B5D]">{r.location}</p>
                <p className="text-[10px] text-[#A89C8F] uppercase tracking-wider">{r.silhouette}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
