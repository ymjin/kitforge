/**
 * Minimal ambient declarations so `@kitforge/ui-native` type-checks without
 * installing the React Native toolchain. The consumer's real `react-native`
 * (with NativeWind's `className` support) and `@kitforge/tokens` provide the
 * runtime. These only cover the surface this package touches.
 */

declare module "react-native" {
  import type { ComponentType, ReactNode } from "react";

  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type StyleProp<T> = T | T[] | null | undefined | false;

  interface Styled {
    /** NativeWind className. */
    className?: string;
    style?: StyleProp<ViewStyle | TextStyle>;
    children?: ReactNode;
  }

  export interface ViewProps extends Styled {}
  export const View: ComponentType<ViewProps>;

  export interface TextProps extends Styled {}
  export const Text: ComponentType<TextProps>;

  export interface PressableProps extends Styled {
    onPress?: () => void;
    disabled?: boolean;
    accessibilityRole?: string;
    accessibilityState?: Record<string, boolean | undefined>;
    accessibilityLabel?: string;
  }
  export const Pressable: ComponentType<PressableProps>;

  export interface TextInputProps extends Styled {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    editable?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    onFocus?: () => void;
    onBlur?: () => void;
  }
  export const TextInput: ComponentType<TextInputProps>;

  export interface SwitchProps extends Styled {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    disabled?: boolean;
    trackColor?: { false?: string; true?: string };
    thumbColor?: string;
  }
  export const Switch: ComponentType<SwitchProps>;

  export interface ModalProps extends Styled {
    visible?: boolean;
    transparent?: boolean;
    animationType?: "none" | "slide" | "fade";
    onRequestClose?: () => void;
    statusBarTranslucent?: boolean;
  }
  export const Modal: ComponentType<ModalProps>;

  export interface ActivityIndicatorProps extends Styled {
    size?: "small" | "large" | number;
    color?: string;
  }
  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;

  export const Platform: { OS: "ios" | "android" | "windows" | "macos" | "web" };
}

declare module "@kitforge/tokens" {
  /** The color scales (primary/neutral/success/warning/danger 50–900, white/black). */
  export const color: { [group: string]: any };
}
