import {
  MenuTrigger as AriaMenuTrigger,
  type MenuTriggerProps as AriaMenuTriggerProps,
  Menu as AriaMenu,
  type MenuProps as AriaMenuProps,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  Popover,
  Separator,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface DropdownMenuProps<T extends object>
  extends Omit<AriaMenuProps<T>, "className" | "children">,
    Pick<AriaMenuTriggerProps, "trigger"> {
  /** The element that opens the menu (e.g. a `<Button>`). */
  triggerButton: ReactNode;
  /** `MenuItem` / `MenuSeparator` children (or a render function over `items`). */
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
  className?: string;
}

/**
 * A dropdown menu (React Aria `MenuTrigger` + `Menu`). Full keyboard support,
 * typeahead, and focus management.
 *
 * ```tsx
 * <DropdownMenu triggerButton={<Button>메뉴</Button>}>
 *   <MenuItem onAction={() => edit()}>수정</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem onAction={() => remove()}>삭제</MenuItem>
 * </DropdownMenu>
 * ```
 */
export function DropdownMenu<T extends object>({
  triggerButton,
  children,
  items,
  trigger,
  className,
  ...props
}: DropdownMenuProps<T>) {
  return (
    <AriaMenuTrigger trigger={trigger}>
      {triggerButton}
      <Popover className="kf-popover kf-menu__popover">
        <AriaMenu className={cx("kf-menu", className)} items={items} {...props}>
          {children}
        </AriaMenu>
      </Popover>
    </AriaMenuTrigger>
  );
}

export interface MenuItemProps extends Omit<AriaMenuItemProps, "className"> {
  className?: string;
}

/** An item inside a {@link DropdownMenu}. */
export function MenuItem({ className, ...props }: MenuItemProps) {
  return <AriaMenuItem className={cx("kf-menu__item", className)} {...props} />;
}

/** A divider between menu sections. */
export function MenuSeparator({ className }: { className?: string }) {
  return <Separator className={cx("kf-menu__separator", className)} />;
}
