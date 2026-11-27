import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/date/index.ts",
    "src/number/index.ts",
    "src/rate-limit/index.ts",
    "src/id/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // Neutral: must run on Node, browsers, edge runtimes, and Hermes.
  platform: "neutral",
});
