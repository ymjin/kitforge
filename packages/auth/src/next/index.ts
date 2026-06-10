/**
 * @kitforge/auth/next — Next.js App Router adapter.
 *
 * Wraps `@kitforge/auth/node` and adds:
 *   - `handlers`   — Route Handler exports for `app/api/auth/[...kitforge]/route.ts`
 *   - `auth()`     — read the current session in Server Components / Server Actions
 *   - `signIn()`   — redirect to a provider's sign-in URL (Server Action / Server Component)
 *   - `signOut()`  — clear session cookie + redirect (Server Action / Server Component)
 *   - `getSession()` — same as node adapter; works in middleware.ts with NextRequest
 *
 * **Server-only.** Never import this module from a Client Component — move
 * session reads to Server Components or fetch `/auth/session` from the client.
 *
 * ## Setup
 *
 * ```ts
 * // lib/auth.ts
 * import { createNextAuth } from "@kitforge/auth/next";
 * import { Google, Kakao, Naver, Apple } from "@kitforge/auth/providers";
 *
 * export const auth = createNextAuth({
 *   providers: [
 *     Google({ clientId: process.env.GOOGLE_CLIENT_ID! }),
 *     Kakao ({ clientId: process.env.KAKAO_CLIENT_ID!  }),
 *     Naver ({ clientId: process.env.NAVER_CLIENT_ID!, clientSecret: process.env.NAVER_CLIENT_SECRET! }),
 *     Apple ({ clientId: process.env.APPLE_CLIENT_ID!, teamId: process.env.APPLE_TEAM_ID!,
 *               keyId: process.env.APPLE_KEY_ID!,     privateKey: process.env.APPLE_PRIVATE_KEY! }),
 *   ],
 *   secret:  process.env.AUTH_SECRET!,  // openssl rand -base64 32
 *   baseUrl: process.env.NEXTAUTH_URL!, // "https://app.example.com"
 * });
 * ```
 *
 * ```ts
 * // app/api/auth/[...kitforge]/route.ts
 * import { auth } from "@/lib/auth";
 * export const { GET, POST } = auth.handlers;
 * ```
 *
 * ```tsx
 * // app/dashboard/page.tsx  (Server Component)
 * import { auth } from "@/lib/auth";
 * import { redirect } from "next/navigation";
 *
 * export default async function DashboardPage() {
 *   const session = await auth.auth();
 *   if (!session) redirect("/api/auth/signin/google");
 *   return <h1>Hello {session.user.name}</h1>;
 * }
 * ```
 *
 * ```ts
 * // app/actions.ts  (Server Action)
 * "use server";
 * import { auth } from "@/lib/auth";
 *
 * export async function logout() { await auth.signOut(); }
 * ```
 *
 * ```ts
 * // middleware.ts
 * import { createAuthMiddleware } from "@kitforge/auth/next";
 * import { auth } from "@/lib/auth";
 *
 * export default createAuthMiddleware(auth, {
 *   publicPaths: ["/", "/about", /^\/blog/],
 * });
 * export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
 * ```
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { COOKIE_SESSION } from "../node/cookies.js";
import { KitforgeAuth } from "../node/handler.js";
import { verifySessionToken } from "../node/session.js";
import type { Session } from "../node/types.js";
import type { NextKitforgeAuthConfig } from "./types.js";

export type { NextKitforgeAuthConfig, AuthMiddlewareOptions } from "./types.js";
export type { Session };
export { createAuthMiddleware } from "./middleware.js";

export class NextKitforgeAuth {
  /** The underlying node adapter — exposed for advanced use. */
  readonly node: KitforgeAuth;

  /** The URL path prefix for all auth routes (e.g. `"/api/auth"`). */
  readonly basePath: string;

  /** Default sign-in path: `{basePath}/signin/{first provider id}`. */
  readonly defaultSignInPath: string;

  /**
   * Route Handler exports. Place this in `app/api/auth/[...kitforge]/route.ts`:
   * ```ts
   * export const { GET, POST } = auth.handlers;
   * ```
   */
  readonly handlers: {
    GET:  (request: NextRequest) => Promise<Response>;
    POST: (request: NextRequest) => Promise<Response>;
  };

  private readonly secret: string;

  constructor(config: NextKitforgeAuthConfig) {
    // Default basePath for Next.js is /api/auth (not /auth like the node adapter)
    const basePath = config.basePath ?? "/api/auth";
    this.basePath  = basePath;
    this.secret    = config.secret;

    this.node = new KitforgeAuth({ ...config, basePath });

    const firstProvider = config.providers[0];
    this.defaultSignInPath = firstProvider
      ? `${basePath}/signin/${firstProvider.id}`
      : `${basePath}/signin`;

    // Route Handler functions — NextRequest extends Request, so handle() accepts it
    const handle = (req: NextRequest) =>
      this.node.handle(req).then(
        (res) => res ?? new Response("Not found", { status: 404 }),
      );

    this.handlers = { GET: handle, POST: handle };
  }

  // ── Server Component / Server Action API ───────────────────────────────

  /**
   * Read the current session from `next/headers` cookies.
   * Call this in Server Components and Server Actions.
   *
   * ```ts
   * const session = await auth.auth();
   * if (!session) redirect("/api/auth/signin/google");
   * ```
   */
  async auth(): Promise<Session | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_SESSION)?.value;
    if (!token) return null;
    return verifySessionToken(token, this.secret);
  }

  /**
   * Redirect the user to a provider's sign-in page.
   * Works in Server Components, Server Actions, and Route Handlers.
   *
   * ```ts
   * await auth.signIn("google");
   * await auth.signIn("kakao", { redirectTo: "/dashboard" });
   * ```
   */
  async signIn(
    providerId: string,
    options?: { redirectTo?: string },
  ): Promise<never> {
    const destination = options?.redirectTo
      ? `${this.basePath}/signin/${providerId}?redirectTo=${encodeURIComponent(options.redirectTo)}`
      : `${this.basePath}/signin/${providerId}`;
    redirect(destination);
  }

  /**
   * Clear the session cookie and redirect.
   * Works in Server Components and Server Actions.
   *
   * ```ts
   * // Server Action
   * "use server";
   * export async function logout() { await auth.signOut(); }
   *
   * // With custom redirect
   * await auth.signOut({ redirectTo: "/goodbye" });
   * ```
   */
  async signOut(options?: { redirectTo?: string }): Promise<never> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_SESSION);
    redirect(options?.redirectTo ?? "/");
  }

  // ── Middleware API (mirrors node adapter) ──────────────────────────────

  /**
   * Read and verify the session from any `Request` or `NextRequest`.
   * Use this in `middleware.ts` (where `next/headers` is unavailable).
   *
   * ```ts
   * // middleware.ts
   * const session = await auth.getSession(request);
   * if (!session) return NextResponse.redirect(...);
   * ```
   */
  getSession(request: Request): Promise<Session | null> {
    return this.node.getSession(request);
  }
}

/**
 * Create a Next.js App Router auth instance.
 *
 * @example
 * ```ts
 * // lib/auth.ts
 * export const auth = createNextAuth({ providers: [...], secret, baseUrl });
 * ```
 */
export function createNextAuth(config: NextKitforgeAuthConfig): NextKitforgeAuth {
  return new NextKitforgeAuth(config);
}
