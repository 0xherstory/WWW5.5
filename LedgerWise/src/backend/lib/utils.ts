// Premium luxury color themes for savings goals - inspired by precious gemstones
export const PREMIUM_THEMES = {
  gold: {
    // Signature luxury gold - matching LedgerWise branding
    gradient: 'linear-gradient(to bottom right, #fbbf24, #eab308, #d97706)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-950',
    subtext: 'text-amber-900/50',
    border: 'border-amber-100/60',
    bg: 'bg-amber-50/40',
    icon: 'text-amber-700',
    glow: 'shadow-amber-400/20'
  },
  ruby: {
    // Deep burgundy/wine - like precious rubies
    gradient: 'linear-gradient(to bottom right, #9f1239, #881337, #7f1d1d)',
    glowColor: 'rgba(136, 19, 55, 0.4)',
    text: 'text-rose-950',
    subtext: 'text-rose-950/50',
    border: 'border-rose-100/60',
    bg: 'bg-rose-50/40',
    icon: 'text-rose-900',
    glow: 'shadow-rose-900/20'
  },
  emerald: {
    // Deep forest emerald - sophisticated green
    gradient: 'linear-gradient(to bottom right, #065f46, #064e3b, #134e4a)',
    glowColor: 'rgba(6, 78, 59, 0.4)',
    text: 'text-emerald-950',
    subtext: 'text-emerald-950/50',
    border: 'border-emerald-100/60',
    bg: 'bg-emerald-50/40',
    icon: 'text-emerald-900',
    glow: 'shadow-emerald-900/20'
  },
  sapphire: {
    // Deep midnight blue/navy - like sapphires
    gradient: 'linear-gradient(to bottom right, #1e293b, #0f172a, #18181b)',
    glowColor: 'rgba(30, 41, 59, 0.4)',
    text: 'text-slate-950',
    subtext: 'text-slate-900/50',
    border: 'border-slate-100/60',
    bg: 'bg-slate-50/40',
    icon: 'text-slate-900',
    glow: 'shadow-slate-900/20'
  }
} as const;

export type PremiumTheme = keyof typeof PREMIUM_THEMES;
