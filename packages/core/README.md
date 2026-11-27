# @ymjin/core

kitforge 서비스들이 함께 쓰는 **플랫폼 중립 유틸**입니다. KST 날짜, 숫자와 원 단위 표시, 레이트 리밋, ID를 담았습니다.
Node, 브라우저, edge, React Native(Hermes)에서 똑같이 동작합니다. Node 전용 API와 `Intl` 로케일 포맷은 쓰지 않습니다.

```bash
npm i @ymjin/core
```

| 서브패스 | 내용 |
|---|---|
| `@ymjin/core/date` | KST 표시(`formatKst` 패턴, 프리셋), 날짜 경계(`kstDayRange`), `todayKst`, `daysUntil`, `formatRelative` |
| `@ymjin/core/number` | `formatNumber`, `won`, `shortWon`, 금액 입력(`formatAmountInput` / `parseAmountInput`), `formatBytes` |
| `@ymjin/core/rate-limit` | `createRateLimiter` + `RateStore`, 저장소 `memoryStore` · `firestoreRateStore` · `sqlRateStore`, 단계별 대기(`backoffVerdict`), `clientIp` |
| `@ymjin/core/id` | `newId()`(UUID v4, Hermes 대체 경로 포함), `nowIso()` |

루트 `@ymjin/core`에서 모두 가져올 수도 있습니다.

## date — KST 고정

KST는 서머타임이 없는 UTC+9 고정입니다. 그래서 `toLocaleString` 대신 오프셋 계산으로 그립니다.
서버(UTC)와 브라우저와 앱의 출력이 글자 하나까지 같고, 하이드레이션 불일치나 자정 근처에서 날짜가 하루 어긋나는 문제가 생기지 않습니다.

```ts
import { formatKst, formatKstDate, formatKstDateTime, todayKst, kstDayRange, formatRelative } from "@ymjin/core/date";

formatKstDate("2026-11-03T06:04:05Z");               // "2026.11.03"
formatKstDateTime(row.created_at);                    // "2026.11.03 15:04"
formatKst(v, "yyyy.MM.dd (E) a h:mm");                // "2026.11.03 (화) 오후 3:04"
formatKst(v, "M/d");                                  // "11/3"
todayKst();                                           // "2026-11-03"
const { start, end } = kstDayRange(new Date());       // 오늘(KST) [00:00, 다음날 00:00)
formatRelative(post.createdAt);                       // "5분 전"
```

- 패턴 토큰: `yyyy yy MM M dd d HH H hh h mm m ss s E EEEE a`. 작은따옴표 안의 글자는 그대로 나옵니다(`H'시'`).
- 시간대 표기 없는 일시(`2026-11-02T15:30:00`)는 **UTC로 읽습니다.** DB가 UTC를 오프셋 없이 줄 때 9시간 어긋나지 않게 하려는 것입니다.
- 표시 함수는 `null`, `undefined`, 잘못된 값에 `''`를 돌려줍니다.
- 사용자가 한국 시각으로 입력한 값(`<input type="datetime-local">` 등)은 `parseKstDateTime("2026-11-03T09:00")`으로 읽습니다. 오프셋 없는 문자열을 KST 벽시계 시각으로 해석합니다.

## number

```ts
import { formatNumber, won, shortWon, formatAmountInput, parseAmountInput, formatBytes } from "@ymjin/core/number";

formatNumber(20000);          // "20,000"   (로케일과 무관)
formatNumber(1234.567, 2);    // "1,234.57"
won(12345);                   // "12,345원"
shortWon(123456);             // "12.3만"
formatAmountInput("0012a345") // "12,345"  → parseAmountInput("12,345") === 12345
formatBytes(1536);            // "1.5 KB"
```

단위(P, 원 등)를 붙이는 위치가 문구마다 다르면 `formatNumber`만 쓰고 호출부에서 조립합니다.

## rate-limit

저장소는 강제하지 않습니다. `RateStore.increment`를 구현해 주입합니다(Firestore 트랜잭션, Postgres upsert, Redis INCR 등).

```ts
import { createRateLimiter, memoryStore, clientIp } from "@ymjin/core/rate-limit";

const limiter = createRateLimiter({ store: memoryStore(), hashKeys: true });
const SEARCH = { name: "search-ip", max: 30, windowMs: 60_000 };

export async function GET(req: Request) {
  const v = await limiter.check(SEARCH, clientIp(req));
  if (!v.allowed) return new Response("Too Many Requests", { status: 429, headers: { "Retry-After": String(v.retryAfter) } });
  // ...
}
```

저장소 어댑터는 키트가 제공합니다. DB SDK를 의존성으로 두지 않고 필요한 메서드만 구조적 타입으로 받습니다.

```ts
import { createRateLimiter, firestoreRateStore, sqlRateStore, rateLimitTableSql } from "@ymjin/core/rate-limit";

// Firestore — 문서 { count, window_start, expire_at } (expire_at에 TTL 정책을 걸면 지난 창이 지워짐)
const limiter = createRateLimiter({ store: firestoreRateStore(db), hashKeys: true });

// Postgres — 한 문장 upsert로 원자적으로 셉니다. 테이블은 rateLimitTableSql()을 마이그레이션에 넣습니다.
const sqlStore = sqlRateStore((text, params) => sql.query(text, params));            // Neon
// sqlRateStore((t, p) => sqlPg.unsafe(t, p))                                        // postgres.js
// sqlRateStore((t, p) => pool.query(t, p).then((r) => r.rows))                     // pg
// sqlRateStore((t, p) => prisma.$queryRawUnsafe(t, ...p))                          // Prisma
```

- `firestoreRateStore` + `hashKeys: true`의 문서 ID는 review77의 기존 `rate_limits` 키와 같습니다. 바꿔도 기존 창이 이어집니다.
- `hashKeys: true`로 두면 이메일이나 IP 원문 대신 SHA-256을 저장합니다(Web Crypto 사용).
- `memoryStore`는 인스턴스 메모리에만 기록합니다. 서버리스에서는 인스턴스마다 따로 세므로, 요청이 한 곳에 몰리는 것을 늦추는 용도로만 쓰세요.
- 로그인 실패처럼 **잠그지 않고 점점 오래 기다리게** 하려면 `backoffVerdict(fails, lastFailAt, now)`를 씁니다. 기본값은 5회째 1분, 10회째 5분, 15회째 10분, 20회째 이후 1시간입니다. `formatWait(retryAfter)`는 안내 문구용입니다.
- 대기는 `sleep`으로 처리하지 말고 `429 + Retry-After`로 응답합니다. 서버리스에서는 기다리는 시간도 실행 비용입니다.

## id

```ts
import { newId, nowIso } from "@ymjin/core/id";
newId(); // "3b241101-e2bb-4255-8caf-4136c566a962"
```

보안 토큰 용도가 아닙니다. 기기와 서버에서 겹치지 않는 이름이면 되는 곳에 쓰세요.
