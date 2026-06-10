import {
  TooltipTrigger,
  type TooltipTriggerComponentProps,
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  OverlayArrow,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface TooltipProps
  extends Pick<AriaTooltipProps, "placement">,
    Pick<TooltipTriggerComponentProps, "delay" | "closeDelay"> {
  /** The trigger element (a focusable React Aria element, e.g. `<Button>`). */
  children: ReactNode;
  /** Tooltip content. */
  content: ReactNode;
  className?: string;
}

/**
 * A tooltip shown on hover/focus (React Aria `TooltipTrigger` + `Tooltip`).
 * Works with mouse, keyboard, and touch, and never traps focus.
 *
 * ```tsx
 * <Tooltip content="저장합니다">
 *   <Button>저장</Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  content,
  className,
  placement = "top",
  delay,
  closeDelay,
}: TooltipProps) {
  return (
    <TooltipTrigger delay={delay} closeDelay={closeDelay}>
      {children}
      <AriaTooltip className={cx("kf-tooltip", className)} placement={placement}>
        <OverlayArrow className="kf-tooltip__arrow">
          <svg width={8} height={8} viewBox="0 0 8 8" aria-hidden="true">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
