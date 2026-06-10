import { cx } from "../utils/cx.js";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** Size preset. Default: `"md"`. */
  size?: SpinnerSize;
  /** Accessible label. Default: `"로딩 중"`. */
  label?: string;
  className?: string;
}

/** An indeterminate loading spinner. */
export function Spinner({ size = "md", label = "로딩 중", className }: SpinnerProps) {
  return (
    <span
      className={cx("kf-spinner", `kf-spinner--${size}`, className)}
      role="progressbar"
      aria-label={label}
    >
      <svg className="kf-spinner__svg" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="kf-spinner__track" cx="12" cy="12" r="9" fill="none" />
        <circle className="kf-spinner__indicator" cx="12" cy="12" r="9" fill="none" />
      </svg>
    </span>
  );
}
