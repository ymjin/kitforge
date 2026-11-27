# @ymjin/auth

Framework-agnostic OAuth 2.0 + PKCE 소셜 로그인 라이브러리.  
Google · Kakao · Naver · Apple 지원. Node.js / Next.js / React(SPA) / React Native / Vercel 어댑터 포함.

---

## 지원 Provider

| Provider | 상태 |
|----------|------|
| Google   | ✅ |
| Kakao    | ✅ |
| Naver    | ✅ |
| Naver Works (LINE WORKS) | ✅ |
| Apple    | ✅ |

---

## 패키지 구조

```
@ymjin/auth           ← 저수준 OAuth 코어 (createAuthorizationUrl 등)
@ymjin/auth/providers ← Google / Kakao / Naver / Apple provider 팩토리
@ymjin/auth/node      ← Node.js HTTP 서버 어댑터 (createKitforgeAuth)
@ymjin/auth/next      ← Next.js App Router 어댑터
@ymjin/auth/react     ← React SPA 훅 (KitforgeProvider / useSession / useSignIn)
@ymjin/auth/vercel    ← Vercel Functions 어댑터
@ymjin/auth/native    ← React Native / Expo 어댑터
@ymjin/auth/adapters  ← DB 어댑터 (SupabaseAdapter / SupabaseSessionStore)
```

---

## 설치

```bash
npm install @ymjin/auth
```

---

## 아키텍처 패턴: 공유 인증 서버

여러 서비스가 하나의 인증 서버를 공유하는 방식을 권장합니다.

```
[service-a.example.com]  [service-b.example.com]
          ↓                        ↓
    https://auth.example.com/auth/signin/google
          ↓
  [auth-server]  ← @ymjin/auth/node
          ↓
  DB (kf_users 공통 계정 풀)
          ↓
  Domain=.example.com 쿠키 → SSO
```

**장점**: 소셜 로그인 구현을 한 곳에서 관리, 서브도메인 간 SSO 자동 적용.

---

## 1. 인증 서버 구성 (Node.js / AWS Lambda)

### 설치

```bash
npm install @ymjin/auth @supabase/supabase-js
```

### 기본 설정

```ts
// src/auth.ts
import { createKitforgeAuth } from "@ymjin/auth/node";
import { Google, Kakao, Naver, NaverWorks, Apple } from "@ymjin/auth/providers";
import { SupabaseAdapter, SupabaseSessionStore } from "@ymjin/auth/adapters";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 키가 없는 provider는 자동으로 비활성화됩니다
const providers = [
  process.env.GOOGLE_CLIENT_ID && Google({
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  process.env.KAKAO_CLIENT_ID && Kakao({
    clientId:     process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
  }),
  process.env.NAVER_CLIENT_ID && Naver({
    clientId:     process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET!,
  }),
  process.env.NAVER_WORKS_CLIENT_ID && NaverWorks({
    clientId:     process.env.NAVER_WORKS_CLIENT_ID,
    clientSecret: process.env.NAVER_WORKS_CLIENT_SECRET!,
  }),
  process.env.APPLE_CLIENT_ID && Apple({
    clientId:   process.env.APPLE_CLIENT_ID,
    teamId:     process.env.APPLE_TEAM_ID!,
    keyId:      process.env.APPLE_KEY_ID!,
    privateKey: process.env.APPLE_PRIVATE_KEY!,
  }),
].filter(Boolean) as ReturnType<typeof Google>[];

export const auth = createKitforgeAuth({
  providers,
  secret:   process.env.AUTH_SECRET!,   // openssl rand -base64 32
  baseUrl:  process.env.AUTH_URL!,      // https://auth.example.com
  basePath: "/auth",

  // SSO: *.example.com 서브도메인 간 세션 공유
  cookieDomain: process.env.COOKIE_DOMAIN, // .example.com

  // 멀티테넌트: 허용할 서비스 도메인
  allowedOrigins:      ["https://service-a.example.com", "https://service-b.example.com"],
  allowedRedirectUris: ["https://service-a.example.com", "https://service-b.example.com"],

  adapter:      SupabaseAdapter(supabase),
  sessionStore: SupabaseSessionStore(supabase),
});
```

### 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/auth/signin/:provider` | OAuth 리다이렉트 (`?redirectTo=` 지원) |
| GET | `/auth/callback/:provider` | 토큰 교환 + 세션 쿠키 설정 |
| GET | `/auth/session` | 현재 세션 JSON (미로그인 시 `null` + 200) |
| POST | `/auth/signout` | 세션 삭제 |
| POST | `/auth/account/delete` | 계정 삭제 + 세션 무효화 |

