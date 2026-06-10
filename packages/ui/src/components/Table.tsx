import {
  Table as AriaTable,
  type TableProps as AriaTableProps,
  TableHeader as AriaTableHeader,
  type TableHeaderProps as AriaTableHeaderProps,
  TableBody as AriaTableBody,
  type TableBodyProps as AriaTableBodyProps,
  Column as AriaColumn,
  type ColumnProps as AriaColumnProps,
  Row as AriaRow,
  type RowProps as AriaRowProps,
  Cell as AriaCell,
  type CellProps as AriaCellProps,
} from "react-aria-components";
import { cx } from "../utils/cx.js";

export interface TableProps extends Omit<AriaTableProps, "className"> {
  className?: string;
}

/**
 * A data table (React Aria `Table`) with sorting, row selection, and keyboard
 * navigation. Compose with `TableHeader`, `Column`, `TableBody`, `Row`, `Cell`.
 */
export function Table({ className, ...props }: TableProps) {
  return (
    <div className="kf-table__scroll">
      <AriaTable className={cx("kf-table", className)} {...props} />
    </div>
  );
}

export interface TableHeaderProps<T extends object>
  extends Omit<AriaTableHeaderProps<T>, "className"> {
  className?: string;
}

export function TableHeader<T extends object>({ className, ...props }: TableHeaderProps<T>) {
  return <AriaTableHeader className={cx("kf-table__header", className)} {...props} />;
}

export interface ColumnProps extends Omit<AriaColumnProps, "className"> {
  className?: string;
}

export function Column({ className, ...props }: ColumnProps) {
  return <AriaColumn className={cx("kf-table__column", className)} {...props} />;
}

export interface TableBodyProps<T extends object>
  extends Omit<AriaTableBodyProps<T>, "className"> {
  className?: string;
}

export function TableBody<T extends object>({ className, ...props }: TableBodyProps<T>) {
  return <AriaTableBody className={cx("kf-table__body", className)} {...props} />;
}

export interface RowProps<T extends object> extends Omit<AriaRowProps<T>, "className"> {
  className?: string;
}

export function Row<T extends object>({ className, ...props }: RowProps<T>) {
  return <AriaRow className={cx("kf-table__row", className)} {...props} />;
}

export interface CellProps extends Omit<AriaCellProps, "className"> {
  className?: string;
}

export function Cell({ className, ...props }: CellProps) {
  return <AriaCell className={cx("kf-table__cell", className)} {...props} />;
}
