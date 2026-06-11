# CLAUDE.md — kitforge conventions

A monorepo of independently published `@ymjin/*` libraries (web + React
Native). This file is the working guide; see `docs/decisions/` for the "why".

## Layout

```
packages/
  tokens      design tokens → TS, CSS vars, Tailwind preset (single source)
  ui          web components (React Aria + tokens)
  ui-native   RN components (NativeWind + tokens)
  auth        social login + node/next/react/native adapters
  storage     object storage (GCS/S3/Naver/Supabase/local)
  maps        Google+Naver (web) / Google+Apple (native)
```

## Commands

```bash
pnpm install
pnpm typecheck   # all packages (tsc -p per package)
pnpm build       # tsup → ESM + CJS + .d.ts
pnpm test        # vitest unit tests
```

## Conventions

- **Build**: tsup, `external` all peers (react, next, react-native, expo-\*,
  cloud SDKs). Never bundle peers. `sideEffects: false` (except ui's CSS).
- **Tokens are the only shared styling source** (ADR-0002). UI impls differ per
  platform but share the `variant`/`size` prop API (ADR-0003).
- **Secrets are never in the library** — consumers inject keys from their env.
- **Web vs native**: share *data* (types, provider configs, profile mappers),
  separate *flow*. Avoid "same API, different data".
- **Ambient types** for uninstalled peers (RN, expo-\*) live in package
  `src/*.d.ts`; typecheck via `tsc -p tsconfig.json` so they're picked up.
- **Web-API packages** (auth) set `"types": []` and exclude `tsup.config.ts`
  from typecheck so Node globals don't shadow DOM types (e.g. `FormData`).

## Testing

- Unit tests live next to source as `*.test.ts`, run by vitest (node env;
  `// @vitest-environment jsdom` per file for DOM/component tests).
- Pure logic is unit-tested directly. React/SDK integration is verified with
  mocks; NativeWind/RN rendering must be confirmed on a real EAS build.
- **Verify with the real build / `tsc -p tsconfig.json`** — ad-hoc `tsc` with
  hand-passed flags has missed real bugs (e.g. missing `override`, Node-vs-DOM
  `FormData`).

## Release (Changesets)

```bash
pnpm changeset            # author a changeset per change
pnpm changeset version    # bump versions + write CHANGELOG.md
npm login && pnpm changeset publish   # publish (needs npm auth — human step)
```

`workspace:*` internal deps are rewritten to real versions on publish. ui /
ui-native depend on tokens as a peer; keep their first-release version aligned.
