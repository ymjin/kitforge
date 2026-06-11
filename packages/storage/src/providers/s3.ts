/**
 * AWS S3 provider — and any S3-compatible service (Naver Cloud Object Storage,
 * Cloudflare R2, MinIO, …) via a custom endpoint.
 *
 * Pass a configured `S3Client` from `@aws-sdk/client-s3` plus the bucket name.
 * The SDK is loaded dynamically and declared as an optional peer dependency, so
 * it is never bundled for consumers who use a different provider.
 *
 * Requires (install in your app):
 *   - `@aws-sdk/client-s3`
 *   - `@aws-sdk/s3-request-presigner` (only if you call `getSignedUrl`)
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { S3Storage } from "@ymjin/storage/providers";
 *
 * const client = new S3Client({ region: "ap-northeast-2" });
 * const storage = S3Storage({ client, bucket: "my-bucket" });
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

/** Minimal structural type for an `@aws-sdk/client-s3` S3Client. */
export interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}

export interface S3StorageOptions {
  /** A configured `S3Client` instance. */
  client: S3ClientLike;
  /** Target bucket name. */
  bucket: string;
  /**
   * Base URL for {@link StorageProvider.getPublicUrl}. When omitted it's
   * derived from `endpoint`/`region` below.
   */
  publicBaseUrl?: string;
  /** Region, used for the default public URL. Default: `"us-east-1"`. */
  region?: string;
  /** Custom endpoint for S3-compatible services (used for the public URL). */
  endpoint?: string;
}

// Cache the dynamically-imported SDK modules across calls.
let s3ModulePromise: Promise<Record<string, unknown>> | undefined;
let presignerPromise: Promise<Record<string, unknown>> | undefined;

async function loadS3(): Promise<Record<string, unknown>> {
  if (!s3ModulePromise) {
    // `as string` keeps TypeScript from trying to resolve the optional dep at
    // build time; it's the consumer's installed package at runtime.
    s3ModulePromise = import("@aws-sdk/client-s3" as string).catch(() => {
      throw new StorageError(
        "S3Storage requires '@aws-sdk/client-s3'. Install it in your app.",
        "UNSUPPORTED",
      );
    });
  }
  return s3ModulePromise;
}

async function loadPresigner(): Promise<Record<string, unknown>> {
  if (!presignerPromise) {
    presignerPromise = import("@aws-sdk/s3-request-presigner" as string).catch(() => {
      throw new StorageError(
        "Signed URLs require '@aws-sdk/s3-request-presigner'. Install it in your app.",
        "UNSUPPORTED",
      );
    });
  }
  return presignerPromise;
}

export function S3Storage(options: S3StorageOptions): StorageProvider {
  const { client, bucket } = options;
  const region = options.region ?? "us-east-1";
  const publicBase =
    options.publicBaseUrl?.replace(/\/$/, "") ??
    (options.endpoint
      ? `${options.endpoint.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.${region}.amazonaws.com`);

  return {
    async put(key, body, opts: PutOptions = {}): Promise<StorageObject> {
      const bytes = await toBytes(body);
      const contentType = resolveContentType(key, opts.contentType);
      const sdk = await loadS3();
      const PutObjectCommand = sdk["PutObjectCommand"] as new (i: unknown) => unknown;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: contentType,
          CacheControl: opts.cacheControl,
          Metadata: opts.metadata,
        }),
      );
      return { key, size: bytes.byteLength, contentType };
    },

    async get(key): Promise<Uint8Array> {
      const sdk = await loadS3();
      const GetObjectCommand = sdk["GetObjectCommand"] as new (i: unknown) => unknown;
      try {
        const res = (await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        )) as { Body?: { transformToByteArray(): Promise<Uint8Array> } };
        if (!res.Body) throw new StorageError(`Empty body for ${key}`, "PROVIDER_ERROR");
        return await res.Body.transformToByteArray();
      } catch (err) {
        if (isS3NotFound(err)) throw new StorageError(`Object not found: ${key}`, "NOT_FOUND", err);
        throw err instanceof StorageError ? err : new StorageError(`S3 get failed: ${key}`, "PROVIDER_ERROR", err);
      }
    },

    async delete(key): Promise<void> {
      const sdk = await loadS3();
      const DeleteObjectCommand = sdk["DeleteObjectCommand"] as new (i: unknown) => unknown;
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    async exists(key): Promise<boolean> {
      const sdk = await loadS3();
      const HeadObjectCommand = sdk["HeadObjectCommand"] as new (i: unknown) => unknown;
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
      } catch (err) {
        if (isS3NotFound(err)) return false;
        throw new StorageError(`S3 head failed: ${key}`, "PROVIDER_ERROR", err);
      }
    },

    async list(prefix = "", opts: ListOptions = {}): Promise<StorageObject[]> {
      const sdk = await loadS3();
      const ListObjectsV2Command = sdk["ListObjectsV2Command"] as new (i: unknown) => unknown;
      const res = (await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: opts.limit }),
      )) as { Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date; ETag?: string }> };
      return (res.Contents ?? [])
        .filter((o): o is { Key: string } & typeof o => typeof o.Key === "string")
        .map((o) => ({
          key: o.Key,
          size: o.Size,
          lastModified: o.LastModified,
          etag: o.ETag,
        }));
    },

    async getSignedUrl(key, opts: SignedUrlOptions = {}): Promise<string> {
      const { expiresIn = 3600, method = "GET", contentType } = opts;
      const sdk = await loadS3();
      const presigner = await loadPresigner();
      const getSignedUrl = presigner["getSignedUrl"] as (
        c: unknown,
        cmd: unknown,
        o: { expiresIn: number },
      ) => Promise<string>;

      const Command =
        method === "PUT"
          ? (sdk["PutObjectCommand"] as new (i: unknown) => unknown)
          : (sdk["GetObjectCommand"] as new (i: unknown) => unknown);

      const command = new Command({
        Bucket: bucket,
        Key: key,
        ...(method === "PUT" && contentType ? { ContentType: contentType } : {}),
      });
      return getSignedUrl(client, command, { expiresIn });
    },

    getPublicUrl(key): string {
      return `${publicBase}/${key}`;
    },
  };
}

/**
 * Naver Cloud Platform Object Storage — S3-compatible.
 *
 * Construct your `S3Client` with the Naver endpoint, then pass it here. This
 * factory only presets the public-URL base; the client does the real work.
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { NaverCloudObjectStorage } from "@ymjin/storage/providers";
 *
 * const client = new S3Client({
 *   region: "kr-standard",
 *   endpoint: "https://kr.object.ncloudstorage.com",
 *   credentials: { accessKeyId: process.env.NCP_ACCESS_KEY!, secretAccessKey: process.env.NCP_SECRET_KEY! },
 * });
 * const storage = NaverCloudObjectStorage({ client, bucket: "my-bucket" });
 * ```
 */
export function NaverCloudObjectStorage(
  options: Omit<S3StorageOptions, "endpoint" | "region"> & { region?: string },
): StorageProvider {
  return S3Storage({
    ...options,
    region: options.region ?? "kr-standard",
    endpoint: "https://kr.object.ncloudstorage.com",
  });
}

function isS3NotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === "NotFound" || e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404;
}
