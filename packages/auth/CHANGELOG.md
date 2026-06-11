# @ymjin/auth

## 0.1.0

### Minor Changes

- b5e44bf: Add Apple Sign In provider + extend core for dynamic secrets and id_token profiles.

  **`@ymjin/auth/providers` — Apple**

  - `client_secret`은 ES256(ECDSA P-256) JWT로 동적 생성 (`getClientSecret` 팩토리, Web Crypto)
  - userinfo 엔드포인트 없음 → `id_token` 페이로드에서 프로필 추출 (`fromIdToken: true`)
  - `email_verified` 문자열 "true"/"false" → boolean 정규화
  - 이름은 최초 로그인의 `user` 파라미터에만 제공 → 프레임워크 어댑터에서 처리 필요

  **core 확장 (하위 호환)**

  - `OAuthProvider.getClientSecret?: () => Promise<string>` — 동적 client_secret 팩토리
  - `OAuthProvider.userinfo.url` — optional로 변경 (기존 Google/Kakao/Naver 영향 없음)
  - `OAuthProvider.userinfo.fromIdToken?: boolean` — 추가
  - `getUserInfo(provider, accessToken, tokens?)` — tokens 인자 추가 (optional, 하위 호환)

- 89b21bc: Add external storage — `@ymjin/auth/adapters` (DB adapter + session store).

  두 가지 독립적인 외부 스토리지 연결을 추가합니다. 둘 다 **선택사항**이며,
  설정하지 않으면 기존 stateless JWT 쿠키 방식 그대로 동작합니다 (하위 호환).

  **① DB 어댑터 (`AuthAdapter`) — 사용자 영속화**

  - 로그인 시 `users` + `accounts` 자동 upsert, provider 계정 연결
  - 설정 시 세션 `user.id`가 provider sub → **DB 내부 id**로 바뀜
  - 동일 identity 재로그인 시 중복 사용자 생성 안 함

  **② 세션 스토어 (`SessionStore`) — 서버 사이드 세션**

  - JWT 대신 불투명 세션 id만 쿠키에 저장, 본문은 스토어에 보관
  - **즉시 로그아웃 / 세션 무효화** 가능 (행 삭제)
  - 만료 세션 lazy 제거

  **구현체** (`@ymjin/auth/adapters`):

  - `InMemoryAdapter` / `InMemorySessionStore` — 개발·테스트·데모
  - `SupabaseAdapter` / `SupabaseSessionStore` — 프로덕션 (소비자가 client 주입, SDK 미번들)
  - `@ymjin/auth/adapters/schema.sql` — Supabase 테이블 스키마 (RLS 포함)

  **core 추가** (하위 호환):

  - `AuthAdapter`, `AdapterUser`, `AdapterAccount`, `SessionStore`, `SessionUser` 인터페이스 (`@ymjin/auth`에서 import 가능)
  - `KitforgeAuthConfig.adapter`, `KitforgeAuthConfig.sessionStore` 옵션
  - `KitforgeAuth.getSessionByCookieValue()`, `deleteStoredSession()` — Next.js 어댑터 연동
  - Next.js `auth()` / `signOut()`가 세션 스토어 인지하도록 갱신

- 6fc30e0: Add `@ymjin/auth` with a framework-agnostic OAuth 2.0 + PKCE core and the
  Google provider. Exposes `createAuthorizationUrl`, `exchangeCode`,
  `refreshTokens`, and `getUserInfo` from the root, and the `Google` factory from
  `@ymjin/auth/providers`. Client secrets are injected by the consumer and
  never bundled.
- 88d3a59: Add Kakao and Naver OAuth 2.0 providers.

  - `Kakao`: PKCE 지원, clientSecret 선택사항, `kakao_account` 중첩 구조 정규화
  - `Naver`: PKCE 미지원(state로 CSRF 방어), clientSecret 필수 강제(미전달 시 즉시 에러)

- 627c67f: Add native Sign in with Apple — `useAppleAuth` in `@ymjin/auth/native`.

  `expo-apple-authentication`의 **네이티브 시트**를 사용합니다 (OAuth/PKCE 브라우저
  흐름이 아님). Apple이 서명한 `identityToken`을 직접 반환 — 코드 교환 없음.

  - `useAppleAuth()` → `{ signIn, isAvailable }`. `isAvailable`은 iOS 13+/capability에서만 true(안드로이드 false)
  - `signIn()`은 credential(user=sub, email·fullName은 최초 1회)로 세션 생성, `identityToken`을 secure-store에 저장(백엔드 검증용), 취소 시 null
  - **프로필 매핑은 웹 Apple provider와 공유** — `mapAppleClaims`를 코어에서 export해 웹 `userinfo.map`과 네이티브가 같은 함수 사용. 그래서 Apple 유저는 웹/앱 동일
  - `expo-apple-authentication` optional peerDependency, iOS "Sign in with Apple" capability 필요

  이로써 3개 앱의 네이티브 인증(Google·Apple·Kakao)이 모두 가능 — Apple은 App Store 정책(4.8)상 필수.

  11개 스모크 테스트 통과 (availability, signIn 프로필/토큰/영속화, 취소, 안드로이드 미지원).

