---
"@kitforge/auth": minor
---

Add native Sign in with Apple — `useAppleAuth` in `@kitforge/auth/native`.

`expo-apple-authentication`의 **네이티브 시트**를 사용합니다 (OAuth/PKCE 브라우저
흐름이 아님). Apple이 서명한 `identityToken`을 직접 반환 — 코드 교환 없음.

- `useAppleAuth()` → `{ signIn, isAvailable }`. `isAvailable`은 iOS 13+/capability에서만 true(안드로이드 false)
- `signIn()`은 credential(user=sub, email·fullName은 최초 1회)로 세션 생성, `identityToken`을 secure-store에 저장(백엔드 검증용), 취소 시 null
- **프로필 매핑은 웹 Apple provider와 공유** — `mapAppleClaims`를 코어에서 export해 웹 `userinfo.map`과 네이티브가 같은 함수 사용. 그래서 Apple 유저는 웹/앱 동일
- `expo-apple-authentication` optional peerDependency, iOS "Sign in with Apple" capability 필요

이로써 3개 앱의 네이티브 인증(Google·Apple·Kakao)이 모두 가능 — Apple은 App Store 정책(4.8)상 필수.

11개 스모크 테스트 통과 (availability, signIn 프로필/토큰/영속화, 취소, 안드로이드 미지원).
