'use client';

import { useId } from 'react';

type ReloadSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
};

const SIZES = {
  sm: { width: 24, height: 48, fontSize: 8, stroke: 1.5 },
  md: { width: 32, height: 64, fontSize: 10, stroke: 2 },
  lg: { width: 40, height: 80, fontSize: 12, stroke: 2.25 },
} as const;

/** Chemin en forme de 8 vertical — le « 2 » suit cette courbe */
const FIGURE_EIGHT_PATH =
  'M 16 32 C 5 32 5 10 16 10 C 27 10 27 32 16 32 C 5 32 5 54 16 54 C 27 54 27 32 16 32';

export default function ReloadSpinner({
  size = 'md',
  className = '',
  label = 'Chargement',
}: ReloadSpinnerProps) {
  const { width, height, fontSize, stroke } = SIZES[size];
  const pathId = `tc2-eight-${useId().replace(/:/g, '')}`;

  return (
    <div
      className={`inline-flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 32 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <path
          d={FIGURE_EIGHT_PATH}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-400/35"
        />
        <text
          fontSize={fontSize}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="text-brand-400"
        >
          2
          <animateMotion dur="2.4s" repeatCount="indefinite" rotate="0">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </text>
        <path id={pathId} d={FIGURE_EIGHT_PATH} fill="none" stroke="none" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
