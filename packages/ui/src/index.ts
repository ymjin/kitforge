/**
 * @kitforge/ui — accessible React components, styled with @kitforge/tokens.
 *
 * Built on React Aria (Adobe): the accessibility, keyboard, and focus logic is
 * battle-tested; the appearance is 100% ours via design tokens, so widgets look
 * identical across every browser and OS.
 *
 * ## Setup
 *
 * 1. Install peers: `react`, `react-dom`, `react-aria-components`, `@kitforge/tokens`.
 * 2. Import the stylesheets once at your app root:
 *    ```ts
 *    import "@kitforge/tokens/css";   // the CSS variables
 *    import "@kitforge/ui/styles.css"; // component styles that use them
 *    ```
 * 3. For Korean dates in `DatePicker`, wrap your app:
 *    ```tsx
 *    import { I18nProvider } from "@kitforge/ui";
 *    <I18nProvider locale="ko-KR"><App /></I18nProvider>
 *    ```
 *
 * Phase 1: Button, TextField, Select, Checkbox, Switch, DatePicker, Modal.
 * Phase 2: Textarea, RadioGroup, Combobox, Slider, NumberField (form);
 *          Popover, Tooltip, Drawer, AlertDialog, Toast (overlay);
 *          FileUpload, Avatar (integration); Badge, Card, Spinner, Skeleton (display).
 * Phase 3: Tabs, Accordion, DropdownMenu, Pagination, Table (navigation & data).
 */

// ── Phase 1 ─────────────────────────────────────────────────────────────────
export { Button } from "./components/Button.js";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button.js";

export { TextField } from "./components/TextField.js";
export type { TextFieldProps } from "./components/TextField.js";

export { Select, SelectItem } from "./components/Select.js";
export type { SelectProps, SelectItemProps } from "./components/Select.js";

export { Checkbox } from "./components/Checkbox.js";
export type { CheckboxProps } from "./components/Checkbox.js";

export { Switch } from "./components/Switch.js";
export type { SwitchProps } from "./components/Switch.js";

export { DatePicker } from "./components/DatePicker.js";
export type { DatePickerProps } from "./components/DatePicker.js";

export { Modal } from "./components/Modal.js";
export type { ModalProps } from "./components/Modal.js";

// ── Phase 2: form ─────────────────────────────────────────────────────────────
export { Textarea } from "./components/Textarea.js";
export type { TextareaProps } from "./components/Textarea.js";

export { RadioGroup, Radio } from "./components/RadioGroup.js";
export type { RadioGroupProps, RadioProps } from "./components/RadioGroup.js";

export { Combobox, ComboboxItem } from "./components/Combobox.js";
export type { ComboboxProps, ComboboxItemProps } from "./components/Combobox.js";

export { Slider } from "./components/Slider.js";
export type { SliderProps } from "./components/Slider.js";

export { NumberField } from "./components/NumberField.js";
export type { NumberFieldProps } from "./components/NumberField.js";

// ── Phase 2: overlay / feedback ───────────────────────────────────────────────
export { Popover } from "./components/Popover.js";
export type { PopoverProps } from "./components/Popover.js";

export { Tooltip } from "./components/Tooltip.js";
export type { TooltipProps } from "./components/Tooltip.js";

export { Drawer } from "./components/Drawer.js";
export type { DrawerProps, DrawerPlacement } from "./components/Drawer.js";

export { AlertDialog } from "./components/AlertDialog.js";
export type { AlertDialogProps } from "./components/AlertDialog.js";

export { ToastProvider, useToast } from "./components/Toast.js";
export type { ToastProviderProps, ToastOptions, ToastVariant } from "./components/Toast.js";

// ── Phase 2: integration ──────────────────────────────────────────────────────
export { FileUpload } from "./components/FileUpload.js";
export type { FileUploadProps } from "./components/FileUpload.js";

export { Avatar } from "./components/Avatar.js";
export type { AvatarProps, AvatarUser, AvatarSize } from "./components/Avatar.js";

// ── Phase 2: display ──────────────────────────────────────────────────────────
export { Badge } from "./components/Badge.js";
export type { BadgeProps, BadgeVariant } from "./components/Badge.js";

export { Card, CardHeader, CardBody, CardFooter } from "./components/Card.js";
export type { CardProps } from "./components/Card.js";

export { Spinner } from "./components/Spinner.js";
export type { SpinnerProps, SpinnerSize } from "./components/Spinner.js";

export { Skeleton } from "./components/Skeleton.js";
export type { SkeletonProps } from "./components/Skeleton.js";

// ── Phase 3: navigation & data ────────────────────────────────────────────────
export { Tabs, TabList, Tab, TabPanel } from "./components/Tabs.js";
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from "./components/Tabs.js";

export { Accordion, AccordionItem } from "./components/Accordion.js";
export type { AccordionProps, AccordionItemProps } from "./components/Accordion.js";

export { DropdownMenu, MenuItem, MenuSeparator } from "./components/Menu.js";
export type { DropdownMenuProps, MenuItemProps } from "./components/Menu.js";

export { Table, TableHeader, TableBody, Column, Row, Cell } from "./components/Table.js";
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  ColumnProps,
  RowProps,
  CellProps,
} from "./components/Table.js";

export { Pagination } from "./components/Pagination.js";
export type { PaginationProps } from "./components/Pagination.js";

export { cx } from "./utils/cx.js";

// Convenience re-exports from React Aria for app-level setup.
export { I18nProvider, DialogTrigger } from "react-aria-components";
