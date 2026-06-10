import {
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
  Label,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressProps extends Omit<AriaProgressBarProps, "className" | "children"> {
  label?: ReactNode;
  /** Show the percentage next to the label. Default: true (ignored if indeterminate). */
  showValue?: boolean;
  /** Bar thickness. Default: `"md"`. */
  size?: ProgressSize;
  className?: string;
}

/**
 * A progress bar (React Aria `ProgressBar`). Pass `value` (with optional
 * `minValue`/`maxValue`) for a determinate bar, or `isIndeterminate` for an
 * ongoing operation of unknown length.
 */
export function Progress({
  label,
  showValue = true,
  size = "md",
  className,
  ...props
}: ProgressProps) {
  return (
    <AriaProgressBar className={cx("kf-progress", `kf-progress--${size}`, className)} {...props}>
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          {(label != null || (showValue && !isIndeterminate)) && (
            <div className="kf-progress__header">
              {label != null ? <Label className="kf-field__label">{label}</Label> : <span />}
              {showValue && !isIndeterminate && (
                <span className="kf-progress__value">{valueText}</span>
              )}
            </div>
          )}
          <div className="kf-progress__track">
            <div
              className={cx(
                "kf-progress__fill",
                isIndeterminate && "kf-progress__fill--indeterminate",
              )}
              style={isIndeterminate ? undefined : { width: `${percentage ?? 0}%` }}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}
