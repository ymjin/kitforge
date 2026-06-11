import { View } from "react-native";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

/** A surface container with token-based radius, border, and padding. */
export function Card({ children, className }: CardProps) {
  return (
    <View className={cx("overflow-hidden rounded-lg border border-neutral-200 bg-white", className)}>
      {children}
    </View>
  );
}

/** Optional header region for a {@link Card}. */
export function CardHeader({ children, className }: CardProps) {
  return (
    <View className={cx("border-b border-neutral-100 px-5 py-4", className)}>{children}</View>
  );
}

/** Main content region for a {@link Card}. */
export function CardBody({ children, className }: CardProps) {
  return <View className={cx("p-5", className)}>{children}</View>;
}

/** Optional footer region for a {@link Card}. */
export function CardFooter({ children, className }: CardProps) {
  return (
    <View className={cx("border-t border-neutral-100 px-5 py-4", className)}>{children}</View>
  );
}
