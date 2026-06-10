/**
 * Session JWT helpers built on `jose`.
 *
 * Sessions are stored as HS256-signed JWTs in an HttpOnly cookie.
 * We sign rather than encrypt because the payload contains no secrets —
 * only the profile fields the user already knows about themselves.
 */

import { SignJWT, jwtVerify } from "jose";
import type { Session, SessionUser } from "../core/types.js";

const ALG = "HS256";
export const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed session JWT from a session user.
 * @param maxAgeSeconds  Cookie + JWT lifetime. Default: 30 days.
 */
export async function createSessionToken(
  user: SessionUser,
  secret: string,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE,
): Promise<string> {
  return new SignJWT({
    provider:  user.provider,
    email:     user.email,
    name:      user.name,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretBytes(secret));
}

/**
 * Generate a high-entropy, url-safe session id for server-side session stores.
 * 256 bits of randomness — unguessable, so no separate signing is needed.
 */
export function createSessionId(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Compute an ISO-8601 expiry string `maxAgeSeconds` from now. */
export function expiryFromNow(maxAgeSeconds: number): string {
  return new Date(Date.now() + maxAgeSeconds * 1000).toISOString();
}

/**
 * Verify and decode a session JWT.
 * Returns `null` if the token is missing, expired, or tampered with.
 */
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretBytes(secret), {
      algorithms: [ALG],
    });

    if (typeof payload.sub !== "string" || typeof payload["provider"] !== "string") {
      return null;
    }

    const expiresAt = payload.exp
      ? new Date(payload.exp * 1000).toISOString()
      : new Date(Date.now() + DEFAULT_SESSION_MAX_AGE * 1000).toISOString();

    return {
      user: {
        id:        payload.sub,
        provider:  payload["provider"] as string,
        email:     typeof payload["email"]     === "string" ? payload["email"]     : undefined,
        name:      typeof payload["name"]      === "string" ? payload["name"]      : undefined,
        avatarUrl: typeof payload["avatarUrl"] === "string" ? payload["avatarUrl"] : undefined,
      },
      expiresAt,
    };
  } catch {
    // Expired, invalid signature, malformed — all treated as "no session"
    return null;
  }
}
