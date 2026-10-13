import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'up' | 'pop' | 'side' | 'fade';
  once?: boolean;
}

/**
 * Fades/slides its children in when they scroll into view.
 * `prefers-reduced-motion` is handled in index.css, so no JS check is needed here.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  variant = 'up',
  // Reveals replay when a section scrolls back into view; a visitor who scrolls
  // up should see the animation again rather than a static block.
  once = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Anything already inside the viewport shows straight away. Without this,
    // content would stay invisible until IntersectionObserver delivers a callback,
    // which a backgrounded or non-rendering tab never does.
    const rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 0) && rect.bottom > 0) {
      setVisible(true);
    }
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const variantClass =
    variant === 'pop' ? 'reveal--pop' : variant === 'side' ? 'reveal--side' : variant === 'fade' ? 'reveal--fade' : '';

  return (
    <div
      ref={ref}
      style={{ ['--rv-delay' as string]: `${delay}ms` }}
      className={`reveal ${variantClass} ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
