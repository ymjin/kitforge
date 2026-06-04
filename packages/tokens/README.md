# @kitforge/tokens

Design tokens — colors, spacing, borders, typography, and shadows — defined
once and emitted in three shapes so every project sees the same values.

```bash
npm i @kitforge/tokens
```

## One source, three outputs

### ① TS / JS

```ts
import { color, spacing, radius } from "@kitforge/tokens";

color.primary[500]; // "#2f66f6"
spacing[4];         // "1rem"
radius.md;          // "0.375rem"
```

### ② CSS custom properties

```css
@import "@kitforge/tokens/css";

.button {
  background: var(--kf-color-primary-500);
  padding: var(--kf-spacing-2) var(--kf-spacing-4);
  border-radius: var(--kf-radius-md);
}
```

### ③ Tailwind preset

```js
// tailwind.config.js
module.exports = {
  presets: [require("@kitforge/tokens/tailwind")],
};
```

```html
<button class="bg-primary-500 p-4 rounded-md">Click</button>
```

## Why three?

Tailwind projects, plain-CSS projects, and JS-driven styles all read the **same
token definitions**. Change a value in `src/` and rebuild — all three outputs
update together, so they can never drift apart.

## Build

```bash
pnpm build   # tsup → dist/index.{js,cjs,d.ts}, then generates tokens.css + tailwind-preset.cjs
```
