import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cx } from "../utils/cx.js";
import { Modal } from "./Modal.js";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

/**
 * A select built from a token-styled trigger + a `Modal` option list (pure RN,
 * no native picker) — so it looks identical on iOS and Android, matching the
 * web `Select`.
 */
export function Select({
  label,
  placeholder = "선택하세요",
  value,
  onValueChange,
  options,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className={cx("gap-1.5", className)}>
      {label != null && <Text className="text-sm font-medium text-neutral-800">{label}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        disabled={disabled}
        className={cx(
          "flex-row items-center justify-between rounded-md border border-neutral-300 bg-white px-3 py-2",
          disabled && "opacity-50",
        )}
      >
        <Text className={cx("text-base", selected ? "text-neutral-900" : "text-neutral-400")}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-neutral-500">▾</Text>
      </Pressable>

      <Modal visible={open} onClose={() => setOpen(false)} title={label}>
        <View className="gap-1">
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onValueChange?.(o.value);
                  setOpen(false);
                }}
                className={cx("rounded px-2 py-3", isSelected && "bg-primary-50")}
              >
                <Text
                  className={cx(
                    "text-base",
                    isSelected ? "text-primary-700" : "text-neutral-900",
                  )}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}
