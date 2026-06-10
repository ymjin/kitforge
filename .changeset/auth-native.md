---
"@kitforge/auth": minor
---

Add `@kitforge/auth/native` — React Native (Expo) auth.

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
