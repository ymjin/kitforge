---
"@kitforge/auth": minor
---

Add `@kitforge/auth/node` — generic Web API-based adapter.

Web API (`Request`/`Response`) 기반이라 Node 18+, Hono, Express, Fastify,
Next.js Route Handlers, Cloudflare Workers, Bun, Deno 등 어디서나 동일하게
동작합니다.

**처리 경로** (기본 basePath = `/auth`):
- `GET  /auth/signin/:provider`    → 302 to provider authorize URL + state/PKCE 쿠키
- `GET|POST /auth/callback/:provider` → 코드 교환 → 세션 JWT 발급 → 302
- `POST /auth/signout`             → 세션 쿠키 삭제 → 302
- `GET  /auth/session`             → 현재 세션 JSON 반환

**보안**:
- CSRF: state 파라미터 → HttpOnly 쿠키 비교
- 세션: HS256 JWT (`jose`) → HttpOnly + Secure + SameSite=Lax 쿠키
- secret 32자 미만 시 생성 시점에 즉시 에러
- http:// (개발) 환경에서 자동으로 Secure 플래그 해제

**`jose`** 런타임 의존성으로 추가.
