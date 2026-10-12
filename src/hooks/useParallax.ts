import { useEffect, useRef } from 'react';

/**
 * Drifts an element against the scroll position for a parallax effect.
 * Writes straight to the DOM so scrolling never re-renders the React tree.
 */
export function useParallax<T extends HTMLElement>(strength = 0.1, maxPx = 60) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      const offset = Math.max(-maxPx, Math.min(maxPx, -fromCentre * strength));
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [strength, maxPx]);

  return ref;
}
