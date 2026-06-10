# @kitforge/ui · Playground

A browser gallery of all `@kitforge/ui` components, for visual checking.

## Run

From `packages/ui/`:

```bash
# 1. Build the library (produces dist/index.js + dist/styles.css)
npm run build            # or: node_modules/.bin/tsup

# 2. Bundle the playground (react + react-aria are bundled in)
node_modules/.bin/esbuild playground/main.tsx \
  --bundle --outfile=playground/out/app.js \
  --format=esm --jsx=automatic --loader:.css=css \
  --define:process.env.NODE_ENV='"production"' --minify

# 3. Serve it
python3 -m http.server 5173 --directory playground
# open http://localhost:5173
```

`main.tsx` imports the built library from `../dist/index.js` and its
`../dist/styles.css`. Component colors come from `@kitforge/tokens` CSS
variables; the stylesheet ships fallback values, so the gallery looks correct
even without `@kitforge/tokens/css` loaded.

`out/` is generated and git-ignored.
