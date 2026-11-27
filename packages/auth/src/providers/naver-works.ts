/**
 * Naver Works OAuth 2.0 provider.
 *
 * - Authorization / token endpoints: auth.worksmobile.com/oauth2/v2.0
 * - Userinfo endpoint: www.worksapis.com/v1.0/users/me
 * - PKCE 지원 (권장).
 * - `clientSecret` 필수.
 *
 * Naver Works Developer Console (dev.worksmobile.com) 설정:
 *   - OAuth Scope: openid, user.read (또는 user)
 *   - Redirect URI 등록 필요
 *   - `openid`를 켜지 않으면 id_token이 발급되지 않아
 *     `POST /auth/signout?federated=1`이 로컬 로그아웃으로만 동작합니다.
 *
 * @example
 * ```ts
 * import { NaverWorks } from "@ymjin/auth/providers";
 * const naverWorks = NaverWorks({
 *   clientId: process.env.NAVER_WORKS_CLIENT_ID!,
 *   clientSecret: process.env.NAVER_WORKS_CLIENT_SECRET!,
 * });
 * ```
 */

import type { NormalizedProfile, OAuthProvider, ProviderOptions } from "../core/types.js";

export function NaverWorks(options: ProviderOptions): OAuthProvider {
  if (!options.clientSecret) {
    throw new Error(
      "[@ymjin/auth] NaverWorks requires a clientSecret. " +
        "Set NAVER_WORKS_CLIENT_SECRET in your environment and pass it to NaverWorks({ clientSecret }).",
    );
  }

  return {
    id: "naver-works",
    name: "네이버 웍스",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    // `openid` is what makes the IdP return an `id_token`; without it
    // federated sign-out (`?federated=1`) has no `id_token_hint` to send and
    // silently degrades to a local sign-out.
    scopes: options.scopes ?? ["openid", "user.read"],
    usePKCE: true,
    authorization: {
      url: "https://auth.worksmobile.com/oauth2/v2.0/authorize",
    },
    token: {
      url: "https://auth.worksmobile.com/oauth2/v2.0/token",
    },
    endSession: {
      url: "https://auth.worksmobile.com/oauth2/v2.0/logout",
    },
    userinfo: {
      url: "https://www.worksapis.com/v1.0/users/me",
      map: mapNaverWorksProfile,
    },
  };
}

/**
 * Naver Works userinfo 응답 예시:
 * ```json
 * {
 *   "userId": "user@company.com",
 *   "userName": { "lastName": "홍", "firstName": "길동" },
 *   "email": "user@company.com",
 *   "userPhoto": { "original": "https://..." }
 * }
 * ```
 */
function mapNaverWorksProfile(
  raw: Record<string, unknown>,
  provider: OAuthProvider,
): NormalizedProfile {
  const userId = raw["userId"];
  if (!userId) {
    throw new Error("[@ymjin/auth] NaverWorks userinfo response missing \"userId\" field.");
  }

  // userName은 { lastName, firstName } 객체
  let name: string | undefined;
  const userName = raw["userName"] as Record<string, unknown> | string | undefined;
  if (typeof userName === "string") {
    name = userName;
  } else if (userName && typeof userName === "object") {
    const last = typeof userName["lastName"] === "string" ? userName["lastName"] : "";
    const first = typeof userName["firstName"] === "string" ? userName["firstName"] : "";
    name = (last + first).trim() || undefined;
  }

  const avatarUrl =
    (raw["userPhoto"] as Record<string, unknown> | undefined)?.["original"];

  return {
    provider: provider.id,
    id: String(userId),
    email: typeof raw["email"] === "string" ? raw["email"] : undefined,
    emailVerified: typeof raw["email"] === "string" ? true : undefined,
    name,
    avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
    raw,
  };
}
