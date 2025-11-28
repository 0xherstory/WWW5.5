'use client';

import React from 'react';

// Local theme configuration for dot grid progress
const DOT_THEMES = {
  mint: {
    gradient: 'linear-gradient(135deg, #52B788 0%, #B2F2BB 100%)',
    glowColor: 'rgba(82, 183, 136, 0.4)',
    inactiveBg: 'bg-emerald-50/60',
    inactiveBorder: 'border-emerald-100/50'
  },
  coral: {
    gradient: 'linear-gradient(135deg, #FF847C 0%, #FFB4A2 100%)',
    glowColor: 'rgba(255, 132, 124, 0.4)',
    inactiveBg: 'bg-orange-50/60',
    inactiveBorder: 'border-orange-100/50'
  },
  blue: {
    gradient: 'linear-gradient(135deg, #5D9CEC 0%, #A0C4FF 100%)',
    glowColor: 'rgba(93, 156, 236, 0.4)',
    inactiveBg: 'bg-blue-50/60',
    inactiveBorder: 'border-blue-100/50'
  },
  gold: {
    gradient: 'linear-gradient(135deg, #C8AD6E 0%, #E6D5A8 100%)',
    glowColor: 'rgba(200, 173, 110, 0.4)',
    inactiveBg: 'bg-stone-100/60',
    inactiveBorder: 'border-stone-200/50'
  }
} as const;

type DotTheme = keyof typeof DOT_THEMES;

// Theme mapping: maps old theme names to new ones for backward compatibility
const THEME_MAPPING: Record<string, DotTheme> = {
  'ruby': 'coral',
  'sapphire': 'blue',
  'emerald': 'mint',
  'gold': 'gold',
  'mint': 'mint',
  'coral': 'coral',
  'blue': 'blue'
};

interface DotGridProgressProps {
  percentage: number;
  theme: string; // Accept any string for backward compatibility
  columns?: number;
  rows?: number;
}

export const DotGridProgress: React.FC<DotGridProgressProps> = ({
  percentage,
  theme = 'gold',
  columns = 5,
  rows = 3
}) => {
  const totalDots = columns * rows;
  // Ensure at least 1 dot is filled if percentage > 0
  const filledDots = percentage > 0
    ? Math.max(1, Math.round((percentage / 100) * totalDots))
    : 0;

  // Map theme name and provide fallback to 'gold' if invalid
  const mappedTheme = THEME_MAPPING[theme] || 'gold';
  const styles = DOT_THEMES[mappedTheme];

  return (
    <div
      className="grid gap-3 w-fit"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {Array.from({ length: totalDots }).map((_, i) => {
        const isActive = i < filledDots;

        // Staggered animation delay for a cascading effect
        const delay = i * 50;

        return (
          <div
            key={i}
            className={`
              relative w-7 h-7 rounded-full transition-all duration-700 ease-out
              ${isActive ? 'scale-100 opacity-100' : `${styles.inactiveBg} border-2 ${styles.inactiveBorder} scale-95 opacity-80`}
            `}
            style={{
              transitionDelay: `${delay}ms`,
              background: isActive ? styles.gradient : undefined,
              boxShadow: isActive
                ? `0 4px 12px ${styles.glowColor}`
                : 'none'
            }}
          >
            {/* Inner highlight for gemstone effect */}
            {isActive && (
              <div
                className="absolute top-0.5 left-1 w-2 h-1.5 bg-white/50 rounded-full blur-[1px] pointer-events-none"
                style={{ transitionDelay: `${delay + 200}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
