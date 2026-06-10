---
"@kitforge/auth": minor
---

Add `@kitforge/auth/next` — Next.js App Router adapter.

`@kitforge/auth/node` 위에 Next.js 전용 API를 추가합니다:

| API | 설명 |
|-----|------|
| `auth.handlers` | `GET`/`POST` Route Handler — `app/api/auth/[...kitforge]/route.ts`에 export |
| `auth.auth()` | `next/headers` cookies에서 세션 읽기 — Server Component / Server Action |
| `auth.signIn(provider)` | `next/navigation redirect()` — Server Component / Server Action |
| `auth.signOut()` | 세션 쿠키 삭제 + redirect — Server Action |
| `auth.getSession(request)` | `middleware.ts`용 — NextRequest를 Request로 처리 |
| `createAuthMiddleware(auth, opts)` | publicPaths + 인증 게이트 미들웨어 팩토리 |

- 기본 `basePath`: `/api/auth` (node 어댑터 `/auth`와 구분)
- `next >= 14.0.0` peerDependency (optional)
