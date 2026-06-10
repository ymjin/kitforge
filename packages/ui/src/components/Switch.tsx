import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface SwitchProps extends Omit<AriaSwitchProps, "className" | "children"> {
  /** Label content shown next to the track. */
  children?: ReactNode;
  className?: string;
}

/**
 * A toggle switch (React Aria `Switch`). Has no native HTML equivalent, so this
 * gives every project the same iOS-style control.
 */
export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <AriaSwitch className={cx("kf-switch", className)} {...props}>
      <span aria-hidden="true" className="kf-switch__track">
        <span className="kf-switch__thumb" />
      </span>
      {children != null && <span className="kf-switch__label">{children}</span>}
    </AriaSwitch>
  );
}
