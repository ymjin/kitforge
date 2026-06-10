import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Heading,
  Label,
  Popover,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface DatePickerProps<T extends DateValue>
  extends Omit<AriaDatePickerProps<T>, "className"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
}

/**
 * A date picker (React Aria `DatePicker` + `Calendar`) — the original reason
 * kitforge/ui exists. Replaces `<input type="date">`, whose UI and calendar
 * differ wildly across browsers, with one consistent, fully-styled control.
 *
 * For Korean month/day names, wrap your app in React Aria's
 * `<I18nProvider locale="ko-KR">` (re-exported from `@kitforge/ui`).
 */
export function DatePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  className,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker
      className={cx("kf-field", className)}
      isInvalid={errorMessage != null || props.isInvalid}
      {...props}
    >
      {label != null && <Label className="kf-field__label">{label}</Label>}
      <Group className="kf-datepicker__group">
        <DateInput className="kf-datepicker__input">
          {(segment) => <DateSegment segment={segment} className="kf-datepicker__segment" />}
        </DateInput>
        <Button className="kf-datepicker__trigger" aria-label="달력 열기">
          📅
        </Button>
      </Group>
      {description != null && (
        <Text slot="description" className="kf-field__description">
          {description}
        </Text>
      )}
      <FieldError className="kf-field__error">{errorMessage}</FieldError>
      <Popover className="kf-popover">
        <Dialog className="kf-datepicker__dialog">
          <Calendar className="kf-calendar">
            <header className="kf-calendar__header">
              <Button slot="previous" className="kf-calendar__nav" aria-label="이전 달">
                ‹
              </Button>
              <Heading className="kf-calendar__heading" />
              <Button slot="next" className="kf-calendar__nav" aria-label="다음 달">
                ›
              </Button>
            </header>
            <CalendarGrid className="kf-calendar__grid">
              {(date) => <CalendarCell date={date} className="kf-calendar__cell" />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
