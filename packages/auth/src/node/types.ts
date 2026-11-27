/**
 * Types for the Node.js (generic) adapter.
 *
 * These are Web API-based so the same types work in Next.js Route Handlers,
 * Hono, Fastify (with @fastify/middie), and any other Node 18+ server.
 */

import type {
  AuthAdapter,
  NormalizedProfile,
  OAuthProvider,
  SessionStore,
  WebhookEventName,
} from "../core/types.js";

// Re-export so consumers can import session types from the adapter entry too.
export type { Session, SessionUser } from "../core/types.js";

export interface KitforgeAuthConfig {
  /** One or more provider instances built with factory functions. */
  providers: OAuthProvider[];
  /**
   * Secret used to sign session JWTs. Min 32 characters.
   * Inject from environment: `process.env.AUTH_SECRET`
   */
  secret: string;
  /**
   * Canonical base URL of the app, no trailing slash.
   * e.g. `"https://app.example.com"` or `"http://localhost:3000"`
   */
  baseUrl: string;
  /**
   * URL path prefix for all auth routes.
   * Default: `"/auth"`
   * Routes created:
   *   GET  {basePath}/signin/:provider
   *   GET|POST {basePath}/callback/:provider
   *   POST {basePath}/signout
   *   GET  {basePath}/session
   */
  basePath?: string;
  /**
   * Where to redirect after a successful sign-in.
   * Default: `"/"`
   */
  redirectTo?: string;
  /**
   * Where to redirect after sign-out.
   * Default: `"/"`
   */
  signOutRedirectTo?: string;
  /**
   * Session cookie lifetime in seconds.
   * Default: 2_592_000 (30 days)
   */
  sessionMaxAge?: number;
  /**
   * Called after every successful sign-in, before the session cookie is set.
   * Use this hook for side effects (analytics, welcome email). For persisting
   * the user, prefer `adapter` — it also feeds the session `user.id`.
   */
  onSignIn?: (profile: NormalizedProfile) => Promise<void> | void;
  /**
   * Called during account deletion, before the user's auth data is wiped.
   * Use this to clean up service-specific rows (e.g. a `profiles` table).
   *
   * @example
   * ```ts
   * onDeleteAccount: async (userId) => {
   *   await supabase.from("profiles").delete().eq("id", userId);
   * }
   * ```
   */
  onDeleteAccount?: (userId: string) => Promise<void> | void;
  /**
   * Origins allowed to make cross-origin requests to this auth server
   * (CORS). Include every app domain that will call `/session` or `/signout`
   * via `fetch`. Exact string match — no wildcards.
   *
   * When running on the same origin as the app, leave this unset.
   *
   * @example ["https://skill.aira.kr", "https://app.aira.kr"]
   */
  allowedOrigins?: string[];
  /**
   * Cookie domain for SSO across subdomains.
   * Set to `".aira.kr"` to share the session cookie across all `*.aira.kr` apps.
   * When omitted, the cookie is scoped to the auth server's own domain only.
   *
   * @example ".aira.kr"
   */
  cookieDomain?: string;
  /**
   * URI prefixes allowed as `redirectTo` after sign-in. Prevents open-redirect
   * attacks. When `redirectTo` is passed to `/signin/:provider`, it must start
   * with one of these values (or be a relative path).
   *
   * Tip: list your app origins here, e.g. `["https://skill.aira.kr"]`.
   * Relative paths (`/dashboard`) are always allowed without a whitelist.
   *
   * @example ["https://skill.aira.kr", "https://app.aira.kr"]
   */
  allowedRedirectUris?: string[];
  /**
   * Webhook configuration. When set, auth events are POSTed to each URL
   * with an HMAC-SHA256 signature for verification.
   *
   * Events fired:
   * - `account.created` — first sign-in (new user created)
   * - `account.updated` — returning sign-in (profile may have changed)
   * - `account.deleted` — account deletion
   *
   * @example
   * ```ts
   * webhooks: {
   *   urls:   (process.env.WEBHOOK_URLS ?? "").split(",").filter(Boolean),
   *   secret: process.env.WEBHOOK_SECRET!,
   * }
   * ```
   */
  webhooks?: {
    /** One or more HTTPS URLs to deliver events to. */
    urls: string[];
    /**
     * Shared secret used to sign the request body with HMAC-SHA256.
     * Verify on the receiving end with `X-Kitforge-Signature` header.
     */
    secret: string;
    /**
     * Subset of events to fire. Omit (or pass all three) to enable everything.
     * @default ["account.created", "account.updated", "account.deleted"]
     */
    events?: WebhookEventName[];
  };
  /**
   * Optional database adapter. When set, each sign-in upserts a user + links
   * the provider account, and the session `user.id` becomes your DB id.
   *
   * Use `SupabaseAdapter` / `InMemoryAdapter` from `@ymjin/auth/adapters`,
   * or implement {@link AuthAdapter} yourself.
   */
  adapter?: AuthAdapter;
  /**
   * Optional server-side session store. When set, the session cookie holds an
   * opaque id and the session body lives in your store — enabling instant
   * logout and invalidation. When omitted, stateless signed-JWT cookies are
   * used (the default).
   *
   * Use `SupabaseSessionStore` / `InMemorySessionStore` from
   * `@ymjin/auth/adapters`, or implement {@link SessionStore} yourself.
   */
  sessionStore?: SessionStore;
}
