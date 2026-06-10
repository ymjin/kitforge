import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface CheckboxProps extends Omit<AriaCheckboxProps, "className" | "children"> {
  /** Label content shown next to the box. */
  children?: ReactNode;
  className?: string;
}

/**
 * A checkbox (React Aria `Checkbox`) with a custom indicator, so its appearance
 * is identical everywhere — unlike the OS-rendered native checkbox.
 */
export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox className={cx("kf-checkbox", className)} {...props}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span aria-hidden="true" className="kf-checkbox__box">
            {isIndeterminate ? "–" : isSelected ? "✓" : ""}
          </span>
          {children != null && <span className="kf-checkbox__label">{children}</span>}
        </>
      )}
    </AriaCheckbox>
  );
}
