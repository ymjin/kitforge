import { defineConfig } from "vitest/config";

// Library test config: unit tests live next to source as `*.test.ts(x)` across
// packages. Default to the node environment; component tests that need a DOM
// opt in per-file with `// @vitest-environment jsdom`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
    coverage: {
      reporter: ["text"],
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.*", "**/*.d.ts", "**/index.ts"],
    },
  },
});
