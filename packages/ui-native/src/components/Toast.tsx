import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Text, View } from "react-native";
import { cx } from "../utils/cx.js";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** Override the provider's auto-dismiss duration (ms). 0 disables. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "variant">> {
  id: string;
  title?: string;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions | string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const BORDER: Record<ToastVariant, string> = {
  info: "border-l-primary-500",
  success: "border-l-success-500",
  warning: "border-l-warning-500",
  danger: "border-l-danger-500",
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Auto-dismiss after this many ms. 0 disables. Default: 4000. */
  duration?: number;
}

/**
 * Provides a toast queue. RN has no portal, so the overlay renders as an
 * absolutely-positioned `View` within the provider — mount it near your app
 * root so toasts float above the screen.
 */
export function ToastProvider({ children, duration = 4000 }: ToastProviderProps) {
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
      setToasts((list) => [
        ...list,
        { id, title: opts.title, description: opts.description, variant: opts.variant ?? "info" },
      ]);
      const ms = opts.duration ?? duration;
      if (ms > 0) setTimeout(() => dismiss(id), ms);
      return id;
    },
    [duration, dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 gap-2 p-4">
        {toasts.map((t) => (
          <View
            key={t.id}
            accessibilityRole="alert"
            className={cx(
              "rounded-lg border border-neutral-200 border-l-4 bg-white px-4 py-3",
              BORDER[t.variant],
            )}
          >
            {t.title != null && (
              <Text className="text-sm font-semibold text-neutral-900">{t.title}</Text>
            )}
            {t.description != null && (
              <Text className="text-sm text-neutral-600">{t.description}</Text>
            )}
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/** Access the toast queue. Must be used inside a {@link ToastProvider}. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("[@kitforge/ui-native] useToast must be used inside a <ToastProvider>.");
  }
  return ctx;
}
