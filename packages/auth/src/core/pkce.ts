/**
 * PKCE (RFC 7636) and state helpers, built on the Web Crypto API.
 *
 * `globalThis.crypto` is available in browsers and in Node 18+, so these run
 * unchanged in an SPA, a Next.js route handler, or a plain script — no Node
 * `crypto` import, keeping the core framework- and runtime-agnostic.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // `btoa` is a global in browsers and in Node 18+ (this package's floor), so no
  // Node Buffer fallback is needed — keeping the core runtime-agnostic.
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** A random, url-safe string suitable for the OAuth `state` parameter. */
export function createState(): string {
  return base64UrlEncode(randomBytes(32));
}

/** A high-entropy PKCE code verifier (43–128 chars per RFC 7636). */
export function createCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

/** Derive the S256 code challenge for a given verifier. */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}
