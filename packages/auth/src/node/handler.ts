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
  WebhookEvent,
  WebhookEventName,
  WebhookFailure,
  WebhookUser,
} from "../core/types.js";
import {
  COOKIE_PKCE,
  COOKIE_PROVIDER,
  COOKIE_REDIRECT,
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
        "[@ymjin/auth] `secret` must be at least 32 characters. " +
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

    // CORS preflight — must be answered before any auth logic.
    if (method === "OPTIONS") {
      const corsHeaders = this.corsHeaders(request);
      if (!corsHeaders) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, accept",
          "access-control-max-age": "86400",
        },
      });
    }

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

    // POST /auth/account/delete
    if (method === "POST" && subpath === "/account/delete") {
      return this.handleDeleteAccount(request);
    }

    // GET /auth/session
    if (method === "GET" && subpath === "/session") {
      return this.handleSession(request);
    }

    // GET /auth/health — shallow liveness check (no auth required)
    if (method === "GET" && subpath === "/health") {
      return this.handleHealth();
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
    const secure = this.cfg.baseUrl.startsWith("https://");

    // Apple uses form_post — callback arrives as a cross-site POST.
    // SameSite=None;Secure lets the state/pkce cookies travel with that POST.
    // All other providers use a GET redirect (SameSite=Lax is fine), but
    // SameSite=None;Secure is backwards-compatible with those too.
    const oauthSameSite = secure ? "None" : "Lax";

    setCookie(headers, COOKIE_STATE,    state,       { maxAge: OAUTH_COOKIE_MAX_AGE, secure, sameSite: oauthSameSite, path: "/" });
    setCookie(headers, COOKIE_PROVIDER, providerId,  { maxAge: OAUTH_COOKIE_MAX_AGE, secure, sameSite: oauthSameSite, path: "/" });
    if (codeVerifier) {
      setCookie(headers, COOKIE_PKCE, codeVerifier, { maxAge: OAUTH_COOKIE_MAX_AGE, secure, sameSite: oauthSameSite, path: "/" });
    }

    // Store a validated post-login redirectTo so the callback can return the
    // user to the right app (multi-tenant / cross-origin support).
    const requestedRedirect = new URL(request.url).searchParams.get("redirectTo");
    if (requestedRedirect && this.isAllowedRedirect(requestedRedirect)) {
      setCookie(headers, COOKIE_REDIRECT, requestedRedirect, {
        maxAge: OAUTH_COOKIE_MAX_AGE,
        secure,
        // SameSite=None required for cross-origin cookie to survive the OAuth
        // round-trip through the provider's domain.
        sameSite: secure ? "None" : "Lax",
      });
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
      // Typed minimally so the check is independent of which `FormData` lib type
      // resolves in the consumer's toolchain (DOM vs Node globals can differ).
      const form = (await request.formData().catch(() => null)) as {
        get(name: string): unknown;
      } | null;
      code  = typeof form?.get("code")  === "string" ? (form.get("code") as string) : null;
      state = typeof form?.get("state") === "string" ? (form.get("state") as string) : null;
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

      const secure = this.cfg.baseUrl.startsWith("https://");

      // Prefer the per-request redirectTo (multi-tenant) over the config default.
      const storedRedirect = getCookie(request, COOKIE_REDIRECT);
      const destination    = (storedRedirect && this.isAllowedRedirect(storedRedirect))
        ? storedRedirect
        : this.cfg.redirectTo;

      const headers = new Headers({ location: destination });
      await this.writeSessionCookie(headers, sessionUser, secure);
      clearCookie(headers, COOKIE_STATE);
      clearCookie(headers, COOKIE_PKCE);
      clearCookie(headers, COOKIE_PROVIDER);
      clearCookie(headers, COOKIE_REDIRECT);

      return new Response(null, { status: 302, headers });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(`Authentication failed: ${msg}`, { status: 500 });
    }
  }

  /** POST /auth/account/delete → delete all auth data → 200 JSON */
  private async handleDeleteAccount(request: Request): Promise<Response> {
    const cors = this.corsHeaders(request);
    if (cors === null) return new Response("Forbidden", { status: 403 });

    const session = await this.getSession(request);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: { "content-type": "application/json", ...cors },
      });
    }

    const userId = session.user.id;
    const webhookUser: WebhookUser = {
      id:        session.user.id,
      provider:  session.user.provider,
      email:     session.user.email,
      name:      session.user.name,
      avatarUrl: session.user.avatarUrl,
    };

    try {
      // Service-level cleanup first (legacy hook — prefer webhooks)
      if (this.cfg.onDeleteAccount) await this.cfg.onDeleteAccount(userId);

      const { adapter } = this.cfg;
      if (adapter?.deleteAccount) await adapter.deleteAccount(userId);

      // Dispatch webhook and collect failures.
      const failures = await this.dispatchWebhook("account.deleted", userId, webhookUser);

      const headers = new Headers(cors ?? {});
      headers.set("content-type", "application/json");
      clearCookie(headers, COOKIE_SESSION, this.cfg.cookieDomain);

      if (failures.length > 0) {
        // Account is deleted but some service cleanup failed.
        // Persist failures for admin review, then inform the user.
        if (adapter?.logWebhookFailure) {
          for (const f of failures) {
            await adapter.logWebhookFailure(f).catch((e) => {
              console.error("[@ymjin/auth] failed to log webhook failure:", e);
            });
          }
        }
        return new Response(
          JSON.stringify({
            ok: true,
            warning:
              "계정은 삭제되었으나 일부 데이터 정리에 실패했습니다. " +
              "관리자에게 문의해 주세요.",
          }),
          { status: 200, headers },
        );
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { "content-type": "application/json", ...cors },
      });
    }
  }

  /**
   * POST /auth/signout → clear session (+ delete from store) → 302
   *
   * With `federated=1` (a.k.a. `federated=true`), and when the signing provider
   * exposes an `endSession` endpoint, the final redirect goes to the IdP's
   * RP-Initiated Logout endpoint so the *identity-provider* session is
   * terminated too — otherwise the next sign-in completes silently and the user
   * is never actually signed out (shared-PC scenario).
   *
   * Opt-in per request: services that only want a local sign-out simply omit it.
   */
  private async handleSignOut(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // redirectTo from query string or POST body (same keys as signin)
    let redirectTo =
      url.searchParams.get("redirectTo") ??
      url.searchParams.get("callbackUrl") ??
      url.searchParams.get("redirect_uri") ??
      url.searchParams.get("returnTo") ??
      url.searchParams.get("next") ??
      null;
    let federated = isTruthy(url.searchParams.get("federated"));

    if (request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      try {
        const body = new URLSearchParams(await request.text());
        redirectTo ??=
          body.get("redirectTo") ??
          body.get("callbackUrl") ??
          body.get("redirect_uri") ??
          body.get("returnTo") ??
          body.get("next") ??
          null;
        federated ||= isTruthy(body.get("federated"));
      } catch { /* ignore body parse errors */ }
    }

    // Read the session *before* destroying it — federated logout needs the
    // provider id and the stored id_token.
    const cookieValue = getCookie(request, COOKIE_SESSION);
    const session = federated
      ? await this.getSessionByCookieValue(cookieValue).catch(() => null)
      : null;

    await this.deleteStoredSession(cookieValue);

    const destination =
      (redirectTo && this.isAllowedRedirect(redirectTo))
        ? redirectTo
        : this.cfg.signOutRedirectTo;

    const location = (federated && session)
      ? (await this.federatedLogoutUrl(session, destination)) ?? destination
      : destination;

    const cors    = this.corsHeaders(request);
    const headers = new Headers({ location, ...cors });
    clearCookie(headers, COOKIE_SESSION, this.cfg.cookieDomain);
    return new Response(null, { status: 302, headers });
  }

  /**
   * Build the provider's RP-Initiated Logout URL, or null when it isn't
   * possible (provider has no `endSession`, adapter can't supply the account,
   * or no `id_token` was stored). Never throws — sign-out must not fail just
   * because the IdP hand-off can't be constructed.
   */
  private async federatedLogoutUrl(
    session: Session,
    postLogoutRedirect: string,
  ): Promise<string | null> {
    try {
      const provider = this.providers.get(session.user.provider);
      if (!provider?.endSession) return null;

      const account = await this.cfg.adapter?.getAccount?.(
        session.user.id,
        session.user.provider,
      );
      if (!account?.idToken) return null;

      const logout = new URL(provider.endSession.url);
      for (const [k, v] of Object.entries(provider.endSession.params ?? {})) {
        logout.searchParams.set(k, v);
      }
      logout.searchParams.set("client_id", provider.clientId);
      logout.searchParams.set("id_token_hint", account.idToken);
      logout.searchParams.set("post_logout_redirect_uri", postLogoutRedirect);
      return logout.toString();
    } catch (err) {
      console.error("[@ymjin/auth] federated sign-out failed, falling back to local sign-out:", err);
      return null;
    }
  }

  /** GET /auth/session → JSON */
  private async handleSession(request: Request): Promise<Response> {
    const session = await this.getSession(request);
    const cors    = this.corsHeaders(request);
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "content-type": "application/json", ...cors },
    });
  }

  /** GET /auth/health → 200 ok / 503 degraded (no auth required) */
  private async handleHealth(): Promise<Response> {
    const checks: Record<string, "ok" | "error"> = {};
    let healthy = true;

    // DB check (adapter ping)
    if (this.cfg.adapter?.ping) {
      try {
        await this.cfg.adapter.ping();
        checks["db"] = "ok";
      } catch {
        checks["db"] = "error";
        healthy = false;
      }
    }

    const body = JSON.stringify({ status: healthy ? "ok" : "degraded", checks });
    return new Response(body, {
      status: healthy ? 200 : 503,
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
    let isNew = false;

    if (!user) {
      user = await adapter.createUser(profile);
      isNew = true;
    }

    // Upsert on every sign-in so stored tokens (notably `id_token`, needed for
    // federated sign-out) stay fresh rather than frozen at first sign-in.
    await adapter.linkAccount(user.id, {
      provider:          profile.provider,
      providerAccountId: profile.id,
      accessToken:       tokens.accessToken,
      refreshToken:      tokens.refreshToken,
      idToken:           tokens.idToken,
      expiresAt:         tokens.expiresAt,
      scope:             tokens.scope,
    });

    if (adapter.syncProfile) {
      await adapter.syncProfile(user.id, profile);
    }

    const sessionUser: SessionUser = {
      id:        user.id,
      provider:  profile.provider,
      email:     user.email,
      name:      user.name,
      avatarUrl: user.avatarUrl,
    };

    // Fire webhook — failures are logged but never block sign-in.
    const webhookUser: WebhookUser = {
      id:        user.id,
      provider:  profile.provider,
      email:     user.email,
      name:      user.name,
      avatarUrl: user.avatarUrl,
    };
    void this.dispatchWebhook(
      isNew ? "account.created" : "account.updated",
      user.id,
      webhookUser,
    );

    return sessionUser;
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

    const domain = this.cfg.cookieDomain;
    if (sessionStore) {
      const sessionId = createSessionId();
      const session: Session = { user, expiresAt: expiryFromNow(maxAge) };
      await sessionStore.set(sessionId, session, maxAge);
      setCookie(headers, COOKIE_SESSION, sessionId, { maxAge, secure, domain });
    } else {
      const token = await createSessionToken(user, this.cfg.secret, maxAge);
      setCookie(headers, COOKIE_SESSION, token, { maxAge, secure, domain });
    }
  }

  // ── Webhook dispatch ──────────────────────────────────────────────────────

  /**
   * POST a WebhookEvent to every configured URL with an HMAC-SHA256 signature.
   *
   * Returns an array of WebhookFailure objects (one per failed URL).
   * For `account.created` / `account.updated` failures are fire-and-forget
   * (callers use `void`). For `account.deleted` the caller persists failures.
   */
  private async dispatchWebhook(
    event: WebhookEventName,
    userId: string,
    user: WebhookUser,
  ): Promise<WebhookFailure[]> {
    const { webhooks } = this.cfg;
    if (!webhooks?.urls.length) return [];

    const allowedEvents = webhooks.events ?? ["account.created", "account.updated", "account.deleted"];
    if (!allowedEvents.includes(event)) return [];

    const timestamp = new Date().toISOString();
    const payload: WebhookEvent = { event, userId, user, timestamp };
    const body = JSON.stringify(payload);

    const signature = await this.hmacSign(webhooks.secret, body);
    const failures: WebhookFailure[] = [];

    await Promise.all(
      webhooks.urls.map(async (url) => {
        try {
          const res = await fetch(url, {
            method:  "POST",
            headers: {
              "content-type":          "application/json",
              "x-kitforge-signature":  `sha256=${signature}`,
              "x-kitforge-timestamp":  timestamp,
            },
            body,
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          console.error(`[@ymjin/auth] webhook failed — ${event} → ${url}: ${error}`);
          failures.push({ event, userId, user, targetUrl: url, error, failedAt: timestamp });
        }
      }),
    );

    return failures;
  }

  private async hmacSign(secret: string, body: string): Promise<string> {
    const enc     = new TextEncoder();
    const key     = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sig     = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private subpath(pathname: string): string | null {
    const { basePath } = this.cfg;
    // Normalise basePath: strip trailing slash so both "/auth" and "/auth/" work.
    const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    if (!pathname.startsWith(base)) return null;
    const rest = pathname.slice(base.length);
    // Normalise: ensure leading slash, strip trailing slash (keep bare "/" as-is).
    const withSlash = rest.startsWith("/") ? rest : `/${rest}`;
    return withSlash.length > 1 && withSlash.endsWith("/")
      ? withSlash.slice(0, -1)
      : withSlash || "/";
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

  /**
   * Build CORS headers for an allowed origin.
   * Returns null when the origin is not in `allowedOrigins` (caller should 403).
   * Returns an empty object when `allowedOrigins` is not configured (same-origin).
   */
  private corsHeaders(request: Request): Record<string, string> | null {
    const { allowedOrigins } = this.cfg;
    if (!allowedOrigins?.length) return {};

    const origin = request.headers.get("origin");
    if (!origin) return {};
    if (!allowedOrigins.includes(origin)) return null;

    return {
      "access-control-allow-origin":      origin,
      "access-control-allow-credentials": "true",
      "vary":                             "Origin",
    };
  }

  /**
   * Returns true when `uri` is safe to redirect to after sign-in.
   * Relative paths are always allowed; absolute URLs must start with one of
   * `allowedRedirectUris` (or `allowedOrigins` as a fallback).
   */
  private isAllowedRedirect(uri: string): boolean {
    // Relative paths are safe — no external redirect possible.
    if (uri.startsWith("/")) return true;

    const whitelist = this.cfg.allowedRedirectUris ?? this.cfg.allowedOrigins ?? [];
    return whitelist.some((allowed) => uri.startsWith(allowed));
  }
}

/** Query/body flag parsing: `1`, `true`, `yes`, or a bare present key. */
function isTruthy(value: string | null): boolean {
  if (value === null) return false;
  const v = value.trim().toLowerCase();
  return v === "" || v === "1" || v === "true" || v === "yes";
}
