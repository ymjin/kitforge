/**
 * KitforgeAuth — the main handler class.
 *
 * Routes (all under `config.basePath`, default "/auth"):
 *
 *   GET  /auth/signin/:provider     → build authorize URL → 302 to provider
 *   GET  /auth/callback/:provider   → validate state, exchange code → session
 *   POST /auth/callback/:provider   → same but reads body (Apple form_post)
 *   POST /auth/signout              → clear session cookie → 302
 *   GET  /auth/session              → return current session as JSON
 */

import { createAuthorizationUrl, exchangeCode, getUserInfo } from "../core/oauth.js";
import type {
  NormalizedProfile,
  OAuthProvider,
  OAuthTokens,
  Session,
  SessionUser,
} from "../core/types.js";
import {
  COOKIE_PKCE,
  COOKIE_PROVIDER,
  COOKIE_SESSION,
  COOKIE_STATE,
  clearCookie,
  getCookie,
  setCookie,
} from "./cookies.js";
import {
  DEFAULT_SESSION_MAX_AGE,
  createSessionId,
  createSessionToken,
  expiryFromNow,
  verifySessionToken,
} from "./session.js";
import type { KitforgeAuthConfig } from "./types.js";

/** Short-lived: only needed until the provider redirects back. */
const OAUTH_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export class KitforgeAuth {
  private readonly providers: Map<string, OAuthProvider>;
  private readonly cfg: KitforgeAuthConfig & Required<
    Pick<
      KitforgeAuthConfig,
      "basePath" | "redirectTo" | "signOutRedirectTo" | "sessionMaxAge" | "onSignIn"
    >
  >;

  constructor(config: KitforgeAuthConfig) {
    if (config.secret.length < 32) {
      throw new Error(
        "[@kitforge/auth] `secret` must be at least 32 characters. " +
          "Generate one with: openssl rand -base64 32",
      );
    }
    this.providers = new Map(config.providers.map((p) => [p.id, p]));
    this.cfg = {
      basePath:            "/auth",
      redirectTo:          "/",
      signOutRedirectTo:   "/",
      sessionMaxAge:       DEFAULT_SESSION_MAX_AGE,
      onSignIn:            () => undefined,
      ...config,
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Pass any Web API `Request`, receive a Web API `Response`.
   *
   * Returns `null` when the path doesn't match an auth route — the caller
   * continues with its own routing.
   *
   * @example (Hono)
   * ```ts
   * app.all("/auth/*", async (c) => {
   *   const res = await auth.handle(c.req.raw);
   *   return res ?? c.notFound();
   * });
   * ```
   */
  async handle(request: Request): Promise<Response | null> {
    const url     = new URL(request.url);
    const subpath = this.subpath(url.pathname);
    if (subpath === null) return null;

    const method = request.method.toUpperCase();

    // GET /auth/signin/:provider
    const signinMatch = /^\/signin\/([^/]+)$/.exec(subpath);
    if (method === "GET" && signinMatch?.[1]) {
      return this.handleSignIn(request, signinMatch[1]);
    }

    // GET|POST /auth/callback/:provider
    const callbackMatch = /^\/callback\/([^/]+)$/.exec(subpath);
    if ((method === "GET" || method === "POST") && callbackMatch?.[1]) {
      return this.handleCallback(request, callbackMatch[1]);
    }

    // POST /auth/signout
    if (method === "POST" && subpath === "/signout") {
      return this.handleSignOut(request);
    }

    // GET /auth/session
    if (method === "GET" && subpath === "/session") {
      return this.handleSession(request);
    }

    return null;
  }

  /**
   * Read and verify the session from any `Request`.
   * Returns `null` when no valid session exists.
   *
   * @example (Next.js Server Component)
   * ```ts
   * const session = await auth.getSession(request);
   * if (!session) redirect("/auth/signin/google");
   * ```
   */
  async getSession(request: Request): Promise<Session | null> {
    return this.getSessionByCookieValue(getCookie(request, COOKIE_SESSION));
  }

  /**
   * Resolve a session from a raw cookie value.
   *
   * - With a `sessionStore`: looks the id up in the store (instant-invalidation).
   * - Without one: verifies the signed JWT.
   *
   * Exposed so the Next.js adapter can read from `next/headers` cookies, where
   * a `Request` object isn't available.
   */
  async getSessionByCookieValue(value: string | undefined): Promise<Session | null> {
    if (!value) return null;
    if (this.cfg.sessionStore) return this.cfg.sessionStore.get(value);
    return verifySessionToken(value, this.cfg.secret);
  }

  /**
   * Delete a stored session by its cookie value (no-op for JWT sessions).
   * Exposed for the Next.js adapter's `signOut()`.
   */
  async deleteStoredSession(value: string | undefined): Promise<void> {
    if (value && this.cfg.sessionStore) await this.cfg.sessionStore.delete(value);
  }

  // ── Route handlers ────────────────────────────────────────────────────────

  /** GET /auth/signin/:provider → 302 to provider's authorize URL */
  private async handleSignIn(request: Request, providerId: string): Promise<Response> {
    const provider = this.findProvider(providerId);
    if (!provider) return this.notFound(`Unknown provider: ${providerId}`);

    const redirectUri = this.callbackUri(providerId);
    const { url, state, codeVerifier } = await createAuthorizationUrl(provider, { redirectUri });

    const headers = new Headers({ location: url });
    // Development: omit Secure so http://localhost works
    const secure = this.cfg.baseUrl.startsWith("https://");
    setCookie(headers, COOKIE_STATE,    state,       { maxAge: OAUTH_COOKIE_MAX_AGE, secure });
    setCookie(headers, COOKIE_PROVIDER, providerId,  { maxAge: OAUTH_COOKIE_MAX_AGE, secure });
    if (codeVerifier) {
      setCookie(headers, COOKIE_PKCE, codeVerifier, { maxAge: OAUTH_COOKIE_MAX_AGE, secure });
    }

    return new Response(null, { status: 302, headers });
  }

  /**
   * GET|POST /auth/callback/:provider
   *
   * GET  — standard redirect (Google, Kakao, Naver, GitHub …)
   * POST — Apple form_post (code + state arrive in the request body)
   */
  private async handleCallback(request: Request, providerId: string): Promise<Response> {
    const provider = this.findProvider(providerId);
    if (!provider) return this.notFound(`Unknown provider: ${providerId}`);

    // Extract code + state from query string or POST body
    let code:  string | null = null;
    let state: string | null = null;

    if (request.method.toUpperCase() === "POST") {
      const form = await request.formData().catch(() => null);
      code  = (form?.get("code")  as string | null) ?? null;
      state = (form?.get("state") as string | null) ?? null;
    } else {
      const url = new URL(request.url);
      code  = url.searchParams.get("code");
      state = url.searchParams.get("state");
    }

    if (!code || !state) {
      return this.badRequest("Missing code or state in callback.");
    }

    // CSRF: compare state with the cookie we set in handleSignIn
    const storedState = getCookie(request, COOKIE_STATE);
    if (!storedState || storedState !== state) {
      return this.badRequest("State mismatch — possible CSRF attack.");
    }

    const codeVerifier = getCookie(request, COOKIE_PKCE);
    const redirectUri  = this.callbackUri(providerId);

    try {
      const tokens  = await exchangeCode(provider, { code, redirectUri, codeVerifier });
      const profile = await getUserInfo(provider, tokens.accessToken, tokens);

      // Persist the user via the adapter (if configured) and derive the
      // session user — its id is the DB id when an adapter is present.
      const sessionUser = await this.resolveSessionUser(profile, tokens);

      await this.cfg.onSignIn(profile);

      const secure  = this.cfg.baseUrl.startsWith("https://");
      const headers = new Headers({ location: this.cfg.redirectTo });
      await this.writeSessionCookie(headers, sessionUser, secure);
      clearCookie(headers, COOKIE_STATE);
      clearCookie(headers, COOKIE_PKCE);
      clearCookie(headers, COOKIE_PROVIDER);

      return new Response(null, { status: 302, headers });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(`Authentication failed: ${msg}`, { status: 500 });
    }
  }

  /** POST /auth/signout → clear session (+ delete from store) → 302 */
  private async handleSignOut(request: Request): Promise<Response> {
    await this.deleteStoredSession(getCookie(request, COOKIE_SESSION));
    const headers = new Headers({ location: this.cfg.signOutRedirectTo });
    clearCookie(headers, COOKIE_SESSION);
    return new Response(null, { status: 302, headers });
  }

  /** GET /auth/session → JSON */
  private async handleSession(request: Request): Promise<Response> {
    const session = await this.getSession(request);
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // ── Session helpers ─────────────────────────────────────────────────────────

  /**
   * Turn a freshly authenticated profile into the session user.
   *
   * With an adapter: find-or-create the user, link the provider account, and
   * use the DB id. Without one: use the provider profile directly.
   */
  private async resolveSessionUser(
    profile: NormalizedProfile,
    tokens: OAuthTokens,
  ): Promise<SessionUser> {
    const { adapter } = this.cfg;
    if (!adapter) {
      return {
        id:        profile.id,
        provider:  profile.provider,
        email:     profile.email,
        name:      profile.name,
        avatarUrl: profile.avatarUrl,
      };
    }

    let user = await adapter.getUserByAccount(profile.provider, profile.id);
    if (!user) {
      user = await adapter.createUser(profile);
      await adapter.linkAccount(user.id, {
        provider:          profile.provider,
        providerAccountId: profile.id,
        accessToken:       tokens.accessToken,
        refreshToken:      tokens.refreshToken,
        idToken:           tokens.idToken,
        expiresAt:         tokens.expiresAt,
        scope:             tokens.scope,
      });
    }

    return {
      id:        user.id,
      provider:  profile.provider,
      email:     user.email,
      name:      user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Write the session cookie.
   * - With a store: persist the session, cookie holds an opaque id.
   * - Without one: cookie holds a signed JWT (stateless).
   */
  private async writeSessionCookie(
    headers: Headers,
    user: SessionUser,
    secure: boolean,
  ): Promise<void> {
    const maxAge = this.cfg.sessionMaxAge;
    const { sessionStore } = this.cfg;

    if (sessionStore) {
      const sessionId = createSessionId();
      const session: Session = { user, expiresAt: expiryFromNow(maxAge) };
      await sessionStore.set(sessionId, session, maxAge);
      setCookie(headers, COOKIE_SESSION, sessionId, { maxAge, secure });
    } else {
      const token = await createSessionToken(user, this.cfg.secret, maxAge);
      setCookie(headers, COOKIE_SESSION, token, { maxAge, secure });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private subpath(pathname: string): string | null {
    const { basePath } = this.cfg;
    if (!pathname.startsWith(basePath)) return null;
    return pathname.slice(basePath.length) || "/";
  }

  private callbackUri(providerId: string): string {
    return `${this.cfg.baseUrl}${this.cfg.basePath}/callback/${providerId}`;
  }

  private findProvider(id: string): OAuthProvider | undefined {
    return this.providers.get(id);
  }

  private notFound(msg: string): Response {
    return new Response(msg, { status: 404 });
  }

  private badRequest(msg: string): Response {
    return new Response(msg, { status: 400 });
  }
}
