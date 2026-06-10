import {
  Calendar as AriaCalendar,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
  Button,
  CalendarCell,
  CalendarGrid,
  Heading,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface CalendarProps<T extends DateValue> extends Omit<AriaCalendarProps<T>, "className"> {
  /** Message shown when an invalid date is selected. */
  errorMessage?: ReactNode;
  className?: string;
}

/**
 * A standalone month calendar (React Aria `Calendar`) for picking a single
 * date inline — without the popover/input of `DatePicker`.
 *
 * Wrap your app in `<I18nProvider locale="ko-KR">` for Korean month/day names.
 *
 * ```tsx
 * import { parseDate } from "@internationalized/date";
 * <Calendar aria-label="날짜" defaultValue={parseDate("2026-06-10")} />
 * ```
 */
export function Calendar<T extends DateValue>({
  errorMessage,
  className,
  ...props
}: CalendarProps<T>) {
  return (
    <AriaCalendar className={cx("kf-calendar kf-calendar--standalone", className)} {...props}>
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
      {errorMessage != null && (
        <Text slot="errorMessage" className="kf-field__error">
          {errorMessage}
        </Text>
      )}
    </AriaCalendar>
  );
}