### Express / Node.js HTTP 서버

```ts
import { createServer } from "http";
import { auth } from "./auth.js";

createServer(async (req, res) => {
  const request = await toRequest(req); // Request 변환 필요
  const response = await auth.handle(request);
  if (!response) { res.writeHead(404); res.end(); return; }
  // Response → ServerResponse 변환
}).listen(3000);
```

### AWS Lambda (API Gateway HTTP API v2)

```ts
// src/handler.ts
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { auth } from "./auth.js";

export async function handler(event: APIGatewayProxyEventV2) {
  // named stage (prod 등)는 rawPath에 stage prefix 포함 → 제거 필요
  const { requestContext: { http, stage }, rawPath, rawQueryString, headers, body, isBase64Encoded } = event;
  const stagePath = stage && stage !== "$default" ? `/${stage}` : "";
  const path = stagePath && rawPath.startsWith(stagePath) ? rawPath.slice(stagePath.length) || "/" : rawPath;

  const baseUrl = process.env.AUTH_URL ?? "https://auth.example.com";
  const url = rawQueryString ? `${baseUrl}${path}?${rawQueryString}` : `${baseUrl}${path}`;
  const requestBody = body != null ? (isBase64Encoded ? Buffer.from(body, "base64") : body) : undefined;

  const request = new Request(url, {
    method: http.method,
    headers: headers as HeadersInit,
    body: ["GET", "HEAD"].includes(http.method) ? undefined : requestBody,
  });

  const response = await auth.handle(request);
  if (!response) return { statusCode: 404, body: "Not Found" };

  const cookies: string[] = [];
  const resHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") cookies.push(value);
    else resHeaders[key] = value;
  });

  return { statusCode: response.status, headers: resHeaders, cookies, body: await response.text() };
}
```

---

## 2. React SPA에서 사용하기

> **⚠️ `KitforgeProvider` 없이 `useSession` / `useSignIn` / `useSignOut`을 호출하면 런타임 에러가 발생합니다.**  
> 반드시 앱 최상위에 `KitforgeProvider`를 감싸야 합니다.

### App.tsx — KitforgeProvider 설정

```tsx
// src/app/App.tsx (또는 main.tsx)
import { KitforgeProvider } from "@ymjin/auth/react";

// 공유 인증 서버 URL — 환경변수로 주입, 없으면 기본값 사용
const AUTH_BASE = import.meta.env.VITE_AUTH_URL ?? "https://auth.example.com";

export default function App() {
  return (
    <KitforgeProvider basePath={`${AUTH_BASE}/auth`}>
      {/* 앱 전체를 감싸야 함 */}
      <RouterProvider router={router} />
    </KitforgeProvider>
  );
}
```

**`basePath` 설정 가이드:**

| 상황 | basePath 값 |
|------|-------------|
| 공유 인증 서버 (권장) | `https://auth.example.com/auth` |
| 같은 서버에 auth 내장 | `/auth` (기본값) |
| Next.js (`/api/auth`) | `/api/auth` |

### 환경변수 설정

```env
# .env.local (로컬 개발)
VITE_AUTH_URL=https://auth.example.com   # 프로덕션 서버 직접 사용
# 또는 로컬 서버 사용 시:
# VITE_AUTH_URL=                         # 비워두고 vite proxy 사용

# Amplify / Vercel 등 배포 환경
# VITE_AUTH_URL 설정 불필요 — 기본값(https://auth.example.com)이 자동 적용
```

### Vite proxy → 공유 인증 서버 전환 방법

기존에 vite proxy(`/auth` → localhost)를 쓰던 프로젝트를 공유 인증 서버로 전환하는 경우:

**1. `App.tsx`에 `KitforgeProvider` 추가** (위 코드 참고)

**2. `vite.config.ts` — 로컬 개발 시 proxy 유지 (선택)**

```ts
// 로컬에서도 프로덕션 auth 서버를 직접 쓰려면 proxy 제거
// 로컬 auth 서버를 띄워서 쓰려면 proxy 유지
export default defineConfig({
  server: {
    proxy: {
      "/auth": "http://localhost:3000",
    },
  },
});
```

**3. 배포 환경 환경변수** — `VITE_AUTH_URL` 미설정 시 기본값(`https://auth.example.com`) 사용.  
Amplify / Vercel 환경변수 패널에 별도 추가 불필요.

