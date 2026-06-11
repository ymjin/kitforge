/**
 * Naver OAuth 2.0 provider.
 *
 * - Authorization / token endpoints: nid.naver.com/oauth2.0
 * - Userinfo endpoint: openapi.naver.com/v1/nid/me
 * - `clientSecret` is **required** by Naver (unlike Kakao/Google where it's
 *   optional for PKCE-only flows). Pass it from your `.env`.
 * - Naver does not document PKCE support, so `usePKCE` is false; the `state`
 *   parameter is still generated to prevent CSRF.
 * - Naver doesn't use OAuth scopes in the request — granted data fields are
 *   configured in the Naver developer console per-app.
 *
 * Required Naver app settings (developers.naver.com):
 *   - API 선택: "네아로 (네이버 아이디로 로그인)"
 *   - 제공 정보 선택: 이메일 주소, 별명, 프로필 사진, 이름 등
 *
 * @example
 * ```ts
 * import { Naver } from "@ymjin/auth/providers";
 * const naver = Naver({
 *   clientId: process.env.NAVER_CLIENT_ID!,
 *   clientSecret: process.env.NAVER_CLIENT_SECRET!,
 * });
 * ```
 */

import type { NormalizedProfile, OAuthProvider, ProviderOptions } from "../core/types.js";

export function Naver(options: ProviderOptions): OAuthProvider {
  if (!options.clientSecret) {
    throw new Error(
      "[@ymjin/auth] Naver requires a clientSecret. " +
        "Set NAVER_CLIENT_SECRET in your environment and pass it to Naver({ clientSecret }).",
    );
  }

  return {
    id: "naver",
    name: "네이버",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    // Naver ignores scope params; data access is configured in the dev console.
    scopes: [],
    usePKCE: false,
    authorization: {
      url: "https://nid.naver.com/oauth2.0/authorize",
      params: {
        response_type: "code",
      },
    },
    token: {
      url: "https://nid.naver.com/oauth2.0/token",
    },
    userinfo: {
      url: "https://openapi.naver.com/v1/nid/me",
      map: mapNaverProfile,
    },
  };
}

/**
 * Naver wraps the actual profile inside a `response` key:
 * ```json
 * {
 *   "resultcode": "00",
 *   "message": "success",
 *   "response": {
 *     "id": "some-unique-id",
 *     "email": "user@naver.com",
 *     "name": "홍길동",
 *     "nickname": "길동",
 *     "profile_image": "https://..."
 *   }
 * }
 * ```
 */
function mapNaverProfile(
  raw: Record<string, unknown>,
  provider: OAuthProvider,
): NormalizedProfile {
  const response = raw["response"] as Record<string, unknown> | undefined;

  if (!response) {
    throw new Error(
      `[@ymjin/auth] Naver userinfo response missing "response" field. ` +
        `resultcode=${String(raw["resultcode"])}, message=${String(raw["message"])}`,
    );
  }

  return {
    provider: provider.id,
    id: String(response["id"]),
    email: typeof response["email"] === "string" ? response["email"] : undefined,
    // Naver verifies email ownership at account-creation; treat as verified.
    emailVerified: typeof response["email"] === "string" ? true : undefined,
    name: typeof response["name"] === "string" ? response["name"] : undefined,
    avatarUrl:
      typeof response["profile_image"] === "string" ? response["profile_image"] : undefined,
    raw,
  };
}
