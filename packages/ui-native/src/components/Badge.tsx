import { Text, View } from "react-native";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

const CONTAINER: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100",
  primary: "bg-primary-100",
  success: "bg-success-100",
  warning: "bg-warning-100",
  danger: "bg-danger-100",
};

const TEXT: Record<BadgeVariant, string> = {
  neutral: "text-neutral-700",
  primary: "text-primary-700",
  success: "text-success-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/** A small status pill (React Native), styled with `@ymjin/tokens`. */
export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <View className={cx("self-start rounded-full px-2 py-0.5", CONTAINER[variant], className)}>
      <Text className={cx("text-xs font-medium", TEXT[variant])}>{children}</Text>
    </View>
  );
}
