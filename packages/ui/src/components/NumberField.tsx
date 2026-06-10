import {
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  Button,
  FieldError,
  Group,
  Input,
  Label,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface NumberFieldProps extends Omit<AriaNumberFieldProps, "className"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
}

/**
 * A numeric input with stepper buttons (React Aria `NumberField`). Handles
 * locale-aware formatting, clamping, and keyboard increment/decrement.
 */
export function NumberField({
  label,
  description,
  errorMessage,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <Group className="kf-numberfield__group">
        <Button slot="decrement" className="kf-numberfield__btn" aria-label="감소">
          −
        </Button>
        <Input className="kf-numberfield__input" />
        <Button slot="increment" className="kf-numberfield__btn" aria-label="증가">
          +
        </Button>
      </Group>
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
    </AriaNumberField>
  );
}
