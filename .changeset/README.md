# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

Add a changeset describing your change:

```bash
pnpm changeset
```

Then version and publish:

```bash
pnpm version-packages   # bumps versions + updates changelogs
pnpm release            # builds + publishes to npm
```
