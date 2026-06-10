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
 * Phase 1 components: Button, TextField, Select, Checkbox, Switch, DatePicker, Modal.
 */

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

export { cx } from "./utils/cx.js";

// Convenience re-exports from React Aria for app-level setup.
export { I18nProvider, DialogTrigger } from "react-aria-components";
