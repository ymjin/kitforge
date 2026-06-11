# @ymjin/ui

Accessible React components built on [React Aria](https://react-spectrum.adobe.com/react-aria/),
styled with `@ymjin/tokens`. The hard parts — accessibility, keyboard
navigation, focus management — are handled for you; the appearance is 100% your
tokens, so widgets look identical across every browser and OS.

## Components

**Phase 1 — form & dialog**

| Component | Replaces | Notes |
|-----------|----------|-------|
| `Button` | `<button>` | variants (primary/secondary/outline/ghost/danger), sizes |
| `TextField` | `<input>` | label, description, error slots |
| `Select` | `<select>` | fully custom popup — no browser-divergent native UI |
| `Checkbox` | `<input type=checkbox>` | custom indicator |
| `Switch` | — | iOS-style toggle (no native equivalent) |
| `DatePicker` | `<input type=date>` | calendar + i18n (the original motivation) |
| `Modal` | — | focus trap, scroll lock, Esc/click-outside |

**Phase 2 — form**: `Textarea`, `RadioGroup`+`Radio`, `Combobox`+`ComboboxItem`
(searchable select), `Slider`, `NumberField`

**Phase 2 — overlay/feedback**: `Popover`, `Tooltip`, `Drawer` (4-way placement),
`AlertDialog` (replaces `confirm()`), `ToastProvider`+`useToast`

**Phase 2 — integration**:
- `FileUpload` — direct signed-`PUT` upload, pairs with `@ymjin/storage`
- `Avatar` — accepts a `@ymjin/auth` session `user`; initials fallback

**Phase 2 — display**: `Badge`, `Card` (+`CardHeader`/`Body`/`Footer`), `Spinner`, `Skeleton`

**Phase 3 — navigation & data**: `Tabs` (+`TabList`/`Tab`/`TabPanel`),
`Accordion` (+`AccordionItem`), `DropdownMenu` (+`MenuItem`/`MenuSeparator`),
`Table` (+`TableHeader`/`TableBody`/`Column`/`Row`/`Cell`), `Pagination`,
`Progress`, `SearchField`

## Setup

```bash
npm i @ymjin/ui @ymjin/tokens react react-dom react-aria-components
```

Import the stylesheets once at your app root:

```ts
import "@ymjin/tokens/css";    // CSS variables (--kf-*)
import "@ymjin/ui/styles.css";  // component styles that consume them
```

For Korean dates in `DatePicker`, wrap your app:

```tsx
import { I18nProvider } from "@ymjin/ui";

<I18nProvider locale="ko-KR">
  <App />
</I18nProvider>
```

## Usage

```tsx
import { Button, TextField, Select, SelectItem, Checkbox, Switch, DatePicker, Modal } from "@ymjin/ui";

function Form() {
  const [open, setOpen] = useState(false);
  return (
    <form>
      <TextField label="이메일" placeholder="you@company.com" />

      <Select label="국가" placeholder="선택하세요">
        <SelectItem id="kr">대한민국</SelectItem>
        <SelectItem id="us">미국</SelectItem>
      </Select>

      <DatePicker label="생년월일" />

      <Checkbox>약관에 동의합니다</Checkbox>
      <Switch>알림 받기</Switch>

      <Button variant="primary" onPress={() => setOpen(true)}>제출</Button>

      <Modal isOpen={open} onOpenChange={setOpen} title="확인" isDismissable>
        {({ close }) => (
          <>
            <p>제출하시겠어요?</p>
            <Button variant="ghost" onPress={close}>취소</Button>
          </>
        )}
      </Modal>
    </form>
  );
}
```

## Design

Each component wraps a React Aria primitive with a kitforge `className`. The CSS
targets React Aria's data-attributes (`[data-hovered]`, `[data-focus-visible]`,
`[data-selected]`, …) and reads every value from a `@ymjin/tokens` CSS
variable, so restyling the whole system is just editing tokens.

Want a component React Aria doesn't cover well? Add it on Radix — call sites
stay the same because the styling layer is shared.
