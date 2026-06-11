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
