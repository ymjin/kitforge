/**
 * Session JWT helpers built on `jose`.
 *
 * Sessions are stored as HS256-signed JWTs in an HttpOnly cookie.
 * We sign rather than encrypt because the payload contains no secrets —
 * only the profile fields the user already knows about themselves.
 */

import { SignJWT, jwtVerify } from "jose";
import type { NormalizedProfile } from "../core/types.js";
import type { Session } from "./types.js";

const ALG = "HS256";
export const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretBytes(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed session JWT from a normalized profile.
 * @param maxAgeSeconds  Cookie + JWT lifetime. Default: 30 days.
 */
export async function createSessionToken(
  profile: NormalizedProfile,
  secret: string,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE,
): Promise<string> {
  return new SignJWT({
    provider:  profile.provider,
    email:     profile.email,
    name:      profile.name,
    avatarUrl: profile.avatarUrl,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(profile.id)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretBytes(secret));
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
