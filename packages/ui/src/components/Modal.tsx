import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface ModalProps extends Omit<ModalOverlayProps, "className" | "children"> {
  /** Dialog title, rendered as a heading. */
  title?: ReactNode;
  /**
   * Body. Either nodes, or a render function receiving `{ close }` so buttons
   * inside can dismiss the modal.
   */
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  className?: string;
}

/**
 * A modal dialog (React Aria `ModalOverlay` + `Modal` + `Dialog`).
 *
 * Handles focus trapping, scroll locking, `Esc` to close, and click-outside
 * dismissal — the parts that are easy to get wrong by hand.
 *
 * Controlled:
 * ```tsx
 * <Modal isOpen={open} onOpenChange={setOpen} title="제목" isDismissable>
 *   {({ close }) => <Button onPress={close}>닫기</Button>}
 * </Modal>
 * ```
 */
export function Modal({ title, children, className, ...props }: ModalProps) {
  return (
    <ModalOverlay className="kf-modal__overlay" {...props}>
      <AriaModal className={cx("kf-modal", className)}>
        <Dialog className="kf-modal__dialog">
          {({ close }) => (
            <>
              {title != null && (
                <Heading slot="title" className="kf-modal__title">
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
