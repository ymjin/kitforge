/**
 * Color tokens — the single source of truth for every palette value.
 * Scales run 50 (lightest) → 900 (darkest), matching common design-system
 * conventions so they map cleanly onto Tailwind's color shape.
 */
export const color = {
  primary: {
    50: "#eef4ff",
    100: "#d9e6ff",
    200: "#bcd3ff",
    300: "#8db6ff",
    400: "#578eff",
    500: "#2f66f6",
    600: "#1a4aeb",
    700: "#1539d4",
    800: "#1730ab",
    900: "#192e87",
  },
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type Color = typeof color;
