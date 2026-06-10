/**
 * Body normalization + content-type inference shared by all providers.
 */

import { StorageError, type StorageBody } from "./types.js";

/** Normalize any accepted body into a `Uint8Array`. */
export async function toBytes(body: StorageBody): Promise<Uint8Array> {
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }
  throw new StorageError(
    "Unsupported body type — expected Uint8Array, ArrayBuffer, Blob, or string.",
    "INVALID_BODY",
  );
}

/** Minimal extension → MIME map for inferring content types from keys. */
const MIME_BY_EXT: Record<string, string> = {
  txt: "text/plain",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  csv: "text/csv",
  xml: "application/xml",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  zip: "application/zip",
  gz: "application/gzip",
};

/**
 * Resolve the content type for an upload: explicit option wins, otherwise it's
 * inferred from the key's extension, falling back to a generic binary type.
 */
export function resolveContentType(key: string, explicit?: string): string {
  if (explicit) return explicit;
  const dot = key.lastIndexOf(".");
  if (dot !== -1) {
    const ext = key.slice(dot + 1).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (mime) return mime;
  }
  return "application/octet-stream";
}
