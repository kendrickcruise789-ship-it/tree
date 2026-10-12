import React from 'react';

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
  startDelay?: number;
  stepDelay?: number;
  keyPrefix?: string;
}

/** Renders a headline whose words wipe in one after another. */
export const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = ({
  text,
  className = '',
  startDelay = 0,
  stepDelay = 110,
  keyPrefix = 'word',
}) => {
  const words = text.split(' ');
  return (
    <span className={className}>
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
