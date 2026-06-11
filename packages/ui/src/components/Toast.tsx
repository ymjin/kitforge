"use client";
/**
 * A lightweight toast system. React Aria's toast is still unstable, so this is
 * a small self-contained queue + context + portal — enough for app-level
 * notifications, styled with `@ymjin/tokens`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "../utils/cx.js";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  /** Visual style. Default: `"info"`. */
  variant?: ToastVariant;
  /** Override the provider's auto-dismiss duration (ms). 0 disables it. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "variant">> {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
}

interface ToastContextValue {
  /** Show a toast; returns its id. Pass a string for a quick info toast. */
  toast: (options: ToastOptions | string) => string;
  /** Dismiss a toast by id. */
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  /** Auto-dismiss after this many ms. 0 disables. Default: 5000. */
  duration?: number;
}

export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      const opts: ToastOptions = typeof options === "string" ? { description: options } : options;
      seq.current += 1;
      const id = `kf-toast-${seq.current}`;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? "info",
      };
      setToasts((list) => [...list, item]);

      const ms = opts.duration ?? duration;
      if (ms > 0) setTimeout(() => dismiss(id), ms);
      return id;
    },
    [duration, dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="kf-toast__region" role="region" aria-label="알림">
            {toasts.map((t) => (
              <div key={t.id} className={cx("kf-toast", `kf-toast--${t.variant}`)} role="alert">
                <div className="kf-toast__content">
                  {t.title != null && <div className="kf-toast__title">{t.title}</div>}
                  {t.description != null && (
                    <div className="kf-toast__description">{t.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="kf-toast__close"
                  aria-label="닫기"
                  onClick={() => dismiss(t.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/** Access the toast queue. Must be used inside a {@link ToastProvider}. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("[@ymjin/ui] useToast must be used inside a <ToastProvider>.");
  }
  return ctx;
}
