import { Modal as RNModal, Pressable, Text, View } from "react-native";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface ModalProps {
  visible: boolean;
  /** Called on backdrop tap or hardware back. */
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Extra NativeWind classes for the dialog surface. */
  className?: string;
}

/**
 * A centered modal dialog (React Native `Modal`) with a dimmed backdrop.
 * Tapping the backdrop closes it; tapping the surface does not.
 *
 * Both Pressables are `accessible={false}`: a Pressable is an accessibility
 * element by default, and iOS then folds every child into one label
 * ("Title, message, Cancel, Delete") so VoiceOver cannot reach the buttons or
 * options inside. VoiceOver users close it with the escape gesture
 * (`onRequestClose`).
 */
export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessible={false}
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/40 p-4"
      >
        {/* Absorb taps so they don't reach the backdrop. */}
        <Pressable
          accessible={false}
          accessibilityViewIsModal
          onPress={() => undefined}
          className={cx("w-full max-w-md rounded-xl bg-white p-6", className)}
        >
          {title != null && (
            <Text accessibilityRole="header" className="mb-3 text-xl font-semibold text-neutral-900">
              {title}
            </Text>
          )}
          <View>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
