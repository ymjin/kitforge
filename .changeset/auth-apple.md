---
"@kitforge/auth": minor
---

Add Apple Sign In provider + extend core for dynamic secrets and id_token profiles.

**`@kitforge/auth/providers` — Apple**
- `client_secret`은 ES256(ECDSA P-256) JWT로 동적 생성 (`getClientSecret` 팩토리, Web Crypto)
- userinfo 엔드포인트 없음 → `id_token` 페이로드에서 프로필 추출 (`fromIdToken: true`)
- `email_verified` 문자열 "true"/"false" → boolean 정규화
- 이름은 최초 로그인의 `user` 파라미터에만 제공 → 프레임워크 어댑터에서 처리 필요

**core 확장 (하위 호환)**
- `OAuthProvider.getClientSecret?: () => Promise<string>` — 동적 client_secret 팩토리
- `OAuthProvider.userinfo.url` — optional로 변경 (기존 Google/Kakao/Naver 영향 없음)
- `OAuthProvider.userinfo.fromIdToken?: boolean` — 추가
- `getUserInfo(provider, accessToken, tokens?)` — tokens 인자 추가 (optional, 하위 호환)
