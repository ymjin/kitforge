---
"@kitforge/auth": minor
---

Add `@kitforge/auth/react` — React SPA adapter.

서버 어댑터(`/node`, `/next`)와 함께 사용하는 클라이언트 사이드 React 레이어입니다.

| 제공 항목 | 설명 |
|-----------|------|
| `<KitforgeProvider>` | Context 공급자 — `basePath`, `refetchInterval`, `refetchOnWindowFocus` 설정 |
| `useSession()` | `{ session, status, update }` — `"loading"` → `"authenticated"` / `"unauthenticated"` |
| `useSignIn()` | `signIn("google")` → `window.location.href` 리다이렉트 |
| `useSignOut()` | POST `/signout` → 로컬 상태 갱신 → 리다이렉트 |

- `"use client"` 디렉티브 포함 — Next.js Client Component + 순수 SPA 모두 동작
- 세션은 HttpOnly 쿠키 기반 (서버 어댑터가 관리), 클라이언트에 토큰 미노출
- 탭 포커스 복귀 시 자동 세션 갱신 (`refetchOnWindowFocus`, 기본 on)
- `react >= 18` peerDependency (optional)
