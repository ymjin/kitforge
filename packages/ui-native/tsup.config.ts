import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/slider.ts", "src/date-picker.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // React Native, React, and the tokens are peer deps — never bundle them.
  external: [
    "react",
    "react/jsx-runtime",
    "nativewind/jsx-runtime",
    "react-native",
    "@ymjin/tokens",
    "nativewind",
    "@react-native-community/slider",
    "@react-native-community/datetimepicker",
  ],
});
