import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/providers/index.ts",
    "src/react/index.ts",
    "src/native/index.ts",
    "src/ui-web.ts",
    "src/ui-native.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // All UI runtimes are peer dependencies — never bundle them.
  external: ["react", "react-dom", "react/jsx-runtime", "react-native", "react-native-maps"],
});
