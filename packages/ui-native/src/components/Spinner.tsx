import { ActivityIndicator } from "react-native";
import { color } from "@kitforge/tokens";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** Size preset. Default: `"md"`. */
  size?: SpinnerSize;
  /** Override the spinner color (defaults to the primary token). */
  color?: string;
  className?: string;
}

/** An indeterminate loading spinner (React Native `ActivityIndicator`). */
export function Spinner({ size = "md", color: tint, className }: SpinnerProps) {
  return (
    <ActivityIndicator
      size={size === "lg" ? "large" : "small"}
      color={tint ?? color.primary[500]}
      className={className}
    />
  );
}
