import React from 'react';

const PHRASES = [
  'Hand-block printed in Bagru',
  '100% natural mulmul & chanderi',
  'AZO-free botanical dyes',
  'Fair, published artisan wages',
  'Small batches, no seasonal dumps',
  'Plastic-free packaging',
];

/** Renders the phrase list twice so the 50% translate loops seamlessly. */
export const MarqueeStrip: React.FC = () => {
  const track = (duplicate: boolean) => (
    <div className="clotex-marquee-group" aria-hidden={duplicate || undefined}>
      {PHRASES.map((phrase, i) => (
        <React.Fragment key={`${duplicate ? 'dup' : 'base'}-${i}`}>
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] font-medium whitespace-nowrap">
            {phrase}
          </span>
          <span aria-hidden="true" className="text-[#C6934B]">&#10022;</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-[#1E1B18] text-[#E8DDD1] py-3.5 border-b border-[#2D2924]">
      <p className="sr-only">
        Clotex is hand-block printed in Bagru using natural fabrics, botanical dyes and fair artisan wages.
      </p>
      <div className="clotex-marquee">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
};
