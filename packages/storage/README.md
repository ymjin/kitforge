# @ymjin/storage

One object-storage interface for many backends. Swap providers without touching
call sites.

| Provider | Factory | Notes |
|----------|---------|-------|
| Google Cloud Storage | `GoogleCloudStorage(bucket)` | pass a `@google-cloud/storage` Bucket |
| AWS S3 | `S3Storage({ client, bucket })` | pass an `@aws-sdk/client-s3` client |
| Naver Cloud Object Storage | `NaverCloudObjectStorage({ client, bucket })` | S3-compatible preset |
| Supabase Storage | `SupabaseStorage(client, bucket)` | pass a `@supabase/supabase-js` client |
| Local disk | `LocalStorage({ baseDir })` | Node-only, dev/self-host |
| In-memory | `MemoryStorage()` | tests & demos |

## Design

Every provider implements the same `StorageProvider` contract:

```ts
interface StorageProvider {
  put(key, body, options?): Promise<StorageObject>;
  get(key): Promise<Uint8Array>;
  delete(key): Promise<void>;
  exists(key): Promise<boolean>;
  list(prefix?, options?): Promise<StorageObject[]>;
  getSignedUrl(key, options?): Promise<string>;   // GET (download) or PUT (direct upload)
  getPublicUrl(key): string;
}
```

You inject your own provider SDK client (created with your credentials), so
kitforge never bundles a cloud SDK and never holds your secrets.

## Usage

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { S3Storage } from "@ymjin/storage/providers";
import type { StorageProvider } from "@ymjin/storage";

const storage: StorageProvider = S3Storage({
  client: new S3Client({ region: "ap-northeast-2" }),
  bucket: "uploads",
});

// Server upload / download
await storage.put("docs/readme.txt", "hello", { contentType: "text/plain" });
const bytes = await storage.get("docs/readme.txt");

// Signed download link (1 hour)
const url = await storage.getSignedUrl("docs/readme.txt", { expiresIn: 3600 });

// Direct client-to-storage upload (no bytes through your server)
const putUrl = await storage.getSignedUrl("incoming/big.zip", {
  method: "PUT",
  expiresIn: 300,
  contentType: "application/zip",
});
```

## S3 peer dependencies

The S3 provider loads the AWS SDK dynamically. Install in your app only if you
use it:

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Note on "NAVER WORKS"

NAVER WORKS is a groupware suite, not object storage. For Naver file storage use
**Naver Cloud Platform Object Storage** (S3-compatible) via
`NaverCloudObjectStorage`.
