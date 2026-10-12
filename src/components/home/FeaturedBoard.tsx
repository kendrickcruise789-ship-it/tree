import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Currency, Product } from '../../types';
import { buildBoardSlides } from './boardSlides';
import { BoardSlideView } from './BoardSlideView';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const AUTO_ADVANCE_MS = 6500;
const PROGRESS_TICK_MS = 60;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface FeaturedBoardProps {
  products: Product[];
  currency: Currency;
  /** Jumps to the shop filtered to a category. */
  onShopCategory: (category: string) => void;
  /** Opens the product detail modal. */
  onViewProduct: (product: Product) => void;
  onGoToClothing: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Full-bleed exhibition board fed by the live catalogue. Rotates 2-5 featured
 * pieces with a cross-fade + wipe, progress dots and pause-on-hover/focus.
 * Renders nothing below 2 slides so the parent can fall back to a simpler band.
 */
export const FeaturedBoard: React.FC<FeaturedBoardProps> = ({
  products,
  currency,
  onShopCategory,
  onViewProduct,
  onGoToClothing,
}) => {
  const slides = useMemo(() => buildBoardSlides(products), [products]);
  const slideCount = slides.length;

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [tabHidden, setTabHidden] = useState(
    () => document.visibilityState === 'hidden'
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const paused = hovered || focusWithin || tabHidden;

  // The owner can edit the catalogue while the page is open; keep the index
  // valid when the slide list shrinks.
  useEffect(() => {
    setIndex((current) => (current < slideCount ? current : 0));
  }, [slideCount]);

  // Fresh slide = fresh progress bar, for manual and auto changes alike.
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [index, slideCount]);

  // The interval is torn down whenever pause state, motion preference or the
  // catalogue changes, so a products-array swap can never leak a timer.
  useEffect(() => {
    if (reducedMotion || paused || slideCount < 2) return;
    const timer = window.setInterval(() => {
      const next = progressRef.current + PROGRESS_TICK_MS / AUTO_ADVANCE_MS;
      if (next >= 1) {
        progressRef.current = 0;
        setProgress(0);
        setIndex((current) => (current + 1) % slideCount);
      } else {
        progressRef.current = next;
        setProgress(next);
      }
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused, slideCount]);

  useEffect(() => {
    const onVisibilityChange = () =>
      setTabHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const advance = useCallback(
    (delta: number) => {
      if (slideCount === 0) return;
      setIndex((current) => (((current + delta) % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goTo = useCallback(
    (target: number) => {
      setIndex(target);
    },
    []
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      advance(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      advance(-1);
    }
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && boardRef.current?.contains(next)) return;
    setFocusWithin(false);
  };

  if (slideCount < 2) return null;

  const controlClass =
    'flex h-9 w-9 items-center justify-center border border-[#3C352D] text-[#1E1B18] hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured pieces from the live catalogue"
      className="relative overflow-hidden bg-[#F7F3ED] border-b border-[#EDE6DC] py-14 lg:py-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Board-scoped keyframes only; the shared motion layer in index.css stays untouched. */}
      <style>{`
        @keyframes clotex-board-kenburns {
          from { transform: scale(1.02) translate3d(0, 0, 0); }
          to   { transform: scale(1.09) translate3d(0, -2%, 0); }
        }
        .clotex-board-kenburns {
          animation: clotex-board-kenburns 16s ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .clotex-board-kenburns { animation: none; }
        }
      `}</style>

      <div
        ref={boardRef}
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={handleBlurCapture}
        onKeyDown={handleKeyDown}
        className="max-w-7xl mx-auto px-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6934B] font-medium">
              The Board · Pulled From Today&apos;s Catalogue
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] tracking-tight">
              On The Cutting Table
            </h2>
          </div>
          <button
            type="button"
            onClick={onGoToClothing}
            className="group self-start sm:self-auto px-6 py-3 border border-[#3C352D] text-[11px] uppercase tracking-[0.2em] font-medium text-[#1E1B18] hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]"
          >
            <span>Browse Everything</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* All slides share one grid cell so the stack sizes itself to the
            tallest slide and the active image can wipe over the outgoing one.
            `visibility` is in the transition list so finished slides leave the
            tab order only after their fade completes. */}
        <div className="grid">
          {slides.map((slide, i) => {
            const isActive = i === index;
            if (reducedMotion && !isActive) return null;
            const stateClass = reducedMotion
              ? ''
              : `transition-[opacity,transform,visibility] duration-700 ease-[cubic-bezier(0.22,0.9,0.28,1)] ${
                  isActive
                    ? 'visible opacity-100 translate-x-0 z-10'
                    : `invisible opacity-0 pointer-events-none ${
                        i < index ? '-translate-x-8' : 'translate-x-8'
                      }`
                }`;
            return (
              <div
                key={slide.product.id}
                className={`col-start-1 row-start-1 min-w-0 ${stateClass}`}
              >
                <BoardSlideView
                  slide={slide}
                  position={i}
                  total={slideCount}
                  isActive={isActive}
                  reducedMotion={reducedMotion}
                  currency={currency}
                  onShopCategory={onShopCategory}
                  onViewProduct={onViewProduct}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => advance(-1)}
              className={controlClass}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => advance(1)}
              className={controlClass}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => {
              const isActive = i === index;
              return (
                <button
                  key={slide.product.id}
                  type="button"
                  aria-label={`Show slide ${i + 1} of ${slideCount}: ${slide.product.title}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => goTo(i)}
                  className={
                    isActive
                      ? 'relative h-2.5 w-14 overflow-hidden rounded-full bg-[#E5DFD7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]'
                      : 'h-2.5 w-2.5 rounded-full bg-[#D5C9B9] hover:bg-[#1E1B18] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6934B]'
                  }
                >
                  {isActive && !reducedMotion && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 origin-left bg-[#C6934B] ease-linear transition-transform duration-[60ms]"
                      style={{ transform: `scaleX(${progress})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="sr-only" aria-live="polite">
            {`Slide ${index + 1} of ${slideCount}`}
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBoard;
