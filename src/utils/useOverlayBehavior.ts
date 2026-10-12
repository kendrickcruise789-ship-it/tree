import { useEffect } from 'react';

/**
 * Wires up the behaviour every Rambagh overlay is missing: Escape to dismiss,
 * background scroll locked while open, and initial focus into the panel.
 */
export function useOverlayBehavior(
  isOpen: boolean,
  onClose: () => void,
  panelRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef?.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus({ preventScroll: true });
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose, panelRef]);
}
