import {
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
  Button,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface SearchFieldProps extends Omit<AriaSearchFieldProps, "className"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  className?: string;
}

/**
 * A search input (React Aria `SearchField`) with a built-in clear button and
 * `Escape`-to-clear. Submits on `Enter` via `onSubmit`.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder = "검색",
  className,
  ...props
}: SearchFieldProps) {
  return (
    <AriaSearchField
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <div className="kf-searchfield__group">
        <span aria-hidden="true" className="kf-searchfield__icon">⌕</span>
        <Input className="kf-input kf-searchfield__input" placeholder={placeholder} />
        <Button className="kf-searchfield__clear" aria-label="지우기">
          ✕
        </Button>
      </div>
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
    </AriaSearchField>
  );
}
