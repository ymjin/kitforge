/**
 * @kitforge/ui-native — React Native components styled with @kitforge/tokens
 * via NativeWind.
 *
 * Mirrors `@kitforge/ui`'s `variant`/`size` API so the mental model transfers
 * web ↔ native (events use RN's `onPress`/`onValueChange`). The styling is
 * NativeWind classes resolved through the SAME `@kitforge/tokens` Tailwind
 * preset the web build uses — so `bg-primary-500` is the same value everywhere.
 *
 * ## Setup
 *
 * ```bash
 * npm i @kitforge/ui-native @kitforge/tokens nativewind react-native
 * ```
 * ```js
 * // tailwind.config.js
 * module.exports = {
 *   presets: [require("nativewind/preset"), require("@kitforge/tokens/tailwind")],
 *   content: ["./node_modules/@kitforge/ui-native/dist/**\/*.js", "./app/**\/*.{tsx,jsx}"],
 * };
 * ```
 * Add `nativewind/babel` to your Babel config and import your `global.css`
 * (NativeWind v4). Then:
 *
 * ```tsx
 * import { Button, TextField, Switch } from "@kitforge/ui-native";
 * <Button variant="primary" onPress={save}>저장</Button>
 * ```
 *
 * Phase 1: Button, TextField, Switch, Checkbox, Modal, Badge, Card, Spinner.
 * Phase 2 (community-lib wrappers): Select, DatePicker, RadioGroup, Slider, Toast.
 */

export { Button } from "./components/Button.js";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button.js";

export { TextField } from "./components/TextField.js";
export type { TextFieldProps } from "./components/TextField.js";

export { Switch } from "./components/Switch.js";
export type { SwitchProps } from "./components/Switch.js";

export { Checkbox } from "./components/Checkbox.js";
export type { CheckboxProps } from "./components/Checkbox.js";

export { Modal } from "./components/Modal.js";
export type { ModalProps } from "./components/Modal.js";

export { Badge } from "./components/Badge.js";
export type { BadgeProps, BadgeVariant } from "./components/Badge.js";

export { Card, CardHeader, CardBody, CardFooter } from "./components/Card.js";
export type { CardProps } from "./components/Card.js";

export { Spinner } from "./components/Spinner.js";
export type { SpinnerProps, SpinnerSize } from "./components/Spinner.js";

export { cx } from "./utils/cx.js";
