/**
 * Types for the Node.js (generic) adapter.
 *
 * These are Web API-based so the same types work in Next.js Route Handlers,
 * Hono, Fastify (with @fastify/middie), and any other Node 18+ server.
 */

import type { NormalizedProfile, OAuthProvider } from "../core/types.js";

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
   * Use this hook to upsert the user in your database.
   */
  onSignIn?: (profile: NormalizedProfile) => Promise<void> | void;
}

/** The normalized session object available to your app. */
export interface Session {
  user: {
    /** Provider-scoped stable user id. */
    id: string;
    /** Which provider authenticated the user, e.g. `"google"`. */
    provider: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
  /** ISO-8601 string of when this session expires. */
  expiresAt: string;
}
