# Architecture Decision Records

Short, dated records of significant kitforge decisions and their rationale, so
the "why" survives. One file per decision (`NNNN-title.md`).

| # | Decision |
|---|----------|
| [0001](0001-monorepo-changesets.md) | Monorepo of independent `@ymjin/*` packages, public npm via Changesets |
| [0002](0002-tokens-single-source.md) | Design tokens as the single source of truth (3 outputs), shared web + native |
| [0003](0003-separate-native-packages.md) | Web and native ship separate implementations sharing tokens + API/data |

## Format

```
# NNNN — Title

- **Status**: accepted | superseded by ADR-XXXX
- **Date**: YYYY-MM-DD

## Context     — what forced the decision
## Decision    — what we chose
## Consequences — trade-offs we accept
```
