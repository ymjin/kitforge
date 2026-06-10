/**
 * In-memory storage provider — for development, tests, and demos.
 *
 * All objects live in a Map and vanish on process exit. Signed URLs are
 * synthetic (a `memory://` scheme) since there's no real HTTP backend.
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

interface MemoryEntry {
  bytes: Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  lastModified: Date;
}

export interface MemoryStorageOptions {
  /** Base used by {@link getPublicUrl}. Default: `"memory://"`. */
  publicBaseUrl?: string;
}

export class MemoryStorage implements StorageProvider {
  private readonly objects = new Map<string, MemoryEntry>();
  private readonly publicBaseUrl: string;

  constructor(options: MemoryStorageOptions = {}) {
    this.publicBaseUrl = options.publicBaseUrl ?? "memory://";
  }

  async put(key: string, body: StorageBody, options: PutOptions = {}): Promise<StorageObject> {
    const bytes = await toBytes(body);
    const contentType = resolveContentType(key, options.contentType);
    const entry: MemoryEntry = {
      bytes,
      contentType,
      metadata: options.metadata,
      cacheControl: options.cacheControl,
      lastModified: new Date(),
    };
    this.objects.set(key, entry);
    return this.toObject(key, entry);
  }

  async get(key: string): Promise<Uint8Array> {
    const entry = this.objects.get(key);
    if (!entry) throw new StorageError(`Object not found: ${key}`, "NOT_FOUND");
    return entry.bytes;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  async list(prefix = "", options: ListOptions = {}): Promise<StorageObject[]> {
    const out: StorageObject[] = [];
    for (const [key, entry] of this.objects) {
      if (key.startsWith(prefix)) out.push(this.toObject(key, entry));
      if (options.limit !== undefined && out.length >= options.limit) break;
    }
    return out;
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const { expiresIn = 3600, method = "GET" } = options;
    return `${this.publicBaseUrl}${key}?method=${method}&expires=${expiresIn}`;
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}${key}`;
  }

  private toObject(key: string, entry: MemoryEntry): StorageObject {
    return {
      key,
      size: entry.bytes.byteLength,
      contentType: entry.contentType,
      lastModified: entry.lastModified,
    };
  }
}
