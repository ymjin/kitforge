---
"@kitforge/auth": minor
---

Add external storage — `@kitforge/auth/adapters` (DB adapter + session store).

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

**구현체** (`@kitforge/auth/adapters`):
- `InMemoryAdapter` / `InMemorySessionStore` — 개발·테스트·데모
- `SupabaseAdapter` / `SupabaseSessionStore` — 프로덕션 (소비자가 client 주입, SDK 미번들)
- `@kitforge/auth/adapters/schema.sql` — Supabase 테이블 스키마 (RLS 포함)

**core 추가** (하위 호환):
- `AuthAdapter`, `AdapterUser`, `AdapterAccount`, `SessionStore`, `SessionUser` 인터페이스 (`@kitforge/auth`에서 import 가능)
- `KitforgeAuthConfig.adapter`, `KitforgeAuthConfig.sessionStore` 옵션
- `KitforgeAuth.getSessionByCookieValue()`, `deleteStoredSession()` — Next.js 어댑터 연동
- Next.js `auth()` / `signOut()`가 세션 스토어 인지하도록 갱신
