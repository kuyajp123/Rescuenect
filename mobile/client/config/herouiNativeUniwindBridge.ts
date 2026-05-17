import { Uniwind } from 'uniwind';

/**
 * Temporary bridge to prevent `heroui-native` from crashing when used inside a
 * NativeWind (Tailwind v3) project.
 *
 * HeroUI Native's `useThemeColor` reads CSS variables via Uniwind's internal
 * variable store. If Uniwind isn't configured (Tailwind v4 + `withUniwindConfig`),
 * `useThemeColor(...)` can resolve to `"invalid"`, which then crashes Reanimated
 * when a component tries to animate a color.
 *
 * Once you fully migrate to Uniwind (Tailwind v4), remove this file + import.
 */

Uniwind.updateCSSVariables('light', {
  '--color-background': '#f8fafc',
  '--color-foreground': '#000000',
  '--color-surface': '#ffffff',
  '--color-muted': '#71717a',
  '--color-border': '#e4e4e7',

  '--color-accent': '#0ea5e9',
  '--color-accent-foreground': '#ffffff',
  '--color-accent-hover': '#0284c7',

  '--color-default': '#e4e4e7',
  '--color-default-foreground': '#000000',
  '--color-default-hover': '#e4e4e7',

  '--color-success': '#10b981',
  '--color-success-foreground': '#ffffff',
  '--color-success-hover': '#059669',

  '--color-warning': '#f59e0b',
  '--color-warning-foreground': '#000000',
  '--color-warning-hover': '#d97706',

  '--color-danger': '#ef4444',
  '--color-danger-foreground': '#ffffff',
  '--color-danger-hover': '#dc2626',
  '--color-danger-soft-hover': 'rgba(239, 68, 68, 0.2)',
});

Uniwind.updateCSSVariables('dark', {
  '--color-background': '#171717',
  '--color-foreground': '#f2f2f2',
  '--color-surface': '#262626',
  '--color-muted': '#a3a3aa',
  '--color-border': '#3f3f46',

  '--color-accent': '#2563eb',
  '--color-accent-foreground': '#ffffff',
  '--color-accent-hover': '#3b82f6',

  '--color-default': '#3f3f46',
  '--color-default-foreground': '#f2f2f2',
  '--color-default-hover': '#3f3f46',

  '--color-success': '#10b981',
  '--color-success-foreground': '#ffffff',
  '--color-success-hover': '#34d399',

  '--color-warning': '#fbbf24',
  '--color-warning-foreground': '#000000',
  '--color-warning-hover': '#f59e0b',

  '--color-danger': '#ef4444',
  '--color-danger-foreground': '#ffffff',
  '--color-danger-hover': '#f87171',
  '--color-danger-soft-hover': 'rgba(248, 113, 113, 0.25)',
});
