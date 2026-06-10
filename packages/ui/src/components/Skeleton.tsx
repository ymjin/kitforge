import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../utils/cx.js";

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** CSS width, e.g. `"100%"` or `200`. */
  width?: string | number;
  /** CSS height, e.g. `"1rem"` or `40`. */
  height?: string | number;
  /** Border radius override. Use `"9999px"` for a circle. */
  radius?: string | number;
}

/** A pulsing placeholder shown while content loads. */
export function Skeleton({ width, height, radius, style, className, ...props }: SkeletonProps) {
  const inlineStyle: CSSProperties = {
    width,
    height,
    ...(radius !== undefined ? { borderRadius: radius } : null),
    ...style,
  };
  return (
    <div
      className={cx("kf-skeleton", className)}
      aria-hidden="true"
      style={inlineStyle}
      {...props}
    />
  );
}
