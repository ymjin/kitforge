/**
 * Pure helpers shared by the native auth flow — no Expo or React imports, so
 * they're trivially testable. The data they operate on (provider config,
 * profile shape) is the SAME as the web build, which is the whole point of
 * sharing the core: a Google user looks identical on web and native.
 */

import type {
  NormalizedProfile,
  OAuthProvider,
  OAuthTokens,
  SessionUser,
} from "../core/types.js";

/** A signed-in session held on the device. */
export interface NativeSession {
  user: SessionUser;
  /** The provider tokens, for calling APIs / refreshing. */
  tokens: OAuthTokens;
}

/** Narrow a full provider profile down to the session user. */
export function profileToSessionUser(profile: NormalizedProfile): SessionUser {
  return {
    id: profile.id,
    provider: profile.provider,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  };
}

/** The OIDC discovery document expo-auth-session needs, from our provider. */
export function providerDiscovery(provider: OAuthProvider): {
  authorizationEndpoint: string;
  tokenEndpoint: string;
} {
  return {
    authorizationEndpoint: provider.authorization.url,
    tokenEndpoint: provider.token.url,
  };
}

/** Shape of an expo-auth-session `TokenResponse` (the bits we read). */
export interface ExpoTokenResponseLike {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
  /** UNIX epoch *seconds* the token was issued, if provided. */
  issuedAt?: number;
}

/** Convert an expo-auth-session token response into our shared `OAuthTokens`. */
export function toOAuthTokens(response: ExpoTokenResponseLike): OAuthTokens {
  let expiresAt: number | undefined;
  if (response.expiresIn != null) {
    const base = response.issuedAt != null ? response.issuedAt * 1000 : Date.now();
    expiresAt = base + response.expiresIn * 1000;
  }
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType ?? "Bearer",
    refreshToken: response.refreshToken,
    idToken: response.idToken,
    scope: response.scope,
    expiresAt,
  };
}
