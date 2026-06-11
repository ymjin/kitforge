import { Switch as RNSwitch, Text, View } from "react-native";
import { color } from "@kitforge/tokens";
import { cx } from "../utils/cx.js";

export interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A toggle (React Native `Switch`) tinted with `@kitforge/tokens` colors —
 * importing the token JS values directly, since RN's `trackColor` needs a raw
 * color rather than a class.
 */
export function Switch({ value, onValueChange, label, disabled, className }: SwitchProps) {
  return (
    <View className={cx("flex-row items-center gap-2", disabled && "opacity-50", className)}>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: color.neutral[300], true: color.primary[500] }}
        thumbColor={color.white}
      />
      {label != null && <Text className="text-base text-neutral-900">{label}</Text>}
    </View>
  );
}
