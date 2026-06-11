/**
 * @ymjin/tokens — the single source of truth for every design value.
 *
 * One definition, three outputs:
 *   ① this TS/JS module (import the objects directly)
 *   ② dist/tokens.css      (CSS custom properties, generated at build time)
 *   ③ dist/tailwind-preset.cjs (Tailwind theme preset, generated at build time)
 *
 * Every output is derived from the objects below, so they can never drift apart.
 */
export { color, type Color } from "./color.js";
export { radius, borderWidth, type Radius, type BorderWidth } from "./border.js";
export { spacing, type Spacing } from "./spacing.js";
export { shadow, type Shadow } from "./shadow.js";
export {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  type FontFamily,
  type FontSize,
  type FontWeight,
  type LineHeight,
} from "./typography.js";

import { color } from "./color.js";
import { radius, borderWidth } from "./border.js";
import { spacing } from "./spacing.js";
import { shadow } from "./shadow.js";
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from "./typography.js";

/** Every token group under one namespace — handy for the build generators. */
export const tokens = {
  color,
  radius,
  borderWidth,
  spacing,
  shadow,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} as const;

export type Tokens = typeof tokens;
