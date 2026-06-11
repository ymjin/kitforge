/**
 * Google Cloud Storage provider.
 *
 * Pass a `Bucket` instance from `@google-cloud/storage` (created with your
 * service-account credentials), so kitforge never bundles the GCS SDK.
 *
 * @example
 * ```ts
 * import { Storage } from "@google-cloud/storage";
 * import { GoogleCloudStorage } from "@ymjin/storage/providers";
 *
 * const bucket = new Storage().bucket("my-bucket");
 * const storage = GoogleCloudStorage(bucket);
 * ```
 */

import { toBytes, resolveContentType } from "../core/body.js";
import {
  StorageError,
  type ListOptions,
  type PutOptions,
  type SignedUrlOptions,
  type StorageBody,
  type StorageObject,
  type StorageProvider,
} from "../core/types.js";

/** Minimal structural type for a `@google-cloud/storage` File. */
export interface GCSFileLike {
  name: string;
  save(data: Uint8Array | Buffer | string, options?: Record<string, unknown>): Promise<void>;
  download(): Promise<[Buffer]>;
  delete(options?: Record<string, unknown>): Promise<unknown>;
  exists(): Promise<[boolean]>;
  getSignedUrl(options: Record<string, unknown>): Promise<[string]>;
  getMetadata(): Promise<[{ size?: string | number; contentType?: string; updated?: string; etag?: string }]>;
  publicUrl(): string;
}

/** Minimal structural type for a `@google-cloud/storage` Bucket. */
export interface GCSBucketLike {
  name: string;
  file(name: string): GCSFileLike;
  getFiles(options?: Record<string, unknown>): Promise<[GCSFileLike[]]>;
}

export function GoogleCloudStorage(bucket: GCSBucketLike): StorageProvider {
  return {
    async put(key, body, options: PutOptions = {}): Promise<StorageObject> {
      const bytes = await toBytes(body);
      const contentType = resolveContentType(key, options.contentType);
      await bucket.file(key).save(bytes, {
        contentType,
        metadata: {
          cacheControl: options.cacheControl,
          metadata: options.metadata,
        },
      });
      return { key, size: bytes.byteLength, contentType };
    },

    async get(key): Promise<Uint8Array> {
      try {
        const [buf] = await bucket.file(key).download();
        return new Uint8Array(buf);
      } catch (err) {
        if (isGcsNotFound(err)) throw new StorageError(`Object not found: ${key}`, "NOT_FOUND", err);
        throw new StorageError(`GCS download failed: ${key}`, "PROVIDER_ERROR", err);
      }
    },

    async delete(key): Promise<void> {
      try {
        await bucket.file(key).delete({ ignoreNotFound: true });
      } catch (err) {
        if (!isGcsNotFound(err)) throw new StorageError(`GCS delete failed: ${key}`, "PROVIDER_ERROR", err);
      }
    },

    async exists(key): Promise<boolean> {
      const [exists] = await bucket.file(key).exists();
      return exists;
    },

    async list(prefix = "", options: ListOptions = {}): Promise<StorageObject[]> {
      const [files] = await bucket.getFiles({ prefix, maxResults: options.limit });
      const out: StorageObject[] = [];
      for (const file of files) {
        const [meta] = await file.getMetadata();
        out.push({
          key: file.name,
          size: meta.size !== undefined ? Number(meta.size) : undefined,
          contentType: meta.contentType,
          lastModified: meta.updated ? new Date(meta.updated) : undefined,
          etag: meta.etag,
        });
      }
      return out;
    },

    async getSignedUrl(key, options: SignedUrlOptions = {}): Promise<string> {
      const { expiresIn = 3600, method = "GET", contentType } = options;
      const [url] = await bucket.file(key).getSignedUrl({
        version: "v4",
        action: method === "PUT" ? "write" : "read",
        expires: Date.now() + expiresIn * 1000,
        ...(method === "PUT" && contentType ? { contentType } : {}),
      });
      return url;
    },

    getPublicUrl(key): string {
      return bucket.file(key).publicUrl();
    },
  };
}

function isGcsNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 404;
}
