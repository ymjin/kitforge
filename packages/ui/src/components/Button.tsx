import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cx } from "../utils/cx.js";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<AriaButtonProps, "className"> {
  /** Visual style. Default: `"primary"`. */
  variant?: ButtonVariant;
  /** Size. Default: `"md"`. */
  size?: ButtonSize;
  className?: string;
}

/**
 * A button built on React Aria, styled with `@ymjin/tokens`.
 *
 * Handles press/hover/focus-visible/disabled states with correct accessibility
 * and keyboard behavior across every browser.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      className={cx("kf-button", `kf-button--${variant}`, `kf-button--${size}`, className)}
      {...props}
    />
  );
}
