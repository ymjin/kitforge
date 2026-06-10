import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // React and React Aria are peer dependencies — never bundle them.
  external: ["react", "react-dom", "react/jsx-runtime", "react-aria-components"],
  // Ship the stylesheet as-is alongside the JS.
  onSuccess: "cp src/styles.css dist/styles.css",
});
