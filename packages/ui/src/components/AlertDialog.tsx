import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Button, type ButtonVariant } from "./Button.js";

export interface AlertDialogProps extends Omit<ModalOverlayProps, "className" | "children"> {
  title: ReactNode;
  /** Body content / message. */
  children?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** Variant of the confirm button. Use `"danger"` for destructive actions. */
  confirmVariant?: ButtonVariant;
  /** Called when the user confirms. The dialog closes afterwards. */
  onConfirm?: () => void;
  className?: string;
}

/**
 * A confirmation dialog (React Aria `Dialog` with `role="alertdialog"`).
 * Replaces the browser's `confirm()` with a styled, accessible prompt.
 *
 * ```tsx
 * <AlertDialog
 *   isOpen={open} onOpenChange={setOpen}
 *   title="삭제할까요?" confirmLabel="삭제" confirmVariant="danger"
 *   onConfirm={remove}
 * >
 *   이 작업은 되돌릴 수 없습니다.
 * </AlertDialog>
 * ```
 */
export function AlertDialog({
  title,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "primary",
  onConfirm,
  className,
  ...props
}: AlertDialogProps) {
  return (
    <ModalOverlay className="kf-modal__overlay" {...props}>
      <AriaModal className={cx("kf-modal", "kf-alertdialog", className)}>
        <Dialog role="alertdialog" className="kf-modal__dialog">
          {({ close }) => (
            <>
              <Heading slot="title" className="kf-modal__title">
                {title}
              </Heading>
              {children != null && <div className="kf-alertdialog__body">{children}</div>}
              <div className="kf-alertdialog__actions">
                <Button variant="ghost" onPress={close}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={confirmVariant}
                  onPress={() => {
                    onConfirm?.();
                    close();
                  }}
                >
                  {confirmLabel}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
