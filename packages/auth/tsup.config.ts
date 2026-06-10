import { defineConfig } from "tsup";

export default defineConfig({
  // Two entry points → two subpath exports (".", "./providers"). Framework
  // adapters ("./next", "./react") will be added here as they land.
  entry: [
    "src/index.ts",
    "src/providers/index.ts",
    "src/node/index.ts",
    "src/next/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
});
