import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/providers/index.ts", "src/react/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // React is a peer dependency (only the /react entry uses it).
  external: ["react", "react-dom", "react/jsx-runtime"],
});
