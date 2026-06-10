import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface TextFieldProps extends Omit<AriaTextFieldProps, "className"> {
  /** Field label. */
  label?: ReactNode;
  /** Helper text shown below the input. */
  description?: ReactNode;
  /** Error message; when set, the field renders in its invalid state. */
  errorMessage?: ReactNode;
  /** Native placeholder. */
  placeholder?: string;
  className?: string;
}

/**
 * A labelled text input (React Aria `TextField`) with description and error
 * slots, styled with `@kitforge/tokens`.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <Input className="kf-input" placeholder={placeholder} />
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
