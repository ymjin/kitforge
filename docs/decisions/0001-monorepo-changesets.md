# 0001 — Monorepo of independent packages, public npm via Changesets

- **Status**: accepted
- **Date**: 2026-06-11

## Context

kitforge is a personal toolkit reused across several projects (web apps + Expo
apps). Each consumer needs only some of it (just tokens, or auth, or maps).

## Decision

- A **pnpm + Turborepo monorepo** of independently published `@kitforge/*`
  packages, each installable on its own.
- **Public npm** under the `@kitforge` scope (`publishConfig.access: public`).
- **Changesets** for versioning + changelogs: each change adds a `.changeset/*.md`;
  `changeset version` bumps versions + writes per-package `CHANGELOG.md`;
  `changeset publish` releases.
- Build with **tsup** → ESM + CJS + `.d.ts` per package.

## Consequences

- Consumers `npm i @kitforge/<pkg>` and tree-shake what they don't use.
- Release history lives in each package's `CHANGELOG.md`.
- First release coordinated at **0.1.0** across all packages.
- Internal deps use `workspace:*`, rewritten to real versions on publish
  (verified via `pnpm pack`).
