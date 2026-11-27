/**
 * Provider factories. Import the ones you need and pass your own credentials:
 *
 * ```ts
 * import { Google, Kakao, Naver, NaverWorks, Apple } from "@ymjin/auth/providers";
 * ```
 *
 * Supported providers: Google, Kakao, Naver, NaverWorks, Apple.
 */

export { Google } from "./google.js";
export { Kakao } from "./kakao.js";
export { Naver } from "./naver.js";
export { NaverWorks } from "./naver-works.js";
export { Apple } from "./apple.js";
export type { AppleOptions } from "./apple.js";
