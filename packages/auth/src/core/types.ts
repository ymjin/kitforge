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
   * Static confidential-client secret. Optional: omitted for public SPA
   * clients that rely on PKCE. NEVER hard-coded — injected by the consuming
   * app. For providers that require a dynamically-signed secret (Apple),
   * use `getClientSecret` instead.
   */
  clientSecret?: string;
  /**
   * Dynamic client-secret factory. Called fresh before every token request.
   * Takes precedence over `clientSecret` when both are present.
   *
   * Used by Apple Sign In, whose `client_secret` is a short-lived JWT signed
   * with the app's ES256 private key.
   */
  getClientSecret?: () => Promise<string>;
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
    /**
     * REST endpoint to fetch the user profile. Omit for providers (Apple)
     * that embed profile data in the `id_token` — set `fromIdToken: true`
     * instead.
     */
    url?: string;
    /**
     * When true, `getUserInfo` decodes the `id_token` JWT payload instead of
     * making an HTTP request. The decoded payload is passed to `map`.
     */
    fromIdToken?: boolean;
    /** Maps the provider's raw payload to a NormalizedProfile. */
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

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/** The user identity carried inside a session. */
export interface SessionUser {
  /**
   * Stable user id.
   * - Without a DB adapter: the provider's `sub` (provider-scoped).
   * - With a DB adapter: your database's internal user id.
   */
  id: string;
  /** Which provider authenticated the user, e.g. `"google"`. */
  provider: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

/** The normalized session object available to your app. */
export interface Session {
  user: SessionUser;
  /** ISO-8601 string of when this session expires. */
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// External storage — DB adapter (user/account persistence)
// ---------------------------------------------------------------------------

/** A persisted user record, as returned by an {@link AuthAdapter}. */
export interface AdapterUser {
  /** Your database's internal, stable user id. */
  id: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatarUrl?: string;
}

/** A persisted link between a user and one provider identity. */
export interface AdapterAccount {
  /** Provider id, e.g. `"google"`. */
  provider: string;
  /** The provider's stable user id (`profile.id` / OIDC `sub`). */
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  /** Access-token expiry as a UNIX epoch in milliseconds. */
  expiresAt?: number;
  scope?: string;
}

/**
 * Persists users and their linked provider accounts to your database.
 *
 * Implement this (or use `SupabaseAdapter` / `InMemoryAdapter` from
 * `@kitforge/auth/adapters`) and pass it as `config.adapter`. When present,
 * the session's `user.id` becomes your database id rather than the provider sub.
 */
export interface AuthAdapter {
  /** Look up the user linked to a given provider identity, or null. */
  getUserByAccount(provider: string, providerAccountId: string): Promise<AdapterUser | null>;
  /** Create a new user from a freshly normalized profile. */
  createUser(profile: NormalizedProfile): Promise<AdapterUser>;
  /** Link a provider account (with its tokens) to an existing user. */
  linkAccount(userId: string, account: AdapterAccount): Promise<void>;
  /** Fetch a user by internal id, or null. */
  getUser(id: string): Promise<AdapterUser | null>;
  /** Patch mutable fields on a user; returns the updated record. */
  updateUser(id: string, data: Partial<Omit<AdapterUser, "id">>): Promise<AdapterUser>;
}

// ---------------------------------------------------------------------------
// External storage — server-side session store
// ---------------------------------------------------------------------------

/**
 * Stores sessions server-side so the cookie holds only an opaque id.
 *
 * Enables instant logout and session invalidation (delete the row), at the
 * cost of a storage lookup per request. Implement this (or use
 * `SupabaseSessionStore` / `InMemorySessionStore` from
 * `@kitforge/auth/adapters`) and pass it as `config.sessionStore`.
 *
 * When omitted, kitforge uses stateless signed-JWT cookies (the default).
 */
export interface SessionStore {
  /** Fetch a session by id. MUST return null for expired/unknown ids. */
  get(sessionId: string): Promise<Session | null>;
  /** Persist a session under `sessionId` with a TTL in seconds. */
  set(sessionId: string, session: Session, maxAgeSeconds: number): Promise<void>;
  /** Remove a session (used on sign-out). */
  delete(sessionId: string): Promise<void>;
}
