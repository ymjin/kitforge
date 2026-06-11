import { Pressable, Text, View } from "react-native";
import { cx } from "../utils/cx.js";

export interface CheckboxProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** A checkbox (React Native `Pressable` + custom box) with a token-styled indicator. */
export function Checkbox({ value, onValueChange, label, disabled, className }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      className={cx("flex-row items-center gap-2", disabled && "opacity-50", className)}
    >
      <View
        className={cx(
          "h-5 w-5 items-center justify-center rounded border-2",
          value ? "border-primary-500 bg-primary-500" : "border-neutral-300 bg-white",
        )}
      >
        {value && <Text className="text-xs text-white">✓</Text>}
      </View>
      {label != null && <Text className="text-base text-neutral-900">{label}</Text>}
    </Pressable>
  );
}
