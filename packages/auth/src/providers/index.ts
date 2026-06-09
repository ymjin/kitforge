/**
 * Provider factories. Import the ones you need and pass your own credentials:
 *
 * ```ts
 * import { Google } from "@kitforge/auth/providers";
 * ```
 *
 * Roadmap: Apple, Kakao, Naver land here next, each as a `(options) => OAuthProvider`
 * factory so the core flow in `@kitforge/auth` stays untouched.
 */

export { Google } from "./google.js";
export { Kakao } from "./kakao.js";
export { Naver } from "./naver.js";
