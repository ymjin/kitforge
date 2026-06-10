/**
 * createAuthMiddleware — protect routes in Next.js middleware.ts
 *
 * The returned function is a standard `NextMiddleware` that:
 *   1. Lets through requests to public paths and auth routes.
 *   2. Lets through requests that carry a valid session cookie.
 *   3. Redirects everything else to the sign-in page.
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createAuthMiddleware } from "@kitforge/auth/next";
 * import { auth } from "@/lib/auth";
 *
 * export default createAuthMiddleware(auth, {
 *   publicPaths: ["/", "/about", /^\/blog/],
 * });
 *
 * export const config = {
 *   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
 * };
 * ```
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { NextKitforgeAuth } from "./index.js";
import type { AuthMiddlewareOptions } from "./types.js";

export function createAuthMiddleware(
  auth: NextKitforgeAuth,
  options: AuthMiddlewareOptions = {},
): (request: NextRequest) => Promise<NextResponse | Response> {
  const { publicPaths = [], signInPath } = options;
  const basePath = auth.basePath;

  return async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow the auth routes themselves through
    if (pathname.startsWith(basePath + "/") || pathname === basePath) {
      return NextResponse.next();
    }

    // Check consumer-defined public paths
    const isPublic = publicPaths.some((p) =>
      typeof p === "string" ? pathname === p : p.test(pathname),
    );
    if (isPublic) return NextResponse.next();

    // Validate session — NextRequest extends Request, so getSession works as-is
    const session = await auth.getSession(request);
    if (session) return NextResponse.next();

    // Redirect to sign-in
    const destination = signInPath ?? auth.defaultSignInPath;
    const url = new URL(destination, request.url);
    return NextResponse.redirect(url);
  };
}
