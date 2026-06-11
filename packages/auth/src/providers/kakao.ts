/**
 * Kakao OAuth 2.0 provider.
 *
 * - Authorization / token endpoints: kauth.kakao.com
 * - Userinfo endpoint: kapi.kakao.com/v2/user/me
 * - `clientSecret` is optional for Kakao; omitting it still works for public
 *   clients. When present it is sent in the token exchange body, never in the
 *   URL.
 * - PKCE is supported and enabled by default (same as Google).
 *
 * Required Kakao app settings (developers.kakao.com):
 *   - "카카오 로그인" ON
 *   - Consent items: 닉네임, 프로필 사진 (always available), 카카오 계정(이메일)
 *     (requires additional business review for most apps)
 *
 * @example
 * ```ts
 * import { Kakao } from "@ymjin/auth/providers";
 * const kakao = Kakao({ clientId: process.env.KAKAO_CLIENT_ID! });
 * ```
 */

import type { NormalizedProfile, OAuthProvider, ProviderOptions } from "../core/types.js";

/**
 * Kakao splits scopes into "essential" (profile_nickname, profile_image) and
 * "optional" (account_email — needs business review).
 * Start with the essentials; add "account_email" if your app is approved.
 */
const DEFAULT_SCOPES = ["profile_nickname", "profile_image"];

export function Kakao(options: ProviderOptions): OAuthProvider {
  return {
    id: "kakao",
    name: "카카오",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    scopes: options.scopes ?? DEFAULT_SCOPES,
    usePKCE: true,
    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        // Ask for a refresh_token.
        // "consent_required" forces the consent screen each time (optional).
        prompt: "login",
      },
    },
    token: {
      url: "https://kauth.kakao.com/oauth/token",
    },
    userinfo: {
      url: "https://kapi.kakao.com/v2/user/me",
      map: mapKakaoProfile,
    },
  };
}

/**
 * Kakao userinfo shape (simplified):
 * ```json
 * {
 *   "id": 12345678,
 *   "kakao_account": {
 *     "email": "user@example.com",
 *     "email_needs_agreement": false,
 *     "profile": {
 *       "nickname": "홍길동",
 *       "profile_image_url": "https://..."
 *     }
 *   }
 * }
 * ```
 */
function mapKakaoProfile(
  raw: Record<string, unknown>,
  provider: OAuthProvider,
): NormalizedProfile {
  const account = raw["kakao_account"] as Record<string, unknown> | undefined;
  const profile = account?.["profile"] as Record<string, unknown> | undefined;

  return {
    provider: provider.id,
    id: String(raw["id"]),
    email: typeof account?.["email"] === "string" ? account["email"] : undefined,
    // Kakao doesn't expose a verified flag directly; we treat it as unverified
    // unless the app has been granted the verified email scope.
    emailVerified: false,
    name: typeof profile?.["nickname"] === "string" ? profile["nickname"] : undefined,
    avatarUrl:
      typeof profile?.["profile_image_url"] === "string"
        ? profile["profile_image_url"]
        : undefined,
    raw,
  };
}
