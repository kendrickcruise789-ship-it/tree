import React, { useEffect, useRef, useState } from 'react';

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
  startDelay?: number;
  stepDelay?: number;
  keyPrefix?: string;
}

/** Renders a headline whose words wipe in one after another, every time it scrolls into view. */
export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({
  text,
  className = '',
  startDelay = 0,
  stepDelay = 110,
  keyPrefix = 'word',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 0) && rect.bottom > 0) {
      setPending(false);
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setPending(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Dropping the class restarts the CSS wipe from the first word.
          setPending(!entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const words = text.split(' ');
  return (
    <span ref={ref} className={`${className} ${pending ? 'clotex-words-pending' : ''}`.trim()}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${keyPrefix}-${i}`}
            className="clotex-word"
            style={{ animationDelay: `${startDelay + i * stepDelay}ms` }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </span>
    </span>
  );
};
