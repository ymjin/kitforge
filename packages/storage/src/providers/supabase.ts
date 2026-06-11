/**
 * Supabase Storage provider.
 *
 * Pass your own `@supabase/supabase-js` client and a bucket name, so kitforge
 * never bundles the Supabase SDK.
 *
 * @example
 * ```ts
 * import { createClient } from "@supabase/supabase-js";
 * import { SupabaseStorage } from "@ymjin/storage/providers";
 *
 * const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
 * const storage = SupabaseStorage(supabase, "avatars");
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

/** Minimal structural type for the supabase-js storage API we use. */
export interface SupabaseStorageClientLike {
  storage: {
    from(bucket: string): {
      upload(path: string, body: unknown, options?: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
      download(path: string): Promise<{ data: Blob | null; error: { message: string } | null }>;
      remove(paths: string[]): Promise<{ error: { message: string } | null }>;
      list(prefix?: string, options?: Record<string, unknown>): Promise<{ data: SupabaseListItem[] | null; error: { message: string } | null }>;
      createSignedUrl(path: string, expiresIn: number, options?: Record<string, unknown>): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      createSignedUploadUrl(path: string): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
}

interface SupabaseListItem {
  name: string;
  metadata?: { size?: number; mimetype?: string; lastModified?: string } | null;
  updated_at?: string;
}

export function SupabaseStorage(
  client: SupabaseStorageClientLike,
  bucket: string,
): StorageProvider {
  const api = () => client.storage.from(bucket);

  return {
    async put(key, body, options: PutOptions = {}): Promise<StorageObject> {
      const bytes = await toBytes(body);
      const contentType = resolveContentType(key, options.contentType);
      const { error } = await api().upload(key, bytes, {
        contentType,
        upsert: true,
        cacheControl: options.cacheControl,
      });
      if (error) throw new StorageError(`Supabase upload failed: ${error.message}`, "PROVIDER_ERROR", error);
      return { key, size: bytes.byteLength, contentType };
    },

    async get(key): Promise<Uint8Array> {
      const { data, error } = await api().download(key);
      if (error || !data) {
        throw new StorageError(`Object not found: ${key}`, "NOT_FOUND", error);
      }
      return new Uint8Array(await data.arrayBuffer());
    },

    async delete(key): Promise<void> {
      const { error } = await api().remove([key]);
      if (error) throw new StorageError(`Supabase remove failed: ${error.message}`, "PROVIDER_ERROR", error);
    },

    async exists(key): Promise<boolean> {
      // Supabase has no head-object; list the parent and look for the name.
      const slash = key.lastIndexOf("/");
      const dir = slash === -1 ? "" : key.slice(0, slash);
      const name = slash === -1 ? key : key.slice(slash + 1);
      const { data, error } = await api().list(dir, { search: name });
      if (error) throw new StorageError(`Supabase list failed: ${error.message}`, "PROVIDER_ERROR", error);
      return (data ?? []).some((item) => item.name === name);
    },

    async list(prefix = "", options: ListOptions = {}): Promise<StorageObject[]> {
      const { data, error } = await api().list(prefix, { limit: options.limit });
      if (error) throw new StorageError(`Supabase list failed: ${error.message}`, "PROVIDER_ERROR", error);
      return (data ?? []).map((item) => ({
        key: prefix ? `${prefix.replace(/\/$/, "")}/${item.name}` : item.name,
        size: item.metadata?.size,
        contentType: item.metadata?.mimetype,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
      }));
    },

    async getSignedUrl(key, options: SignedUrlOptions = {}): Promise<string> {
      const { expiresIn = 3600, method = "GET" } = options;
      if (method === "PUT") {
        const { data, error } = await api().createSignedUploadUrl(key);
        if (error || !data) {
          throw new StorageError(`Supabase signed upload URL failed: ${error?.message}`, "PROVIDER_ERROR", error);
        }
        return data.signedUrl;
      }
      const { data, error } = await api().createSignedUrl(key, expiresIn);
      if (error || !data) {
        throw new StorageError(`Supabase signed URL failed: ${error?.message}`, "PROVIDER_ERROR", error);
      }
      return data.signedUrl;
    },

    getPublicUrl(key): string {
      return api().getPublicUrl(key).data.publicUrl;
    },
  };
}
