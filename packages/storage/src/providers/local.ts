/**
 * Local-disk storage provider — for development and self-hosted setups.
 *
 * Objects are written under a base directory using `node:fs/promises`, so this
 * provider is Node-only. Keys map to relative paths (path traversal via `..`
 * is rejected). Signed/public URLs are derived from a configured base URL,
 * which you serve yourself (e.g. a static file route).
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
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

export interface LocalStorageOptions {
  /** Absolute directory under which objects are stored. */
  baseDir: string;
  /**
   * Base URL used by {@link LocalStorage.getPublicUrl} / {@link getSignedUrl}.
   * e.g. `"http://localhost:3000/uploads"`. When omitted, URLs use `file://`.
   */
  publicBaseUrl?: string;
}

export class LocalStorage implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBaseUrl: string | undefined;

  constructor(options: LocalStorageOptions) {
    this.baseDir = resolve(options.baseDir);
    this.publicBaseUrl = options.publicBaseUrl?.replace(/\/$/, "");
  }

  async put(key: string, body: StorageBody, options: PutOptions = {}): Promise<StorageObject> {
    const path = this.pathFor(key);
    const bytes = await toBytes(body);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
    return {
      key,
      size: bytes.byteLength,
      contentType: resolveContentType(key, options.contentType),
      lastModified: new Date(),
    };
  }

  async get(key: string): Promise<Uint8Array> {
    try {
      const buf = await readFile(this.pathFor(key));
      return new Uint8Array(buf);
    } catch (err) {
      if (isNotFound(err)) throw new StorageError(`Object not found: ${key}`, "NOT_FOUND", err);
      throw new StorageError(`Failed to read ${key}`, "PROVIDER_ERROR", err);
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.pathFor(key));
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw new StorageError(`Failed to stat ${key}`, "PROVIDER_ERROR", err);
    }
  }

  async list(prefix = "", options: ListOptions = {}): Promise<StorageObject[]> {
    const out: StorageObject[] = [];
    await this.walk(this.baseDir, out, options.limit);
    // Filter by prefix on the logical key, then re-apply limit.
    const filtered = out.filter((o) => o.key.startsWith(prefix));
    return options.limit !== undefined ? filtered.slice(0, options.limit) : filtered;
  }

  async getSignedUrl(key: string, _options: SignedUrlOptions = {}): Promise<string> {
    // Local disk has no real signing; return the public URL. Protect the
    // serving route yourself if the bucket is meant to be private.
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) return `${this.publicBaseUrl}/${key}`;
    return `file://${this.pathFor(key)}`;
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private pathFor(key: string): string {
    const path = resolve(this.baseDir, key);
    const rel = relative(this.baseDir, path);
    if (rel.startsWith("..") || rel.includes(`..${sep}`)) {
      throw new StorageError(`Illegal key (path traversal): ${key}`, "INVALID_BODY");
    }
    return path;
  }

  private async walk(dir: string, out: StorageObject[], limit?: number): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (isNotFound(err)) return;
      throw new StorageError(`Failed to list ${dir}`, "PROVIDER_ERROR", err);
    }
    for (const entry of entries) {
      if (limit !== undefined && out.length >= limit) return;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walk(full, out, limit);
      } else {
        const info = await stat(full);
        // Normalize to posix-style keys regardless of host OS.
        const key = relative(this.baseDir, full).split(sep).join(posix.sep);
        out.push({
          key,
          size: info.size,
          contentType: resolveContentType(key),
          lastModified: info.mtime,
        });
      }
    }
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "ENOENT"
  );
}
