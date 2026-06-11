# 0003 — Web and native ship separate implementations, sharing tokens + API/data

- **Status**: accepted
- **Date**: 2026-06-11

## Context

Three apps (오구오구·다듬·가보함) ship as React Native (Expo). Web components
(React Aria + DOM) don't run on RN, and RN auth/map flows differ fundamentally
from the web. A single "universal" component library would mean discarding the
web work and accepting weaker web accessibility.

## Decision

Keep **separate implementations per platform**, sharing the parts that must stay
consistent:

- **UI**: `@kitforge/ui` (web, React Aria) and `@kitforge/ui-native` (RN,
  NativeWind) are separate packages with the **same prop API** (`variant`/`size`)
  and the **same tokens**. Events follow each platform (`onClick` vs `onPress`).
- **Auth**: `@kitforge/auth/native` runs its own flow (expo-auth-session /
  expo-apple-authentication + secure-store) but **shares provider configs,
  `getUserInfo`, and the profile mappers** with the web build — so a Google/Apple
  user is identical across platforms.
- **Maps**: `@kitforge/maps/{react,native}` behind one `<Map>`/`<Marker>` API;
  `@kitforge/maps/ui` resolves per platform via `exports` conditions. Core types
  shared.

## Consequences

- Two implementations to maintain — but platform-divergent code is inherent.
- No leaky "universal" abstraction; web keeps best-in-class accessibility.
- **Shared *data* (profiles, tokens, types), separate *flow*** — the rule that
  prevents "same entry point, different data" bugs.
- Native-only gaps documented: Naver maps/login are web-only (need server-side
  secret); RN UI needs the NativeWind transform (verify on an EAS build).
