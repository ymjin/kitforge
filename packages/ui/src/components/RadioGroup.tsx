import {
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  Radio as AriaRadio,
  type RadioProps as AriaRadioProps,
  FieldError,
  Label,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, "className"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A group of radio buttons (React Aria `RadioGroup`). */
export function RadioGroup({
  label,
  description,
  errorMessage,
  children,
  className,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      className={cx("kf-radiogroup", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <div className="kf-radiogroup__items">{children}</div>
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}

export interface RadioProps extends Omit<AriaRadioProps, "className" | "children"> {
  children?: ReactNode;
  className?: string;
}

/** A single radio option inside a {@link RadioGroup}. */
export function Radio({ children, className, ...props }: RadioProps) {
  return (
    <AriaRadio className={cx("kf-radio", className)} {...props}>
      <span aria-hidden="true" className="kf-radio__dot" />
      {children != null && <span className="kf-radio__label">{children}</span>}
    </AriaRadio>
  );
}
