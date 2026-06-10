import { defineConfig } from "tsup";

export default defineConfig({
  // Two entry points → two subpath exports (".", "./providers"). Framework
  // adapters ("./next", "./react") will be added here as they land.
  entry: [
    "src/index.ts",
    "src/providers/index.ts",
    "src/node/index.ts",
    "src/next/index.ts",
    "src/react/index.ts",
  ],
  // context.tsx contains JSX — tsup/esbuild handles .tsx automatically.
  // React is a peerDependency and must NOT be bundled.
  external: ["react", "react-dom", "next"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
});