### 로그인 버튼

```tsx
import { useSignIn } from "@ymjin/auth/react";

function LoginButton() {
  const signIn = useSignIn();

  return (
    <button onClick={() => signIn("google", { redirectTo: "/dashboard" })}>
      Google로 로그인
    </button>
  );
}
```

### 세션 확인

```tsx
import { useSession } from "@ymjin/auth/react";

function Header() {
  const { session, status } = useSession();

  if (status === "loading") return <div>로딩 중...</div>;
  if (!session) return <a href="/login">로그인</a>;

  return <span>{session.user.name}</span>;
}
```

### 로그아웃

```tsx
import { useSignOut } from "@ymjin/auth/react";

function LogoutButton() {
  const signOut = useSignOut();
  return <button onClick={() => signOut({ redirectTo: "/" })}>로그아웃</button>;
}
```

### 회원 탈퇴

```tsx
import { useDeleteAccount } from "@ymjin/auth/react";

function DeleteAccountButton() {
  const { deleteAccount, isLoading, error } = useDeleteAccount();

  async function handleDelete() {
    if (!confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    await deleteAccount({ redirectTo: "/" });
  }

  return (
    <>
      <button onClick={handleDelete} disabled={isLoading}>
        {isLoading ? "처리 중..." : "회원 탈퇴"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </>
  );
}
```

서버 측에서 `onDeleteAccount` 훅으로 서비스별 데이터를 정리할 수 있습니다:

```ts
export const auth = createKitforgeAuth({
  // ...
  async onDeleteAccount(userId) {
    // 서비스 고유 데이터 삭제 (kf_users 삭제 전에 호출됨)
    await supabase.from("profiles").delete().eq("id", userId);
  },
});
```

**삭제 순서**: `onDeleteAccount` (서비스 정리) → `adapter.deleteAccount` (kf_users 삭제 → ON DELETE CASCADE로 kf_accounts, kf_sessions 자동 삭제) → 세션 쿠키 무효화

### Vite 로컬 개발 설정

로컬 개발 시 CORS 없이 proxy를 사용할 수 있습니다:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/auth": "http://localhost:3000", // 로컬 auth 서버
    },
  },
});
```

프로덕션에서는 `VITE_AUTH_URL=https://auth.example.com` 환경변수로 직접 호출합니다.

---

## 3. Next.js App Router

```ts
// app/api/auth/[...kitforge]/route.ts
import { createNextAuth } from "@ymjin/auth/next";
import { Google } from "@ymjin/auth/providers";

const { handlers } = createNextAuth({
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID! })],
  secret: process.env.AUTH_SECRET!,
  baseUrl: process.env.NEXTAUTH_URL!,
});

export const { GET, POST } = handlers;
```

---

## 4. Vercel Functions

```ts
// api/auth/[...path].ts
import { createVercelAuth } from "@ymjin/auth/vercel";
import { Google } from "@ymjin/auth/providers";

const { handler } = createVercelAuth({
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID! })],
  secret: process.env.AUTH_SECRET!,
});

export default handler;
```

---

## 5. Naver Works (LINE WORKS) provider

Naver Works 조직 계정으로 로그인하는 provider입니다. 일반 네이버 로그인(`Naver`)과 별개입니다.

### Naver Works Developer Console 설정

