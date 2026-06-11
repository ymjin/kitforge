/**
 * Google OAuth 2.0 / OpenID Connect provider.
 *
 * The consumer supplies `clientId` (public, safe to ship) and — for a
 * confidential server flow — `clientSecret` from their own environment. For a
 * pure SPA, omit the secret and PKCE secures the exchange.
 *
 * @example
 * ```ts
 * import { Google } from "@ymjin/auth/providers";
 * const google = Google({ clientId: process.env.GOOGLE_CLIENT_ID! });
 * ```
 */

import type { NormalizedProfile, OAuthProvider, ProviderOptions } from "../core/types.js";

const DEFAULT_SCOPES = ["openid", "email", "profile"];

export function Google(options: ProviderOptions): OAuthProvider {
  return {
    id: "google",
    name: "Google",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scopes: options.scopes ?? DEFAULT_SCOPES,
    usePKCE: true,
    authorization: {
      url: "https://accounts.google.com/o/oauth2/v2/auth",
      params: {
        // Required to receive a refresh_token, and to receive it on re-consent.
        access_type: "offline",
        prompt: "consent",
      },
    },
    token: {
      url: "https://oauth2.googleapis.com/token",
    },
    userinfo: {
      url: "https://openidconnect.googleapis.com/v1/userinfo",
      map: mapGoogleProfile,
    },
  };
}

function mapGoogleProfile(
  raw: Record<string, unknown>,
  provider: OAuthProvider,
): NormalizedProfile {
  return {
    provider: provider.id,
    id: String(raw["sub"]),
    email: typeof raw["email"] === "string" ? raw["email"] : undefined,
    emailVerified: typeof raw["email_verified"] === "boolean" ? raw["email_verified"] : undefined,
    name: typeof raw["name"] === "string" ? raw["name"] : undefined,
    avatarUrl: typeof raw["picture"] === "string" ? raw["picture"] : undefined,
    raw,
  };
}
