/**
 * Border tokens — radius and width primitives shared across widgets so corners
 * and outlines stay consistent everywhere.
 */
export const radius = {
  none: "0rem",
  sm: "0.125rem",
  base: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export const borderWidth = {
  0: "0px",
  1: "1px",
  2: "2px",
  4: "4px",
} as const;

export type Radius = typeof radius;
export type BorderWidth = typeof borderWidth;