1. [dev.worksmobile.com](https://dev.worksmobile.com) → 앱 생성
2. OAuth Scope: `user.read`
3. Redirect URI: `https://auth.example.com/auth/callback/naver-works`

### 인증 서버 설정

```ts
import { NaverWorks } from "@ymjin/auth/providers";

const providers = [
  process.env.NAVER_WORKS_CLIENT_ID && NaverWorks({
    clientId:     process.env.NAVER_WORKS_CLIENT_ID,
    clientSecret: process.env.NAVER_WORKS_CLIENT_SECRET!,
    // 기본 scope: ["user.read"] — 필요 시 override
    // scopes: ["user.read"],
  }),
].filter(Boolean);
```

### 로그인 URL

```
GET https://auth.example.com/auth/signin/naver-works
GET https://auth.example.com/auth/signin/naver-works?redirectTo=https://service.example.com
```

### 환경변수

```env
NAVER_WORKS_CLIENT_ID=
NAVER_WORKS_CLIENT_SECRET=
```

> **참고**: Naver Works Drive 연동이 필요하면 [`@ymjin/naver-works`](../naver-works/README.md) 패키지를 함께 사용하세요.

---

## 6. Supabase 어댑터

### DB 스키마

```sql
-- packages/auth/src/adapters/schema.sql 참조
CREATE TABLE kf_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE kf_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES kf_users(id) ON DELETE CASCADE,
  session_token  text UNIQUE NOT NULL,
  expires        timestamptz NOT NULL
);
```

### 서비스별 profiles 테이블 자동 upsert

```ts
SupabaseAdapter(supabase, {
  profilesTable: "profiles", // 로그인 시 자동으로 upsert
})
```

로그인 성공 시 `{ id, email, name, avatar_url, updated_at }`를 profiles 테이블에 upsert합니다.  
서비스별 추가 컬럼(is_admin, role 등)은 별도로 관리하세요.

### 스키마 검증

```ts
import { checkSchema } from "@ymjin/auth/adapters";

const issues = await checkSchema(supabase, { profilesTable: "profiles" });
if (issues.length) console.warn("Schema issues:", issues);
```

---

## 7. NeonDB 어댑터

Supabase 대신 [NeonDB](https://neon.tech) (서버리스 Postgres)를 사용하는 어댑터입니다.  
NeonDB는 프로젝트 수 제한 없이 용량 기반 과금이라 인증 전용 DB로 적합합니다.

### 설치

```bash
npm install @ymjin/auth @neondatabase/serverless
```

### DB 스키마 적용

```bash
# packages/auth/dist/adapters/schema.sql 또는 neon-schema.sql 참고
psql $DATABASE_URL < node_modules/@ymjin/auth/dist/adapters/schema.sql
```

### 설정

```ts
import { createKitforgeAuth } from "@ymjin/auth/node";
import { NeonAdapter, NeonSessionStore } from "@ymjin/auth/adapters";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export const auth = createKitforgeAuth({
  providers,
  secret:   process.env.AUTH_SECRET!,
  baseUrl:  process.env.AUTH_URL!,
  adapter:      NeonAdapter(sql),
  sessionStore: NeonSessionStore(sql),
});
```

### Supabase 어댑터와 비교

| | SupabaseAdapter | NeonAdapter |
|---|---|---|
| **패키지** | `@supabase/supabase-js` | `@neondatabase/serverless` |
| **연결 방식** | REST API | HTTP (서버리스 최적화) |
| **환경변수** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `DATABASE_URL` |
| **적합한 용도** | 서비스 DB 겸용 | 인증 전용 경량 DB |

### NeonDB 연결 문자열

```env
DATABASE_URL=postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Webhook 설정 (계정 이벤트 발송)

계정 생성/수정/삭제 시 서비스로 webhook을 발송합니다.

```ts
export const auth = createKitforgeAuth({
  // ...
  webhooks: {
    urls:   ["https://service.example.com/webhook/auth"],
    secret: process.env.WEBHOOK_SECRET!, // openssl rand -base64 32
    // events: ["account.created", "account.updated", "account.deleted"], // 기본: 전체
  },
});
```

**Webhook 페이로드:**

```json
{
  "event": "account.deleted",
  "userId": "uuid",
  "user": { "id": "uuid", "provider": "google", "email": "user@example.com", "name": "홍길동" },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

**서명 검증** (`X-Kitforge-Signature: sha256=<hmac>`, `X-Kitforge-Timestamp`):

```ts
// 수신 측 서명 검증 예시
async function verifyWebhook(body: string, signature: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return signature === `sha256=${hex}`;
}
```

**실패 처리**: webhook 발송 실패 시 `kf_webhook_failures` 테이블에 기록하고 `{ ok: true, warning: "..." }` 응답을 반환합니다. 관리자가 실패 내역을 확인 후 수동 처리할 수 있습니다.

---

## 환경변수 참고

```env
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_URL=https://auth.example.com
COOKIE_DOMAIN=.example.com      # SSO용 (서브도메인 공유)

ALLOWED_ORIGINS=https://service-a.example.com,https://service-b.example.com
ALLOWED_REDIRECT_URIS=https://service-a.example.com,https://service-b.example.com

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

---

## 보안

- **시크릿은 라이브러리에 없습니다.** `clientSecret`은 항상 소비자의 `.env`에서 주입.
- `allowedRedirectUris` 설정으로 오픈 리다이렉트 공격 방지.
- 세션 쿠키는 `HttpOnly; Secure; SameSite=Lax` (크로스 오리진 시 `SameSite=None`).
- PKCE(Proof Key for Code Exchange)로 인가 코드 가로채기 방지.
