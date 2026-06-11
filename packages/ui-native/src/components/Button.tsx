import { Pressable, Text } from "react-native";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, { container: string; text: string }> = {
  primary: { container: "bg-primary-500 active:bg-primary-700", text: "text-white" },
  secondary: { container: "bg-neutral-100 active:bg-neutral-300", text: "text-neutral-900" },
  outline: { container: "border border-neutral-300 active:bg-neutral-100", text: "text-neutral-900" },
  ghost: { container: "active:bg-neutral-100", text: "text-neutral-900" },
  danger: { container: "bg-danger-500 active:bg-danger-700", text: "text-white" },
};

const SIZE: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "px-2.5 py-1", text: "text-sm" },
  md: { container: "px-4 py-2", text: "text-base" },
  lg: { container: "px-5 py-3", text: "text-lg" },
};

export interface ButtonProps {
  /** Visual style. Default: `"primary"`. */
  variant?: ButtonVariant;
  /** Size. Default: `"md"`. */
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  /** Label text (string) or custom content. */
  children: ReactNode;
  /** Extra NativeWind classes for the container. */
  className?: string;
}

/**
 * A button (React Native `Pressable`), styled with `@ymjin/tokens` via
 * NativeWind. Same `variant`/`size` API as `@ymjin/ui` on web; uses `onPress`.
 */
export function Button({
  variant = "primary",
  size = "md",
  onPress,
  disabled,
  children,
  className,
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className={cx(
        "flex-row items-center justify-center rounded-md",
        v.container,
        s.container,
        disabled && "opacity-50",
        className,
      )}
    >
      <Text className={cx("font-medium", v.text, s.text)}>{children}</Text>
    </Pressable>
  );
}
