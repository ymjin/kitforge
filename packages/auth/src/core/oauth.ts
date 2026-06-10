/**
 * The provider-agnostic OAuth 2.0 Authorization Code flow (with optional PKCE).
 *
 * Every provider (Google, Kakao, Naver, Apple) plugs into these four functions
 * by supplying only endpoint URLs and a profile mapper. The flow itself —
 * building the authorize URL, exchanging the code, refreshing, and fetching
 * userinfo — lives here once.
 */

import { createCodeChallenge, createCodeVerifier, createState } from "./pkce.js";
import type { NormalizedProfile, OAuthProvider, OAuthTokens } from "./types.js";

/** Everything the consumer must persist between the redirect and the callback. */
export interface AuthorizationRequest {
  /** The fully-built URL to redirect the user to. */
  url: string;
  /** CSRF token — store it and compare on callback. */
  state: string;
  /** PKCE verifier — store it and pass to {@link exchangeCode}. Absent if PKCE off. */
  codeVerifier?: string;
}

export interface CreateAuthorizationUrlOptions {
  redirectUri: string;
  /** Provide to reuse an existing value; otherwise one is generated. */
  state?: string;
  /** Extra one-off params (e.g. `prompt`, `login_hint`). */
  params?: Record<string, string>;
}

/**
 * Build the provider's authorization URL plus the `state`/`codeVerifier` the
 * caller needs to validate the callback. Side-effect free: it generates values
 * and returns them, leaving storage to the adapter.
 */
export async function createAuthorizationUrl(
  provider: OAuthProvider,
  options: CreateAuthorizationUrlOptions,
): Promise<AuthorizationRequest> {
  const state = options.state ?? createState();
  const url = new URL(provider.authorization.url);
  const search = url.searchParams;

  search.set("client_id", provider.clientId);
  search.set("redirect_uri", options.redirectUri);
  search.set("response_type", "code");
  if (provider.scopes.length > 0) {
    search.set("scope", provider.scopes.join(" "));
  }
  search.set("state", state);

  for (const [key, value] of Object.entries(provider.authorization.params ?? {})) {
    search.set(key, value);
  }
  for (const [key, value] of Object.entries(options.params ?? {})) {
    search.set(key, value);
  }

  let codeVerifier: string | undefined;
  if (provider.usePKCE) {
    codeVerifier = createCodeVerifier();
    search.set("code_challenge", await createCodeChallenge(codeVerifier));
    search.set("code_challenge_method", "S256");
  }

  return { url: url.toString(), state, codeVerifier };
}

export interface ExchangeCodeOptions {
  code: string;
  redirectUri: string;
  /** Required when the provider used PKCE. */
  codeVerifier?: string;
}

/** Trade an authorization `code` for tokens. */
export async function exchangeCode(
  provider: OAuthProvider,
  options: ExchangeCodeOptions,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
    client_id: provider.clientId,
  });
  const secret = await resolveClientSecret(provider);
  if (secret) body.set("client_secret", secret);
  if (options.codeVerifier) body.set("code_verifier", options.codeVerifier);

  return requestTokens(provider, body);
}

export interface RefreshTokensOptions {
  refreshToken: string;
}

/** Use a refresh token to obtain a fresh access token. */
export async function refreshTokens(
  provider: OAuthProvider,
  options: RefreshTokensOptions,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: options.refreshToken,
    client_id: provider.clientId,
  });
  const secret = await resolveClientSecret(provider);
  if (secret) body.set("client_secret", secret);

  return requestTokens(provider, body);
}

/**
 * Fetch and normalize the signed-in user's profile.
 *
 * - Most providers: GET `userinfo.url` with Bearer token.
 * - Apple (and any provider with `userinfo.fromIdToken: true`): decodes the
 *   `id_token` JWT payload instead — no extra HTTP call needed.
 *
 * @param tokens  Pass the full token set when `provider.userinfo.fromIdToken`
 *                is true; otherwise only `accessToken` is used.
 */
export async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string,
  tokens?: OAuthTokens,
): Promise<NormalizedProfile> {
  if (provider.userinfo.fromIdToken) {
    const idToken = tokens?.idToken;
    if (!idToken) {
      throw new OAuthError(
        `[@kitforge/auth] ${provider.id} requires an id_token to build the profile, ` +
          `but none was returned from the token exchange. ` +
          `Ensure the "openid" scope is included.`,
        0,
      );
    }
    const payload = decodeJwtPayload(idToken);
    return provider.userinfo.map(payload, provider);
  }

  if (!provider.userinfo.url) {
    throw new OAuthError(
      `[@kitforge/auth] ${provider.id} has no userinfo.url and fromIdToken is not set.`,
      0,
    );
  }

  const res = await fetch(provider.userinfo.url, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
  });
  if (!res.ok) {
    throw new OAuthError(
      `Failed to fetch userinfo from ${provider.id}`,
      res.status,
      await safeText(res),
    );
  }
  const raw = (await res.json()) as Record<string, unknown>;
  return provider.userinfo.map(raw, provider);
}

/** Error carrying the HTTP status and provider response body for debugging. */
export class OAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "OAuthError";
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Resolves the client secret for a token request.
 * `getClientSecret` (dynamic, e.g. Apple JWT) takes precedence over the static
 * `clientSecret` string.
 */
async function resolveClientSecret(provider: OAuthProvider): Promise<string | undefined> {
  if (provider.getClientSecret) return provider.getClientSecret();
  return provider.clientSecret;
}

async function requestTokens(
  provider: OAuthProvider,
  body: URLSearchParams,
): Promise<OAuthTokens> {
  const res = await fetch(provider.token.url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw new OAuthError(
      `Token request to ${provider.id} failed`,
      res.status,
      await safeText(res),
    );
  }

  const json = (await res.json()) as Record<string, unknown>;
  const expiresIn = typeof json["expires_in"] === "number" ? json["expires_in"] : undefined;

  return {
    accessToken: String(json["access_token"]),
    tokenType: typeof json["token_type"] === "string" ? json["token_type"] : "Bearer",
    refreshToken: typeof json["refresh_token"] === "string" ? json["refresh_token"] : undefined,
    idToken: typeof json["id_token"] === "string" ? json["id_token"] : undefined,
    scope: typeof json["scope"] === "string" ? json["scope"] : undefined,
    expiresAt: expiresIn !== undefined ? Date.now() + expiresIn * 1000 : undefined,
  };
}

/**
 * Decode (not verify) a JWT payload. Verification is not needed here because
 * the token was obtained directly from the provider's token endpoint over TLS.
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error("[@kitforge/auth] Malformed JWT: expected 3 dot-separated parts.");
  }
  // Convert base64url → base64, then decode
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const json = atob(padded);
  return JSON.parse(json) as Record<string, unknown>;
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
