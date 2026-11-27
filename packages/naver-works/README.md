# @ymjin/naver-works

Naver Works (LINE WORKS) OAuth 토큰 관리 및 Drive API 라이브러리.

## 설치

```bash
npm install @ymjin/naver-works
```

## 구조

| 서브패스 | 내용 |
|----------|------|
| `@ymjin/naver-works` | 전체 re-export |
| `@ymjin/naver-works/token` | OAuth 토큰 갱신, 서비스 계정 JWT 발급 |
| `@ymjin/naver-works/drive` | 파일 업로드/다운로드/삭제, 폴더 생성/목록 |

---

## 1. 토큰 관리

### TokenAdapter 구현

라이브러리는 토큰 저장 위치를 강제하지 않습니다. 앱에서 `NaverWorksTokenAdapter`를 구현해서 주입합니다.

```ts
import type { NaverWorksTokenAdapter, StoredToken } from "@ymjin/naver-works/token"

// 예: Supabase 기반 adapter
const adapter: NaverWorksTokenAdapter = {
  async getToken(userId) {
    const { data } = await supabase
      .from("naver_tokens")
      .select("access_token, refresh_token, id_token, expires_at")
      .eq("user_id", userId)
      .single()
    if (!data) return null
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresAt: data.expires_at,
    }
  },

  async saveToken(userId, token) {
    await supabase.from("naver_tokens").upsert({
      user_id: userId,
      access_token: token.accessToken,
      refresh_token: token.refreshToken ?? null,
      id_token: token.idToken ?? null,
      expires_at: token.expiresAt,
      updated_at: new Date().toISOString(),
    })
  },

  async clearToken(userId) {
    await supabase.from("naver_tokens").delete().eq("user_id", userId)
  },

  // 서비스 계정 토큰 캐시 (선택)
  async getSAToken() {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "sa_access_token")
      .single()
    const { data: expiry } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "sa_token_expires_at")
      .single()
    if (!data?.value || !expiry?.value) return null
    return { token: data.value, expiresAt: expiry.value }
  },

  async saveSAToken(token, expiresAt) {
    await supabase.from("system_settings").upsert({ key: "sa_access_token", value: token })
    await supabase.from("system_settings").upsert({ key: "sa_token_expires_at", value: expiresAt })
  },
}
```

### Config 구성

```ts
import type { NaverWorksConfig } from "@ymjin/naver-works/token"

const config: NaverWorksConfig = {
  clientId: process.env.NAVER_WORKS_CLIENT_ID!,
  clientSecret: process.env.NAVER_WORKS_CLIENT_SECRET!,

  // 서비스 계정 (봇·드라이브 관리자 작업용, 선택)
  serviceAccount: {
    id: process.env.NAVER_WORKS_SERVICE_ACCOUNT_ID!,
    privateKey: process.env.NAVER_WORKS_PRIVATE_KEY!, // PEM (\\n 이스케이프 허용)
    scopes: "bot,calendar,directory.read,user.read", // 기본값
  },
}
```

### OAuth 토큰 조회 (만료 시 자동 갱신)

```ts
import { getValidOAuthToken } from "@ymjin/naver-works/token"

const token = await getValidOAuthToken(userId, config, adapter)
if (!token) {
  // 토큰 없음 또는 갱신 실패 → 재로그인 유도
}
```

### 서비스 계정 토큰 조회

```ts
import { getServiceAccountToken } from "@ymjin/naver-works/token"

const token = await getServiceAccountToken(config, adapter)
if (!token) {
  // 서비스 계정 설정 누락 또는 발급 실패
}
```

---

## 2. Drive API

모든 드라이브 함수는 `token` (string) 을 첫 번째 인자로 받습니다.  
`getValidOAuthToken` 또는 `getServiceAccountToken`으로 토큰을 먼저 조회한 뒤 전달하세요.

### driveType

| 값 | 설명 |
|----|------|
| `"personal"` | 내 드라이브 (기본값) |
| `"shared"` | 공유 드라이브 (`sharedDriveId` 필요) |

### 파일 업로드

```ts
import { uploadFile } from "@ymjin/naver-works/drive"

const fileId = await uploadFile(
  token,
  buffer,          // Buffer | Uint8Array
  "report.pdf",    // 파일명
  parentFolderId,  // 업로드할 폴더 ID ("root" 가능)
  "personal",      // driveType
)
```

### 파일 다운로드 URL 조회

```ts
import { getDownloadUrl } from "@ymjin/naver-works/drive"

const url = await getDownloadUrl(token, fileId)
```

### 파일 삭제

```ts
import { deleteFile } from "@ymjin/naver-works/drive"

await deleteFile(token, fileId)
```

### 파일 목록 조회

```ts
import { listFiles } from "@ymjin/naver-works/drive"

const files = await listFiles(token, folderId)
// files: DriveFile[]
// { fileId, fileName, fileSize, mimeType, createdTime, modifiedTime, downloadUrl }
```

### 폴더 생성 (이미 존재하면 기존 ID 반환)

```ts
import { createFolder } from "@ymjin/naver-works/drive"

const folderId = await createFolder(
  token,
  "2026-프로젝트",  // 폴더명
  "root",           // 부모 폴더 ID
  "shared",         // driveType
  sharedDriveId,    // 공유 드라이브 ID (shared일 때 필요)
)
```

### 폴더 이름으로 검색

```ts
import { findFolderByName } from "@ymjin/naver-works/drive"

const folderId = await findFolderByName(token, "2026-프로젝트", parentFolderId)
// 없으면 null 반환
```

### 폴더 목록 조회

```ts
import { listFolders } from "@ymjin/naver-works/drive"

const folders = await listFolders(token, parentFolderId)
// folders: DriveFolder[]
// { folderId, folderName, parentFolderId }
```

---

## 3. 에러 처리

```ts
import {
  NaverWorksAuthError,
  NaverWorksDriveError,
  isNaverWorksAuthError,
} from "@ymjin/naver-works/drive"

try {
  await uploadFile(token, buffer, "file.pdf", folderId)
} catch (err) {
  if (isNaverWorksAuthError(err)) {
    // 토큰 만료 → 재로그인 유도
  } else if (err instanceof NaverWorksDriveError) {
    console.error(err.status, err.body)
  }
}
```

---

## 환경변수 목록

| 변수 | 필수 | 설명 |
|------|------|------|
| `NAVER_WORKS_CLIENT_ID` | ✓ | Naver Works 앱 Client ID |
| `NAVER_WORKS_CLIENT_SECRET` | ✓ | Naver Works 앱 Client Secret |
| `NAVER_WORKS_SERVICE_ACCOUNT_ID` | 선택 | 서비스 계정 ID |
| `NAVER_WORKS_PRIVATE_KEY` | 선택 | 서비스 계정 RSA Private Key (PEM) |
