import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface ComboboxProps<T extends object>
  extends Omit<AriaComboBoxProps<T>, "className" | "children"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
  className?: string;
}

/**
 * A searchable, autocompleting select (React Aria `ComboBox`). Combines a text
 * input with a filtered dropdown — far better than a long native `<select>`.
 */
export function Combobox<T extends object>({
  label,
  description,
  errorMessage,
  placeholder = "검색하세요",
  children,
  items,
  className,
  ...props
}: ComboboxProps<T>) {
  return (
    <AriaComboBox
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <div className="kf-combobox__group">
        <Input className="kf-input kf-combobox__input" placeholder={placeholder} />
        <Button className="kf-combobox__trigger" aria-label="목록 열기">
          <span aria-hidden="true">▾</span>
        </Button>
      </div>
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
      <Popover className="kf-popover">
        <ListBox className="kf-listbox" items={items}>
          {children}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export interface ComboboxItemProps extends Omit<ListBoxItemProps, "className"> {
  className?: string;
}

/** An option inside a {@link Combobox}. */
export function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return <ListBoxItem className={cx("kf-listbox__item", className)} {...props} />;
}
