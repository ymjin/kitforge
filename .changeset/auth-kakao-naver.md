---
"@kitforge/auth": minor
---

Add Kakao and Naver OAuth 2.0 providers.

- `Kakao`: PKCE 지원, clientSecret 선택사항, `kakao_account` 중첩 구조 정규화
- `Naver`: PKCE 미지원(state로 CSRF 방어), clientSecret 필수 강제(미전달 시 즉시 에러)
