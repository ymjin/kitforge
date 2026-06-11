/**
 * Framework-agnostic object-storage contract shared by every provider.
 *
 * One interface (`StorageProvider`) abstracts Google Cloud Storage, AWS S3
 * (and S3-compatible services like Naver Cloud Object Storage), Supabase
 * Storage, and local disk. Swap providers without touching call sites.
 */

/** Accepted upload body types — normalized to bytes internally. */
export type StorageBody = Uint8Array | ArrayBuffer | Blob | string;

/** Metadata describing a stored object. */
export interface StorageObject {
  /** The object's key/path within the bucket, e.g. `"avatars/u1.png"`. */
  key: string;
  /** Size in bytes, when known. */
  size?: number;
  /** MIME type, when known. */
  contentType?: string;
  /** Last modification time, when known. */
  lastModified?: Date;
  /** Entity tag / content hash, when the provider supplies one. */
  etag?: string;
}

/** Options for {@link StorageProvider.put}. */
export interface PutOptions {
  /** MIME type to store. Inferred from the key extension when omitted. */
  contentType?: string;
  /** Arbitrary key/value metadata to attach to the object. */
  metadata?: Record<string, string>;
  /** `Cache-Control` header value to store with the object. */
  cacheControl?: string;
}

/** Options for {@link StorageProvider.list}. */
export interface ListOptions {
  /** Max number of objects to return. */
  limit?: number;
}

/** Options for {@link StorageProvider.getSignedUrl}. */
export interface SignedUrlOptions {
  /** Lifetime of the URL in seconds. Default: 3600 (1 hour). */
  expiresIn?: number;
  /**
   * HTTP method the URL authorizes.
   * - `"GET"` (default): time-limited download link.
   * - `"PUT"`: direct client-to-storage upload link.
   */
  method?: "GET" | "PUT";
  /** For `PUT` URLs: the `Content-Type` the client must use. */
  contentType?: string;
}

/**
 * A pluggable object-storage backend.
 *
 * Implementations live in `@kitforge/storage/providers`; the contract is here
 * so you can also write your own against any storage system.
 */
export interface StorageProvider {
  /** Upload (or overwrite) an object. Returns its metadata. */
  put(key: string, body: StorageBody, options?: PutOptions): Promise<StorageObject>;
  /** Download an object's bytes. Throws {@link StorageError} `NOT_FOUND` if absent. */
  get(key: string): Promise<Uint8Array>;
  /** Delete an object. No-op (resolves) if it doesn't exist. */
  delete(key: string): Promise<void>;
  /** Whether an object exists. */
  exists(key: string): Promise<boolean>;
  /** List objects, optionally filtered by key prefix. */
  list(prefix?: string, options?: ListOptions): Promise<StorageObject[]>;
  /**
   * Create a time-limited signed URL for direct download (`GET`) or upload
   * (`PUT`) without proxying bytes through your server.
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  /**
   * The permanent public URL for an object (only meaningful for public
   * buckets). For private buckets use {@link getSignedUrl}.
   */
  getPublicUrl(key: string): string;
}

/** Stable error codes carried by {@link StorageError}. */
export type StorageErrorCode =
  | "NOT_FOUND"
  | "INVALID_BODY"
  | "UNSUPPORTED"
  | "PROVIDER_ERROR";

/** Error thrown by storage providers, carrying a stable `code`. */
export class StorageError extends Error {
  constructor(
    message: string,
    readonly code: StorageErrorCode,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
