import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/token/index.ts",
    "src/drive/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  platform: "node",
});
