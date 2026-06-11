import { createContext, useContext, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { cx } from "../utils/cx.js";

interface RadioContextValue {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}
const RadioContext = createContext<RadioContextValue>({});

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/** A group of radio options. Compose with `Radio` children. */
export function RadioGroup({
  value,
  onValueChange,
  label,
  disabled,
  children,
  className,
}: RadioGroupProps) {
  return (
    <View className={cx("gap-1.5", className)}>
      {label != null && <Text className="text-sm font-medium text-neutral-800">{label}</Text>}
      <RadioContext.Provider value={{ value, onChange: onValueChange, disabled }}>
        <View className="gap-2">{children}</View>
      </RadioContext.Provider>
    </View>
  );
}

export interface RadioProps {
  value: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** A single radio option inside a {@link RadioGroup}. */
export function Radio({ value, label, disabled, className }: RadioProps) {
  const ctx = useContext(RadioContext);
  const selected = ctx.value === value;
  const isDisabled = disabled || ctx.disabled;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: isDisabled }}
      onPress={() => ctx.onChange?.(value)}
      disabled={isDisabled}
      className={cx("flex-row items-center gap-2", isDisabled && "opacity-50", className)}
    >
      <View
        className={cx(
          "h-5 w-5 items-center justify-center rounded-full border-2",
          selected ? "border-primary-500" : "border-neutral-300",
        )}
      >
        {selected && <View className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
      </View>
      {label != null && <Text className="text-base text-neutral-900">{label}</Text>}
    </Pressable>
  );
}
