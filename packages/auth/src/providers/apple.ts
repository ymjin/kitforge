/**
 * Apple Sign In (Sign in with Apple) provider.
 *
 * ## Apple의 두 가지 특이점
 *
 * 1. **client_secret이 동적 JWT** — 정적 문자열이 아닌 ES256(ECDSA P-256)으로
 *    서명된 JWT를 매 토큰 요청마다 생성합니다. Apple Developer에서 발급받은
 *    `.p8` 개인키로 서명하며, Web Crypto API를 사용해 브라우저와 Node 18+
 *    모두에서 동작합니다.
 *
 * 2. **userinfo 엔드포인트 없음** — 프로필(sub, email, email_verified)은
 *    토큰 교환 응답의 `id_token` JWT 페이로드에서 추출합니다. 이름(name)은
 *    최초 로그인 시 authorization response의 `user` 파라미터에만 포함되며,
 *    이후 요청에서는 전달되지 않습니다 — 이 값은 프레임워크 어댑터에서
 *    처리해야 합니다.
 *
 * ## Apple Developer 설정
 *   - Identifiers > App IDs: 앱 생성, "Sign In with Apple" 활성화
 *   - Identifiers > Services IDs: Web 용 Service ID 생성 (`clientId`로 사용)
 *   - Keys: "Sign In with Apple" 키 생성 → `.p8` 파일 다운로드 (재발급 불가)
 *
 * ## 환경 변수 예시
 * ```
 * APPLE_CLIENT_ID=com.example.app         # Service ID
 * APPLE_TEAM_ID=ABCDE12345               # 10자 Team ID
 * APPLE_KEY_ID=ABC123DEFG                # Key ID (.p8 파일명의 숫자)
 * APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 * ```
 *
 * @example
 * ```ts
 * import { Apple } from "@kitforge/auth/providers";
 *
 * const apple = Apple({
 *   clientId:   process.env.APPLE_CLIENT_ID!,
 *   teamId:     process.env.APPLE_TEAM_ID!,
 *   keyId:      process.env.APPLE_KEY_ID!,
 *   privateKey: process.env.APPLE_PRIVATE_KEY!,
 * });
 * ```
 */

import type { NormalizedProfile, OAuthProvider, ProviderOptions } from "../core/types.js";

export interface AppleOptions extends ProviderOptions {
  /** 10자리 Apple Team ID (Apple Developer > Membership에서 확인). */
  teamId: string;
  /** `.p8` 파일에 대응하는 Key ID. */
  keyId: string;
  /**
   * `.p8` 파일 전체 내용 (PEM 형식).
   * `\n`이 실제 개행으로 포함되어야 합니다 — 환경 변수에서 읽을 때
   * `replace(/\\n/g, "\n")`으로 변환하세요.
   */
  privateKey: string;
}

const DEFAULT_SCOPES = ["name", "email"];

export function Apple(options: AppleOptions): OAuthProvider {
  const { clientId, teamId, keyId, privateKey } = options;

  // Pre-import the key once at construction time. The Promise is cached so
  // every `getClientSecret` call awaits the same import, not a re-parse.
  const cryptoKeyPromise = importPrivateKey(privateKey);

  return {
    id: "apple",
    name: "Apple",
    clientId,
    // Apple client_secret is a freshly-signed JWT — resolved dynamically.
    getClientSecret: () => createAppleClientSecret({ teamId, keyId, clientId, cryptoKeyPromise }),
    scopes: options.scopes ?? DEFAULT_SCOPES,
    usePKCE: false, // Apple uses client_secret JWT for proof; PKCE is redundant
    authorization: {
      url: "https://appleid.apple.com/auth/authorize",
      params: {
        // form_post is required when requesting name/email scopes on the web.
        // The adapter receives code + user as a POST body, not query params.
        response_mode: "form_post",
      },
    },
    token: {
      url: "https://appleid.apple.com/auth/token",
    },
    userinfo: {
      // Apple has no userinfo REST endpoint. Profile is in the id_token.
      fromIdToken: true,
      map: mapAppleProfile,
    },
  };
}

// ---------------------------------------------------------------------------
// Profile mapping
// ---------------------------------------------------------------------------

/**
 * Apple id_token payload (relevant fields):
 * ```json
 * {
 *   "sub": "000000.abcdef1234567890abcdef1234567890.1234",
 *   "email": "user@privaterelay.appleid.com",
 *   "email_verified": "true",
 *   "is_private_email": "true"
 * }
 * ```
 * Note: `name` is NOT in the id_token. It appears only once, in the
 * authorization response `user` field (JSON string), on the very first sign-in.
 * The framework adapter is responsible for capturing and persisting it.
 */
function mapAppleProfile(
  raw: Record<string, unknown>,
  provider: OAuthProvider,
): NormalizedProfile {
  // Apple sends email_verified as a string "true"/"false" (not boolean).
  const emailVerifiedRaw = raw["email_verified"];
  const emailVerified =
    emailVerifiedRaw === true ||
    emailVerifiedRaw === "true";

  return {
    provider: provider.id,
    id: String(raw["sub"]),
    email: typeof raw["email"] === "string" ? raw["email"] : undefined,
    emailVerified,
    // name: set by the adapter from the first-login `user` param.
    name: undefined,
    // Apple has no avatar.
    avatarUrl: undefined,
    raw,
  };
}

// ---------------------------------------------------------------------------
// client_secret JWT generation (ES256 / ECDSA P-256 via Web Crypto)
// ---------------------------------------------------------------------------

function base64UrlEncodeString(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Strip PEM headers and decode to DER bytes. */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----[^-]+-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Import the Apple `.p8` private key via Web Crypto (cached as a Promise). */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

interface AppleSecretParams {
  teamId: string;
  keyId: string;
  clientId: string;
  cryptoKeyPromise: Promise<CryptoKey>;
}

/**
 * Generate a fresh Apple client_secret JWT.
 *
 * Spec: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 * - Algorithm: ES256
 * - Max expiry: 15,777,000 s (~6 months) — Apple rejects longer ones.
 * - Web Crypto's ECDSA `sign` output is IEEE P1363 (raw r||s), which is
 *   exactly what JWT ES256 requires. No DER conversion needed.
 */
async function createAppleClientSecret(params: AppleSecretParams): Promise<string> {
  const { teamId, keyId, clientId, cryptoKeyPromise } = params;

  const header = base64UrlEncodeString(JSON.stringify({ alg: "ES256", kid: keyId }));

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncodeString(
    JSON.stringify({
      iss: teamId,
      iat: nowSeconds,
      exp: nowSeconds + 15_777_000, // ~6 months, Apple's maximum
      aud: "https://appleid.apple.com",
      sub: clientId,
    }),
  );

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const key = await cryptoKeyPromise;
  const sigBytes = new Uint8Array(
    await globalThis.crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, signingInput),
  );

  return `${header}.${payload}.${base64UrlEncodeBytes(sigBytes)}`;
}
