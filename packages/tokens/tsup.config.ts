import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Tokens are tiny, pure data — no need to minify, and readable output helps
  // when consumers peek at the published files.
  minify: false,
});
