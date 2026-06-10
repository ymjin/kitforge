/**
 * Storage providers. Import the one you need and pass your own client/config:
 *
 * ```ts
 * import { SupabaseStorage } from "@kitforge/storage/providers";
 * import { GoogleCloudStorage } from "@kitforge/storage/providers";
 * import { S3Storage, NaverCloudObjectStorage } from "@kitforge/storage/providers";
 * import { MemoryStorage, LocalStorage } from "@kitforge/storage/providers";
 * ```
 *
 * All implement the same `StorageProvider` contract, so call sites are
 * provider-agnostic.
 */

export { MemoryStorage } from "./memory.js";
export type { MemoryStorageOptions } from "./memory.js";

export { LocalStorage } from "./local.js";
export type { LocalStorageOptions } from "./local.js";

export { SupabaseStorage } from "./supabase.js";
export type { SupabaseStorageClientLike } from "./supabase.js";

export { GoogleCloudStorage } from "./gcs.js";
export type { GCSBucketLike, GCSFileLike } from "./gcs.js";

export { S3Storage, NaverCloudObjectStorage } from "./s3.js";
export type { S3ClientLike, S3StorageOptions } from "./s3.js";
