import { Text, TextInput, View } from "react-native";
import { color } from "@ymjin/tokens";
import { cx } from "../utils/cx.js";

export interface TextFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** Helper text below the input. */
  description?: string;
  /** Error message; when set, renders the invalid state. */
  errorMessage?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
  className?: string;
}

/** A labelled text input (React Native `TextInput`) with description + error slots. */
export function TextField({
  label,
  placeholder,
  value,
  onChangeText,
  description,
  errorMessage,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable,
  className,
}: TextFieldProps) {
  const invalid = errorMessage != null;
  return (
    <View className={cx("gap-1.5", className)}>
      {label != null && <Text className="text-sm font-medium text-neutral-800">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.neutral[400]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        className={cx(
          "rounded-md border px-3 py-2 text-base text-neutral-900",
          invalid ? "border-danger-500" : "border-neutral-300",
        )}
      />
      {description != null && !invalid && (
        <Text className="text-xs text-neutral-500">{description}</Text>
      )}
      {invalid && <Text className="text-xs text-danger-600">{errorMessage}</Text>}
    </View>
  );
}
