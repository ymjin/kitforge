/**
 * @ymjin/auth/vercel — Vercel Functions adapter.
 *
 * A thin wrapper around `@ymjin/auth/node` that:
 *   - Infers `baseUrl` from Vercel environment variables automatically
 *   - Defaults `basePath` to `"/api/auth"` (Vercel convention)
 *   - Exposes a `handler` ready for Vercel's file-based routing
 *
 * ## Setup
 *
 * ```ts
 * // lib/auth.ts
 * import { createVercelAuth } from "@ymjin/auth/vercel";
 * import { Google, Kakao, Naver, Apple } from "@ymjin/auth/providers";
 *
 * export const auth = createVercelAuth({
 *   providers: [
 *     Google({ clientId: process.env.GOOGLE_CLIENT_ID! }),
 *     Kakao ({ clientId: process.env.KAKAO_CLIENT_ID!  }),
 *     Naver ({ clientId: process.env.NAVER_CLIENT_ID!, clientSecret: process.env.NAVER_CLIENT_SECRET! }),
 *     Apple ({ clientId: process.env.APPLE_CLIENT_ID!, teamId: process.env.APPLE_TEAM_ID!,
 *               keyId: process.env.APPLE_KEY_ID!,     privateKey: process.env.APPLE_PRIVATE_KEY! }),
 *   ],
 *   secret: process.env.AUTH_SECRET!,
 *   // baseUrl is inferred from VERCEL_URL / AUTH_URL automatically
 * });
 * ```
 *
 * ```ts
 * // api/auth/[...path]/route.ts  (Vercel file-based routing)
 * import { auth } from "@/lib/auth";
 * export const GET  = auth.handler;
 * export const POST = auth.handler;
 * ```
 *
 * ## baseUrl resolution order
 * 1. `AUTH_URL` env var
 * 2. `NEXTAUTH_URL` env var (backward compat)
 * 3. `https://${VERCEL_URL}` — set automatically on Vercel preview deployments
 * 4. `http://localhost:3000` — local dev fallback
 */

import { KitforgeAuth } from "../node/handler.js";
import type { KitforgeAuthConfig, Session } from "../node/types.js";

export type { Session };
export type { KitforgeAuthConfig };

export interface VercelAuthConfig extends Omit<KitforgeAuthConfig, "baseUrl"> {
  /**
   * Canonical base URL, no trailing slash.
   * When omitted, resolved from `AUTH_URL` → `NEXTAUTH_URL` → `VERCEL_URL` → localhost.
   */
  baseUrl?: string;
}

export interface VercelAuth {
  /** The underlying `KitforgeAuth` instance — for advanced use. */
  readonly node: KitforgeAuth;
  /**
   * Vercel Function handler. Wire to GET/POST in your route file:
   * ```ts
   * export const GET  = auth.handler;
   * export const POST = auth.handler;
   * ```
   */
  readonly handler: (request: Request) => Promise<Response>;
  /** Read the current session from any `Request`. Returns null when unauthenticated. */
  getSession(request: Request): Promise<Session | null>;
}

function inferBaseUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (key: string): string | undefined => (globalThis as any).process?.env?.[key];

  if (env("AUTH_URL"))     return env("AUTH_URL")!;
  if (env("NEXTAUTH_URL")) return env("NEXTAUTH_URL")!;
  if (env("VERCEL_URL"))   return `https://${env("VERCEL_URL")}`;
  return "http://localhost:3000";
}

export function createVercelAuth(config: VercelAuthConfig): VercelAuth {
  const node = new KitforgeAuth({
    basePath: "/api/auth",
    ...config,
    baseUrl: config.baseUrl ?? inferBaseUrl(),
  });

  const handler = (request: Request): Promise<Response> =>
    node.handle(request).then(
      (res) => res ?? new Response("Not Found", { status: 404 }),
    );

  return {
    node,
    handler,
    getSession: (req) => node.getSession(req),
  };
}
