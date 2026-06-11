# @kitforge/ui-native

React Native components styled with `@kitforge/tokens` via **NativeWind** — the
native counterpart to `@kitforge/ui` (web). Same `variant`/`size` API; the
styling resolves through the **same token Tailwind preset** the web build uses,
so `bg-primary-500` is the identical value on web and native.

## Phase 1 components

| Component | Built on | Notes |
|-----------|----------|-------|
| `Button` | `Pressable` | variants (primary/secondary/outline/ghost/danger), sizes, `onPress` |
| `TextField` | `TextInput` | label, description, error |
| `Switch` | RN `Switch` | token track/thumb colors |
| `Checkbox` | `Pressable` | custom indicator |
| `Modal` | RN `Modal` | dimmed backdrop, tap-to-close |
| `Badge` / `Card` (+ Header/Body/Footer) / `Spinner` | `View`/`Text`/`ActivityIndicator` | display |

Phase 2 (community-lib wrappers): `Select`, `DatePicker`, `RadioGroup`, `Slider`, `Toast`.

## Setup

```bash
npm i @kitforge/ui-native @kitforge/tokens nativewind react-native
```

```js
// tailwind.config.js — layer the kitforge token preset on top of NativeWind
module.exports = {
  presets: [require("nativewind/preset"), require("@kitforge/tokens/tailwind")],
  content: [
    "./node_modules/@kitforge/ui-native/dist/**/*.js",
    "./app/**/*.{tsx,jsx}",
  ],
};
```

Add `nativewind/babel` to your Babel config and import your `global.css`
(NativeWind v4 setup). Then:

```tsx
import { Button, TextField, Switch, Modal } from "@kitforge/ui-native";

function Form() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TextField label="이메일" placeholder="you@company.com" />
      <Switch label="알림 받기" value={on} onValueChange={setOn} />
      <Button variant="primary" onPress={() => setOpen(true)}>제출</Button>
      <Modal visible={open} onClose={() => setOpen(false)} title="확인">
        <Button variant="ghost" onPress={() => setOpen(false)}>닫기</Button>
      </Modal>
    </>
  );
}
```

## Design notes

- **API parity, native events:** props mirror `@kitforge/ui` (`variant`, `size`),
  but events use RN conventions (`onPress`, `onValueChange`).
- **Tokens as JS values:** where a class can't apply (RN `trackColor`,
  `placeholderTextColor`, `ActivityIndicator` color), the component imports the
  token value from `@kitforge/tokens` — still one source of truth.
- **Shadows/fonts:** Tailwind shadows map partially on RN; custom fonts must be
  loaded by your app. Phase 1 uses system fonts.
- **Web stays on `@kitforge/ui`** (React Aria) — best-in-class web a11y; this
  package is for React Native only.
