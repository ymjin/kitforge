import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, View } from "react-native";
import { cx } from "../utils/cx.js";

export interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  /** `"date"` (default), `"time"`, or `"datetime"`. */
  mode?: "date" | "time" | "datetime";
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  className?: string;
}

/**
 * A date/time picker wrapping `@react-native-community/datetimepicker` — the
 * platform-native wheel (iOS) / dialog (Android), which is the preferred mobile
 * date UX. Requires that package as a peer dependency.
 */
export function DatePicker({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = "날짜 선택",
  minimumDate,
  maximumDate,
  disabled,
  className,
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  return (
    <View className={cx("gap-1.5", className)}>
      {label != null && <Text className="text-sm font-medium text-neutral-800">{label}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => setShow(true)}
        disabled={disabled}
        className={cx(
          "rounded-md border border-neutral-300 bg-white px-3 py-2",
          disabled && "opacity-50",
        )}
      >
        <Text className={cx("text-base", value ? "text-neutral-900" : "text-neutral-400")}>
          {value ? formatDate(value, mode) : placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            // Android dismisses on selection; iOS stays inline.
            setShow(Platform.OS === "ios");
            if (event.type !== "dismissed" && date) onChange?.(date);
          }}
        />
      )}
    </View>
  );
}

function formatDate(d: Date, mode: "date" | "time" | "datetime"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (mode === "time") return time;
  if (mode === "datetime") return `${date} ${time}`;
  return date;
}
