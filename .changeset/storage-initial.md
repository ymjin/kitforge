---
"@kitforge/storage": minor
---

Add `@kitforge/storage` — one object-storage interface, many backends.

공통 `StorageProvider` 인터페이스(put · get · delete · exists · list ·
getSignedUrl · getPublicUrl) 위에 provider별 구현을 제공합니다. 호출부는
provider 교체와 무관하게 동일합니다.

**Providers** (`@kitforge/storage/providers`):
- `GoogleCloudStorage(bucket)` — `@google-cloud/storage` Bucket 주입
- `S3Storage({ client, bucket })` — `@aws-sdk/client-s3` 주입 (R2·MinIO 등 호환)
- `NaverCloudObjectStorage({ client, bucket })` — 네이버 클라우드 Object Storage (S3 호환 프리셋)
- `SupabaseStorage(client, bucket)` — `@supabase/supabase-js` 주입
- `LocalStorage({ baseDir })` — 로컬 디스크 (Node, path traversal 방어)
- `MemoryStorage()` — 개발·테스트

**특징**:
- 서버 CRUD + Signed URL (GET 다운로드 / PUT 클라이언트 직업로드) 모두 지원
- provider SDK는 소비자가 client 주입 → kitforge가 SDK 미번들, 시크릿 미보유
- AWS SDK는 동적 import + optional peerDependency (S3 미사용 시 설치 불필요)
- body 정규화(string·Uint8Array·ArrayBuffer·Blob) + 확장자 기반 content-type 추론

51개 스모크 테스트 통과 (Memory·Local 실제 디스크·Supabase/GCS mock·S3 public URL/에러 경로).
