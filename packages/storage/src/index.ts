/**
 * @kitforge/storage — one object-storage interface, many backends.
 *
 * The core entry exposes the `StorageProvider` contract and shared types so you
 * can write provider-agnostic code (and your own backends). Concrete providers
 * live in `@kitforge/storage/providers`:
 *
 * - `GoogleCloudStorage` — Google Cloud Storage
 * - `S3Storage` — AWS S3 (and S3-compatible: R2, MinIO …)
 * - `NaverCloudObjectStorage` — Naver Cloud Object Storage (S3-compatible)
 * - `SupabaseStorage` — Supabase Storage
 * - `MemoryStorage` / `LocalStorage` — dev, tests, self-hosting
 *
 * ## Usage
 *
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { S3Storage } from "@kitforge/storage/providers";
 * import type { StorageProvider } from "@kitforge/storage";
 *
 * const storage: StorageProvider = S3Storage({
 *   client: new S3Client({ region: "ap-northeast-2" }),
 *   bucket: "uploads",
 * });
 *
 * await storage.put("docs/readme.txt", "hello", { contentType: "text/plain" });
 * const bytes = await storage.get("docs/readme.txt");
 * const url   = await storage.getSignedUrl("docs/readme.txt", { expiresIn: 600 });
 * // Direct client upload:
 * const putUrl = await storage.getSignedUrl("incoming/big.zip", { method: "PUT", expiresIn: 300 });
 * ```
 */

export { StorageError } from "./core/types.js";
export type {
  StorageProvider,
  StorageObject,
  StorageBody,
  PutOptions,
  ListOptions,
  SignedUrlOptions,
  StorageErrorCode,
} from "./core/types.js";

export { toBytes, resolveContentType } from "./core/body.js";