- 4cd1f31: Add `@ymjin/auth/native` — React Native (Expo) auth.

  웹과 **흐름은 분리, 데이터는 공유**합니다. 네이티브 로그인 흐름(expo-auth-session +
  expo-secure-store)은 완전히 새로 작성하되, provider 설정·`getUserInfo`·
  `NormalizedProfile` 같은 **데이터는 코어에서 그대로 가져옵니다** — 그래서 구글 유저는
  웹이든 앱이든 동일한 모양입니다.

  **API**:

  - `<KitforgeAuthProvider>` — secure-store에서 세션 하이드레이트, 앱 전역 세션 보유
  - `useOAuth(provider)` — expo-auth-session으로 PKCE 로그인 → 토큰 교환 → 공유 `getUserInfo` → secure-store 저장. 표준 PKCE provider(Google·Kakao)용
  - `useSession()` — `{ session, status, signOut }`
  - `SecureStorage` 인터페이스 — 기본 expo-secure-store, 주입 가능
  - `toOAuthTokens`·`profileToSessionUser`·`providerDiscovery` 순수 헬퍼

  **제약**:

  - 표준 PKCE provider 대상(Google·Kakao). Apple은 expo-apple-authentication(네이티브 시트)이 더 적합 → 후속
  - 네이버는 web 전용(토큰 교환에 client secret 필요 → 백엔드 교환). 3개 앱은 네이버 미사용
  - `expo-auth-session`·`expo-secure-store` optional peerDependency, 앱 URL scheme 설정 필요
  - 키는 PKCE 공개 클라이언트라 secret 불필요

  19개 스모크 테스트 통과 (config 헬퍼, context 하이드레이트, useOAuth 전체 흐름 — PKCE·토큰 교환·프로필·영속화·signOut·취소).

  내부 개선: auth `tsconfig.json`에 `jsx: react-jsx` 추가(자동 런타임) — tsup 빌드 시 모든 .tsx 진입점이 올바르게 번들됨.

- bf6c822: Add `@ymjin/auth/next` — Next.js App Router adapter.

  `@ymjin/auth/node` 위에 Next.js 전용 API를 추가합니다:

  | API                                | 설명                                                                        |
  | ---------------------------------- | --------------------------------------------------------------------------- |
  | `auth.handlers`                    | `GET`/`POST` Route Handler — `app/api/auth/[...kitforge]/route.ts`에 export |
  | `auth.auth()`                      | `next/headers` cookies에서 세션 읽기 — Server Component / Server Action     |
  | `auth.signIn(provider)`            | `next/navigation redirect()` — Server Component / Server Action             |
  | `auth.signOut()`                   | 세션 쿠키 삭제 + redirect — Server Action                                   |
  | `auth.getSession(request)`         | `middleware.ts`용 — NextRequest를 Request로 처리                            |
  | `createAuthMiddleware(auth, opts)` | publicPaths + 인증 게이트 미들웨어 팩토리                                   |

  - 기본 `basePath`: `/api/auth` (node 어댑터 `/auth`와 구분)
  - `next >= 14.0.0` peerDependency (optional)

- 594f58d: Add `@ymjin/auth/node` — generic Web API-based adapter.

  Web API (`Request`/`Response`) 기반이라 Node 18+, Hono, Express, Fastify,
  Next.js Route Handlers, Cloudflare Workers, Bun, Deno 등 어디서나 동일하게
  동작합니다.

  **처리 경로** (기본 basePath = `/auth`):

  - `GET  /auth/signin/:provider` → 302 to provider authorize URL + state/PKCE 쿠키
  - `GET|POST /auth/callback/:provider` → 코드 교환 → 세션 JWT 발급 → 302
  - `POST /auth/signout` → 세션 쿠키 삭제 → 302
  - `GET  /auth/session` → 현재 세션 JSON 반환

  **보안**:

  - CSRF: state 파라미터 → HttpOnly 쿠키 비교
  - 세션: HS256 JWT (`jose`) → HttpOnly + Secure + SameSite=Lax 쿠키
  - secret 32자 미만 시 생성 시점에 즉시 에러
  - http:// (개발) 환경에서 자동으로 Secure 플래그 해제

  **`jose`** 런타임 의존성으로 추가.

- 1e46aa0: Add `@ymjin/auth/react` — React SPA adapter.

  서버 어댑터(`/node`, `/next`)와 함께 사용하는 클라이언트 사이드 React 레이어입니다.

  | 제공 항목            | 설명                                                                                  |
  | -------------------- | ------------------------------------------------------------------------------------- |
  | `<KitforgeProvider>` | Context 공급자 — `basePath`, `refetchInterval`, `refetchOnWindowFocus` 설정           |
  | `useSession()`       | `{ session, status, update }` — `"loading"` → `"authenticated"` / `"unauthenticated"` |
  | `useSignIn()`        | `signIn("google")` → `window.location.href` 리다이렉트                                |
  | `useSignOut()`       | POST `/signout` → 로컬 상태 갱신 → 리다이렉트                                         |

  - `"use client"` 디렉티브 포함 — Next.js Client Component + 순수 SPA 모두 동작
  - 세션은 HttpOnly 쿠키 기반 (서버 어댑터가 관리), 클라이언트에 토큰 미노출
  - 탭 포커스 복귀 시 자동 세션 갱신 (`refetchOnWindowFocus`, 기본 on)
  - `react >= 18` peerDependency (optional)
