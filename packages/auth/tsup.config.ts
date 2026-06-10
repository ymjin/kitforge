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
    "src/native/index.ts",
    "src/adapters/index.ts",
  ],
  // context.tsx contains JSX — tsup/esbuild handles .tsx automatically.
  // React, Next, and the Expo packages are peer deps and must NOT be bundled.
  external: ["react", "react-dom", "next", "expo-auth-session", "expo-secure-store"],
  // Ship the Supabase schema alongside the built adapters.
  onSuccess: "cp src/adapters/schema.sql dist/adapters/schema.sql",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
});
