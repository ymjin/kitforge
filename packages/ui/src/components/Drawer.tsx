import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type DrawerPlacement = "left" | "right" | "top" | "bottom";

export interface DrawerProps extends Omit<ModalOverlayProps, "className" | "children"> {
  title?: ReactNode;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Edge the drawer slides in from. Default: `"right"`. */
  placement?: DrawerPlacement;
  className?: string;
}

/**
 * A panel that slides in from a screen edge (React Aria `Modal`, styled as a
 * drawer). Same focus-trap / scroll-lock / dismissal guarantees as `Modal`.
 *
 * ```tsx
 * <Drawer isOpen={open} onOpenChange={setOpen} title="메뉴" placement="left" isDismissable>
 *   {({ close }) => <nav>…</nav>}
 * </Drawer>
 * ```
 */
export function Drawer({
  title,
  children,
  placement = "right",
  className,
  ...props
}: DrawerProps) {
  return (
    <ModalOverlay className="kf-drawer__overlay" {...props}>
      <AriaModal className={cx("kf-drawer", `kf-drawer--${placement}`, className)}>
        <Dialog className="kf-drawer__dialog">
          {({ close }) => (
            <>
              {title != null && (
                <Heading slot="title" className="kf-drawer__title">
                  {title}
                </Heading>
              )}
              {typeof children === "function" ? children({ close }) : children}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
