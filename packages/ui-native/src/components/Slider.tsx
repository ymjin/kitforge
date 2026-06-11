import RNSlider from "@react-native-community/slider";
import { Text, View } from "react-native";
import { color } from "@kitforge/tokens";
import { cx } from "../utils/cx.js";

export interface SliderProps {
  value?: number;
  onValueChange?: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  /** Show the current value next to the label. Default: true. */
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * A range slider wrapping `@react-native-community/slider`, tinted with
 * `@kitforge/tokens` colors. Requires that package as a peer dependency.
 */
export function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step,
  label,
  showValue = true,
  disabled,
  className,
}: SliderProps) {
  return (
    <View className={cx("gap-2", className)}>
      {(label != null || showValue) && (
        <View className="flex-row items-center justify-between">
          {label != null ? (
            <Text className="text-sm font-medium text-neutral-800">{label}</Text>
          ) : (
            <View />
          )}
          {showValue && value != null && (
            <Text className="text-sm text-neutral-600">{value}</Text>
          )}
        </View>
      )}
      <RNSlider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={color.primary[500]}
        maximumTrackTintColor={color.neutral[200]}
        thumbTintColor={color.primary[500]}
      />
    </View>
  );
}
