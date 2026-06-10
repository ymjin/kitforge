import {
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
  Tab as AriaTab,
  type TabProps as AriaTabProps,
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
} from "react-aria-components";
import { cx } from "../utils/cx.js";

export interface TabsProps extends Omit<AriaTabsProps, "className"> {
  className?: string;
}

/** A tabs container (React Aria `Tabs`). Compose with `TabList`, `Tab`, `TabPanel`. */
export function Tabs({ className, ...props }: TabsProps) {
  return <AriaTabs className={cx("kf-tabs", className)} {...props} />;
}

export interface TabListProps<T extends object> extends Omit<AriaTabListProps<T>, "className"> {
  className?: string;
}

/** The row of tab triggers. */
export function TabList<T extends object>({ className, ...props }: TabListProps<T>) {
  return <AriaTabList className={cx("kf-tabs__list", className)} {...props} />;
}

export interface TabProps extends Omit<AriaTabProps, "className"> {
  className?: string;
}

/** A single tab trigger; its `id` matches a `TabPanel`'s `id`. */
export function Tab({ className, ...props }: TabProps) {
  return <AriaTab className={cx("kf-tabs__tab", className)} {...props} />;
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, "className"> {
  className?: string;
}

/** The content panel for the tab with the matching `id`. */
export function TabPanel({ className, ...props }: TabPanelProps) {
  return <AriaTabPanel className={cx("kf-tabs__panel", className)} {...props} />;
}
