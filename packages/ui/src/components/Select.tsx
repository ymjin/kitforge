import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  SelectValue,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "className" | "children"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
  /** `SelectItem` children (or a render function over `items`). */
  children: ReactNode | ((item: T) => ReactNode);
  /** Items for dynamic collections. */
  items?: Iterable<T>;
  className?: string;
}

/**
 * A fully custom-styled select (React Aria `Select`) — replaces the native
 * `<select>`, which renders differently in every browser/OS.
 */
export function Select<T extends object>({
  label,
  description,
  errorMessage,
  placeholder = "선택하세요",
  children,
  items,
  className,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <Button className="kf-select__trigger">
        <SelectValue className="kf-select__value">
          {({ isPlaceholder, selectedText }) =>
            isPlaceholder ? placeholder : selectedText
          }
        </SelectValue>
        <span aria-hidden="true" className="kf-select__chevron">▾</span>
      </Button>
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
    </AriaSelect>
  );
}

export interface SelectItemProps extends Omit<ListBoxItemProps, "className"> {
  className?: string;
}

/** An option inside a {@link Select}. */
export function SelectItem({ className, ...props }: SelectItemProps) {
  return <ListBoxItem className={cx("kf-listbox__item", className)} {...props} />;
}
