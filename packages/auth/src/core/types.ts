/**
 * Framework-agnostic OAuth 2.0 types shared by every provider and adapter.
 *
 * Nothing here imports React, Next, or any runtime — it is pure data so the
 * same definitions can be reused by the SPA and server adapters alike.
 */

/** A normalized user profile, mapped from each provider's raw response. */
export interface NormalizedProfile {
  /** Provider id this profile came from, e.g. "google". */
  provider: string;
  /** Stable, provider-scoped unique id for the user (the OIDC `sub`). */
  id: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatarUrl?: string;
  /** The untouched provider payload, for fields we don't normalize. */
  raw: unknown;
}

/** Tokens returned from a successful authorization-code or refresh exchange. */
export interface OAuthTokens {
  accessToken: string;
  tokenType: string;
  /** Present when the provider issues one (and `offline`/`prompt=consent`). */
  refreshToken?: string;
  /** OIDC id_token (JWT) when `openid` scope was requested. */
  idToken?: string;
  /** Absolute expiry as a UNIX epoch in milliseconds, when known. */
  expiresAt?: number;
  scope?: string;
}

/**
 * A provider definition. Built by a factory like `Google({ clientId })` so the
 * consumer only supplies secrets (from their own `.env`) — never the library.
 */
export interface OAuthProvider {
  /** Lowercase, url-safe id used in callbacks and storage keys. */
  id: string;
  /** Human-readable label, e.g. "Google". */
  name: string;
  clientId: string;
  /**
   * Confidential-client secret. Optional: omitted for public SPA clients that
   * rely on PKCE. NEVER hard-coded — injected by the consuming app.
   */
  clientSecret?: string;
  scopes: string[];
  /** Whether to use PKCE (RFC 7636). Required for public clients. */
  usePKCE: boolean;
  authorization: {
    url: string;
    /** Extra static params merged into the authorize request. */
    params?: Record<string, string>;
  };
  token: {
    url: string;
  };
  userinfo: {
    url: string;
    /** Maps the provider's raw userinfo payload to a NormalizedProfile. */
    map: (raw: Record<string, unknown>, provider: OAuthProvider) => NormalizedProfile;
  };
}

/** Options shared by provider factories. */
export interface ProviderOptions {
  clientId: string;
  clientSecret?: string;
  /** Override the default scope list entirely. */
  scopes?: string[];
}
