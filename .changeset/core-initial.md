---
"@ymjin/core": minor
---

`@ymjin/core` 첫 릴리스입니다. 플랫폼 중립(Node · 브라우저 · edge · Hermes) 유틸을 담았습니다.

- `date`: KST(UTC+9) 표시를 위한 `formatKst` 패턴과 프리셋, `todayKst`, `kstDayRange`, `addDays`, `shiftMonth`, `daysUntil`, `formatRelative`, `parseKstDateTime`. 오프셋 없는 일시는 `toDate`/`formatKst`에서 UTC로 읽고, 폼 입력값은 `parseKstDateTime`으로 KST로 읽습니다.
- `number`: 로케일과 무관한 `formatNumber`(기본 소수 3자리, `toLocaleString`과 같음), `won`, `shortWon`, `formatAmountInput`/`parseAmountInput`, `formatBytes`.
- `rate-limit`: `createRateLimiter` + `RateStore` 어댑터(`memoryStore` · `firestoreRateStore` · `sqlRateStore`), `hashKeys`(SHA-256), 단계별 대기 `backoffVerdict`, `clientIp`(Fetch Request와 Node 헤더 모두 지원).
- `id`: `newId`(UUID v4, Hermes 대체 경로 포함), `nowIso`.

원천: gongbang · perk_step · dadeum · ohguohgu · review77 · gabo-ham의 중복 구현.
