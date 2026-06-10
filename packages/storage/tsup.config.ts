import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/providers/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  // S3 provider loads these dynamically; never bundle the AWS SDK.
  external: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
});
