# 0002 — Design tokens as the single source of truth

- **Status**: accepted
- **Date**: 2026-06-11

## Context

Every project re-created colors, spacing, and borders. The goal was one
definition that stays consistent across plain CSS, Tailwind, React (web), and
React Native.

## Decision

`@ymjin/tokens` defines values once (TS objects) and emits **three outputs**
from that single source:

1. **TS/JS** export (`color.primary[500]`) — used by JS at runtime (e.g. RN
   `trackColor`).
2. **CSS variables** (`@ymjin/tokens/css` → `--kf-color-primary-500`).
3. **Tailwind preset** (`@ymjin/tokens/tailwind`).

`@ymjin/ui` (web) consumes the CSS variables; `@ymjin/ui-native` consumes
the Tailwind preset via NativeWind. So `bg-primary-500` is the identical value
on web and native.

## Consequences

- The three outputs can never drift — they're generated from one module.
- Changing a token updates web and native at once.
- Tokens are the shared layer even though UI implementations differ per platform
  (see ADR-0003).
