import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
  TextArea,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface TextareaProps extends Omit<AriaTextFieldProps, "className"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** Visible rows. Default: 4. */
  rows?: number;
  className?: string;
}

/** A labelled multi-line text input (React Aria `TextField` + `TextArea`). */
export function Textarea({
  label,
  description,
  errorMessage,
  placeholder,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  return (
    <AriaTextField
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <TextArea className="kf-input kf-textarea" placeholder={placeholder} rows={rows} />
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
