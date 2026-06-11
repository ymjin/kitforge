# kitforge

A personal, reusable toolkit — a monorepo of independently published
`@kitforge/*` packages so any project can pull in just the parts it needs while
sharing **one source of truth** (design tokens). Every package works on the web;
most have a React Native counterpart for Expo apps.

## Packages

| Package | What it is | Web | React Native |
|---------|-----------|:---:|:---:|
| [`@kitforge/tokens`](packages/tokens) | Design tokens (color, spacing, border, typography, shadow) → TS, CSS vars, Tailwind preset | ✅ | ✅ (JS values + preset) |
| [`@kitforge/ui`](packages/ui) | 31 accessible React components (React Aria + tokens) | ✅ | — |
| [`@kitforge/ui-native`](packages/ui-native) | 13 React Native components (NativeWind + tokens) | — | ✅ |
| [`@kitforge/auth`](packages/auth) | Social login (Google·Kakao·Naver·Apple) + node/next/react/native adapters | ✅ | ✅ `/native` |
| [`@kitforge/storage`](packages/storage) | Object storage over GCS·S3·Naver·Supabase·local | ✅ | ✅ |
| [`@kitforge/maps`](packages/maps) | One map API over Google + Naver (web) / Google + Apple (native) | ✅ | ✅ `/native` |

## Install only what you need

```bash
npm i @kitforge/tokens                                   # design tokens
npm i @kitforge/tokens @kitforge/ui                      # web components
npm i @kitforge/tokens @kitforge/ui-native nativewind    # React Native components
npm i @kitforge/auth                                     # social login
npm i @kitforge/storage                                  # object storage
npm i @kitforge/maps                                     # maps
```

Each package's README has full setup + usage. Tokens are the shared foundation:
the same values feed CSS variables (web) and the NativeWind preset (native), so
`bg-primary-500` is identical everywhere.

## Develop

```bash
pnpm install
pnpm build        # builds every package (tsup → ESM + CJS + .d.ts)
```

> pnpm 11 may print `ERR_PNPM_IGNORED_BUILDS` for transitive native tooling
> (sharp / msgpackr) — these are acknowledged in `pnpm-workspace.yaml` and don't
> affect the build.

## Release management

Versioning and changelogs are handled by [Changesets](https://github.com/changesets/changesets):

1. **Per change** — a markdown file in `.changeset/` declares which packages bump
   and how (`major`/`minor`/`patch`) plus a human summary.
2. **`pnpm changeset version`** — consumes those files, bumps `package.json`
   versions, and appends to each package's `CHANGELOG.md` (the release history).
3. **`pnpm changeset publish`** — publishes the changed packages to the public
   npm registry (`@kitforge` scope) and creates git tags.

```bash
pnpm changeset            # author a changeset for your change
pnpm changeset version    # apply pending changesets → versions + CHANGELOGs
pnpm changeset publish    # publish to npm (requires `npm login`)
```

## Tooling

- **pnpm workspaces** — package linking (`workspace:*` rewritten on publish)
- **Turborepo** — task orchestration + caching
- **tsup** — bundling (ESM + CJS + declaration files)
- **Changesets** — semver versioning & publishing to public npm
- **License** — MIT
