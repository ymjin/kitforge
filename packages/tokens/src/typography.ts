/**
 * Typography tokens — font families, sizes, weights, and line heights.
 * Kept as plain values so they can feed CSS variables, JS consumers, and the
 * Tailwind preset identically.
 */
export const fontFamily = {
  sans: [
    "Inter",
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ].join(", "),
  mono: [
    "JetBrains Mono",
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ].join(", "),
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  none: "1",
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.75",
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
