/**
 * Types for the Next.js App Router adapter.
 */

import type { KitforgeAuthConfig, Session } from "../node/types.js";

export interface NextKitforgeAuthConfig extends KitforgeAuthConfig {
  /**
   * URL path prefix for all auth routes.
   * Default: `"/api/auth"` — matches the standard App Router convention:
   * `app/api/auth/[...kitforge]/route.ts`
   *
   * Change only if you place the route file elsewhere.
   */
  basePath?: string;
}

export interface AuthMiddlewareOptions {
  /**
   * Paths that skip the auth check.
   * Strings are matched exactly; RegExp patterns are tested against the pathname.
   *
   * The auth routes (`basePath/*`) are **always** public regardless of this list.
   *
   * @example
   * ```ts
   * publicPaths: ["/", "/about", /^\/blog/]
   * ```
   */
  publicPaths?: (string | RegExp)[];

  /**
   * Where to redirect unauthenticated users.
   * Default: `"{basePath}/signin/{first provider id}"`
   */
  signInPath?: string;
}

export type { Session };
