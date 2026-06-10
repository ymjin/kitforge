/**
 * @kitforge/auth/node — generic Node.js adapter.
 *
 * Built on Web API (`Request` / `Response`) so it works anywhere Node 18+ is
 * available: plain HTTP servers, Express, Fastify, Hono, Next.js Route
 * Handlers, Cloudflare Workers, Bun, Deno — without any framework imports.
 *
 * ## Routes (default basePath = "/auth")
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET    | /auth/signin/:provider   | Redirect to provider |
 * | GET\|POST | /auth/callback/:provider | Exchange code → session |
 * | POST   | /auth/signout            | Clear session → redirect |
 * | GET    | /auth/session            | Return session JSON |
 *
 * ## Usage
 *
 * ```ts
 * import { createKitforgeAuth } from "@kitforge/auth/node";
 * import { Google, Kakao, Naver, Apple } from "@kitforge/auth/providers";
 *
 * export const auth = createKitforgeAuth({
 *   providers: [
 *     Google({ clientId: process.env.GOOGLE_CLIENT_ID! }),
 *     Kakao({ clientId: process.env.KAKAO_CLIENT_ID! }),
 *     Naver({ clientId: process.env.NAVER_CLIENT_ID!, clientSecret: process.env.NAVER_CLIENT_SECRET! }),
 *     Apple({ clientId: process.env.APPLE_CLIENT_ID!, teamId: process.env.APPLE_TEAM_ID!, keyId: process.env.APPLE_KEY_ID!, privateKey: process.env.APPLE_PRIVATE_KEY! }),
 *   ],
 *   secret:  process.env.AUTH_SECRET!,   // openssl rand -base64 32
 *   baseUrl: process.env.AUTH_URL!,      // "https://app.example.com"
 * });
 *
 * // Hono
 * app.all("/auth/*", async (c) => {
 *   const res = await auth.handle(c.req.raw);
 *   return res ?? c.notFound();
 * });
 *
 * // Express (with express-async-handler or equivalent)
 * app.all("/auth/*", async (req, res) => {
 *   const webRequest = new Request(`http://localhost${req.url}`, {
 *     method: req.method,
 *     headers: req.headers as HeadersInit,
 *   });
 *   const webResponse = await auth.handle(webRequest);
 *   if (!webResponse) return res.sendStatus(404);
 *   res.status(webResponse.status);
 *   webResponse.headers.forEach((v, k) => res.setHeader(k, v));
 *   res.send(await webResponse.text());
 * });
 * ```
 */

export { KitforgeAuth } from "./handler.js";
export type { KitforgeAuthConfig, Session } from "./types.js";

import { KitforgeAuth } from "./handler.js";
import type { KitforgeAuthConfig } from "./types.js";

/** Factory shorthand — equivalent to `new KitforgeAuth(config)`. */
export function createKitforgeAuth(config: KitforgeAuthConfig): KitforgeAuth {
  return new KitforgeAuth(config);
}
