import {
  DialogTrigger,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
  Dialog,
  OverlayArrow,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface PopoverProps extends Pick<AriaPopoverProps, "placement"> {
  /**
   * The element that opens the popover — must be a focusable React Aria
   * trigger, typically a `<Button>` from `@kitforge/ui`.
   */
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A floating popover anchored to a trigger (React Aria `DialogTrigger` +
 * `Popover`). Handles positioning, focus management, and dismissal.
 *
 * ```tsx
 * <Popover trigger={<Button>옵션</Button>}>
 *   <p>패널 내용</p>
 * </Popover>
 * ```
 */
export function Popover({ trigger, children, className, placement = "bottom" }: PopoverProps) {
  return (
    <DialogTrigger>
      {trigger}
      <AriaPopover className={cx("kf-popover kf-popover--floating", className)} placement={placement}>
        <OverlayArrow className="kf-popover__arrow">
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
        <Dialog className="kf-popover__dialog">{children}</Dialog>
      </AriaPopover>
    </DialogTrigger>
  );
}
