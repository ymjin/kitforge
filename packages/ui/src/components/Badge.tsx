import type { HTMLAttributes } from "react";
import { cx } from "../utils/cx.js";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color/intent. Default: `"neutral"`. */
  variant?: BadgeVariant;
}

/** A small status/label pill, styled with `@ymjin/tokens`. */
export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return <span className={cx("kf-badge", `kf-badge--${variant}`, className)} {...props} />;
}
