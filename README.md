# kitforge

Personal reusable kit — a monorepo of independently published packages so any
project can pull in just the parts it needs while sharing one source of truth.

```
kitforge/
└─ packages/
   ├─ tokens/   @kitforge/tokens   ← design tokens (color, border, spacing, …) — framework-agnostic
   ├─ ui/       @kitforge/ui       ← React widgets (Next.js + SPA) built on headless primitives  [later]
   ├─ auth-core/@kitforge/auth-core← pure-TS OAuth logic                                          [later]
   └─ auth/     @kitforge/auth     ← /next and /react adapters over auth-core                      [later]
```

## Install only what you need

```bash
npm i @kitforge/tokens                    # just colors / borders
npm i @kitforge/tokens @kitforge/ui       # tokens + widgets
```

## Develop

```bash
pnpm install
pnpm build        # builds every package via Turborepo
```

## Tooling

- **pnpm workspaces** — package linking
- **Turborepo** — task orchestration + caching
- **Changesets** — semver versioning & publishing to public npm (`@kitforge` scope)

## Roadmap

| Package | Status |
|---------|--------|
| `@kitforge/tokens` | ✅ scaffolded |
| `@kitforge/ui` | ⏳ next |
| `@kitforge/auth` | ⏳ later |
