# 공통화 로드맵 · 서비스 적용 프롬프트 (2026-11-27)

> 지원 대상 8개: **perk_step · review77(chilchil) · sigeumseok · skill · ohguohgu · dadeum · gabo-ham · gongbang**
> 순서: kitforge에서 패키지 작업 → 발행 → 아래 프롬프트를 **해당 서비스 저장소의 Claude 세션**에 붙여넣기.
> 모든 서비스에 `docs/workflows/reuse-kit.md`(CLAUDE.md §24)가 있으므로 프롬프트는 그 ②「기존 코드 교체」 게이트(스캔 → 파일별 리포트 → 승낙 → 배치 교체 + 변경분 테스트 → ADR·TC)를 그대로 탄다.
> `<버전>`은 발행 후 실제 버전으로 바꿔 넣는다. 파일 경로는 2026-11-27 기준 실측(ohguohgu·dadeum·gabo-ham·gongbang은 GitHub 최신 커밋 기준).

## 진행 원칙: web → native (2026-11-27 결정)

지원 서비스 8개 중 웹·서버가 대부분이라 **웹(W) 단계를 먼저 끝내고 네이티브(N) 단계로 넘어간다.**

- **W 단계**: Next·Vite 웹, Node 서버(ohguohgu `server/` 포함), Capacitor로 감싼 PWA(dadeum·gabo-ham — 웹 코드)
- **N 단계**: Expo RN 앱 — ohguohgu `mobile/`, perk_step `apps/mobile/` · `@ymjin/ui-native` 확장 · 실기기(EAS) 확인
- 순수 TS 패키지(`@ymjin/core` 등)는 W 단계에 만들되 RN에서 깨지지 않게(Intl만 · Node 전용 API 금지) 설계하고, RN 앱 **적용**은 N 단계에서 한다.
- perk_step `packages/domain`처럼 웹·모바일이 함께 쓰는 공유 패키지를 W 단계에 바꾸면, mobile은 **타입체크·단위 테스트만** 확인하고 기기 확인은 N 단계로 미룬다.

## 진행 원칙 2: 키트 선행 · 서비스 1회 반영 (2026-11-27 결정)

서비스 쪽 변경을 최소로 하려고 **웹 단계 패키지를 kitforge에서 먼저 모두 끝내고 한 번에 발행한 뒤, 서비스마다 PR 하나로 반영**한다.
패키지별로 서비스를 건드리면 7개 서비스에 5번씩, 35번이 되기 때문이다.

1. **shim 방식** — 서비스의 기존 파일(`lib/format.ts` 등)은 경로와 export 이름을 그대로 두고 **본문만 키트 호출로 바꾼다.** 호출부는 바뀌지 않는다.
   예: 공방은 `formatKstDate = (v) => formatKst(v, "yyyy. M. d.")`처럼 정의해 지금 화면 출력을 유지한다.
2. **DB 어댑터는 키트가 제공한다** — Firestore · Neon/postgres SQL 태그 · Supabase · Prisma. 구조적 타입만 써서 키트에 DB SDK 의존성이 생기지 않는다.
3. **출력이 같은지 키트에서 먼저 검증한다** — 서비스의 현재 구현과 키트 결과를 같은 입력으로 대조하는 테스트를 kitforge에 둔다. 서비스 세션은 그 결과(차이표)를 확인만 한다.
4. **기존 이름을 유지한다** — review77·dadeum이 쓰는 `gongbangRoute` · `gongbangGuard` · `ok/fail/serverError`, review77의 `LegalDoc` 타입, 공방의 `PushDeps` 구조, perk_step의 `confirmDialog()`를 키트가 같은 이름과 같은 모양으로 제공한다.

### kitforge 선행 작업

| 단계 | 패키지 | 서비스 변경을 줄이기 위해 키트에 넣을 것 | 상태 |
|---|---|---|---|
| K1 | `@ymjin/core` 보강 | 레이트 리밋 저장소(`firestoreRateStore` · `sqlRateStore` · `supabaseRateStore`), 서비스 현재 구현과의 출력 대조 테스트 | 진행 중 (PR #4) |
| K2 | `@ymjin/gongbang` | `gongbangRoute` 등 기존 이름 API, `gongbangKeysFromEnv(prefix)`(기존 env 이름 유지), 표준 엔드포인트 팩토리, Next · Lambda/Express 어댑터, 계약 테스트 `verifyGongbangContract`, 공방용 `createGongbangClient` | |
| K3 | `@ymjin/push` | `sendToTargets(payload, deps)`(공방 PushDeps 구조), `webPushSender` · `fcmSender`, `isDeadSubscription`, `SendSummary`, `/client` · `/capacitor` | |
| K4 | `@ymjin/account` | review77 `LegalDoc` 타입 그대로, 웹 렌더러, `ConsentGate`(perk_step API 유지 + 어댑터), 탈퇴 상태기계(순수 함수) | |
| K5 | `@ymjin/ui` 패턴 | `useConfirm()` + `confirmDialog()`/`<ConfirmHost/>` 둘 다, **토큰 브릿지 CSS**(서비스 브랜드 색 → `@ymjin/tokens` 변수) | |
| K6 | 기존 패키지 | `@ymjin/maps`가 skill `NaverMapEmbed` 용도를 감당하는지 확인 · 부족하면 보강 | |

K1~K4는 서로 독립적이다. K5는 화면이 바뀌므로 마지막에 하고, 서비스 반영도 선택으로 둔다(공방 관리자 화면부터).

## 적용 매트릭스

| 패키지 | perk_step | review77 | sigeumseok | skill | ohguohgu | dadeum | gabo-ham | gongbang |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| P0 kitforge 정리 (auth 0.4.0 · 잣대 표) | | | | ● | | | | |
| P1 `@ymjin/core` | ●(web) N | ● | | ○ | ●(server) N | ● | ● | ● |
| P2 `@ymjin/push` | | | | | ●(server) | ● | ● | ● |
| P3 `@ymjin/gongbang` | ● | ● | | ○ | ● | ● | ● | ●(client) |
| P4 `@ymjin/ui` 확장 | ●(web) | ● | ○ | ○ | | ● | ● | ● |
| P5 `@ymjin/account` | ●(web) N | ● | | ● | ●(server) N | ● | ● | |
| **N 단계** (RN 앱) | N | | | | N | | | |
| P6 기존 패키지 (maps · storage) | | | | ● | | | ● | |

● W 단계 적용 · N 네이티브 단계에서 추가 적용 · ○ 선택(효과 작음) · 빈칸 해당 없음

---

> 아래 P0~P6 · N0~N4의 패키지별 절은 **원천 코드와 교체 후보 경로 목록(참고용)**이다. 서비스에 실제로 붙여넣는 프롬프트는 맨 아래 「서비스 1회 반영 프롬프트」를 쓴다.

## P0. kitforge 정리 (선행)

**kitforge 작업**
1. 미커밋 `@ymjin/auth` 0.4.0 변경분 + `packages/naver-works/` 커밋 → changeset → 발행.
2. `CLAUDE.md` Layout에 naver-works 추가.
3. `@ymjin/ui-native` 설치 함정 근본 수정: `jsxImportSource: nativewind` 빌드 · datetimepicker/slider 서브패스 분리 (잣대 reuse-kit.md에 기록된 perk_step 실측 함정). → 코드는 PR #3에 포함, **실기기 확인과 perk_step 적용은 N0**.
4. 이후 패키지가 나올 때마다 **잣대(jatdae) reuse-kit 표**에 행 추가 — 서비스들은 템플릿 반입으로 표를 받는다.

**▶ 잣대(jatdae) 세션 프롬프트** — 새 패키지 발행 때마다
```
kitforge에 새 재사용 키트 패키지가 발행됐다: <패키지명>@<버전> — <한 줄 설명>.
docs/workflows/reuse-kit.md 패키지 표에 행을 추가하고(웹/RN 지원 · 설치 명령), CLAUDE.md §24 불변식의
대상 목록(UI·토큰·인증·스토리지·맵)에 해당 영역을 넣어줘. 템플릿 버전을 올리고 CHANGELOG·HISTORY에 기록.
반입 대상 프로젝트(fleet.json)에 PENDING으로 알릴 내용도 정리해줘.
```

**▶ skill 세션 프롬프트** — auth 0.4.0 발행 후
```
@ymjin/auth가 0.3.1 → 0.4.0으로 올라갔다(CHANGELOG: kitforge packages/auth/CHANGELOG.md).
이 저장소 CLAUDE.md §24 · docs/workflows/reuse-kit.md 절차로 업그레이드해줘.
대상: package.json, src/app/lib/auth.ts, src/app/components/{SnsLoginButtons,RequireAuth,RootLayout}.tsx,
src/app/pages/MyPage.tsx, server/auth-server.mjs.
먼저 0.3.1 → 0.4.0 breaking/동작 변화가 이 저장소에 미치는 영향을 파일별로 리포트하고 승낙 후 적용.
변경분 테스트 · HISTORY · 영향 TC 반영.
```

---

## P1. `@ymjin/core` — 포맷 · 레이트 리밋 · 소도구

**kitforge 작업**
- `@ymjin/core/format`: `formatKstDate · formatKstDateTime · formatKstTime · formatKstShort · todayKst · fmtRelative · fmtMonthDay`, 숫자 `fmtNumber · won · shortWon`, 금액 입력 `formatAmountInput`.
  - 원천: gongbang `lib/format.ts`(KST 고정), perk_step `packages/domain/src/format.ts`(원 단위), dadeum `lib/format.ts`(상대시간), ohguohgu `mobile/src/utils/format.ts`·`kst.ts`.
  - 타임존은 항상 `Asia/Seoul` 고정 · `date-fns` 의존 없이 `Intl`만 사용(RN·Electron 공용).
- `@ymjin/core/rate-limit`: `RateLimiter` + `RateStore` 어댑터(`memoryStore` 기본 제공) · `clientIp(request)` · `retryAfter`. Firestore/Supabase 저장소는 소비자가 어댑터 구현(naver-works TokenAdapter 패턴).
  - 원천: review77 `src/server/rate-limit.ts`(Firestore 창), gongbang `lib/auth/rate-limit.ts`(로그인 실패), perk_step `apps/web/src/lib/rateLimit.ts`.
- 기타: `newId()`, `nowIso()`.

**공통 프롬프트 머리말** (아래 각 서비스 프롬프트 앞에 붙는다고 보면 된다)
```
kitforge에 @ymjin/core@<버전>이 발행됐다(format: KST 날짜·숫자·원 / rate-limit: RateLimiter + RateStore 어댑터).
이 저장소 CLAUDE.md §24 · docs/workflows/reuse-kit.md ②「기존 코드 교체」 절차로 진행해줘 —
교체 후보 스캔 → 파일별 리포트(옵션 A/B/C, 출력 문자열이 달라지는 곳은 전/후 예시 표기) → 내 승낙 → 배치 교체 + 변경분 테스트 → ADR · 영향 TC · HISTORY.
값·동작을 지어내지 말고, 키트에 없는 서비스 전용 함수는 남겨 둔다.
```

**▶ perk_step**
```
[머리말] 교체 후보: packages/domain/src/format.ts(won·shortWon·todaySeoul·shortDate·formatAmountInput·newId·nowIso),
apps/web/src/lib/format.ts, apps/web/src/lib/rateLimit.ts(retryAfter·clientKey).
cardOptionLabel·shiftMonth·monthLabel 같은 도메인 함수는 packages/domain에 남긴다.
web·mobile 둘 다 domain을 거쳐 쓰므로 domain이 @ymjin/core를 re-export하는 방식(A)과 직접 import(B)를 비교해 리포트.
이번은 웹 단계 — apps/web과 packages/domain만 바꾸고, apps/mobile은 코드 수정 없이 타입체크·단위 테스트만 돌려 깨지지 않는지 확인. mobile 기기 확인은 네이티브 단계로 미룬다.
```

**▶ review77 (chilchil)**
```
[머리말] 교체 후보: src/server/rate-limit.ts(Limit·LIMITS·rateKey·hit — Firestore 창).
LIMITS 표와 Firestore 저장은 이 저장소에 남기고, 창 계산·키 생성만 @ymjin/core RateLimiter + Firestore RateStore 어댑터로 바꾼다.
화면·서버의 날짜 표시 중 KST 포맷을 손수 하는 곳이 있으면 함께 후보로 올려줘.
```

**▶ ohguohgu**
```
[머리말] 이번은 웹·서버 단계 — server만 대상: server/src/utils/format.ts, server/src/utils/kst.ts.
mobile(src/utils/format.ts · kst.ts)은 네이티브 단계에서 따로 한다 — 이번엔 건드리지 않는다.
server 변경분 테스트(vitest) 실행.
```

**▶ dadeum**
```
[머리말] 교체 후보: lib/format.ts(fmtDate·fmtMonthDay·fmtTime·fmtDateTime·fmtRelative·fmtNumber — 현재 date-fns).
date-fns 포맷 문자열(yyyy.MM.dd 등)과 키트 출력이 다르면 전/후 예시를 리포트에 표기하고, 화면 표기를 바꿀지 래퍼로 유지할지 옵션으로 제시.
교체 뒤 date-fns가 다른 곳에서 안 쓰이면 의존성 제거 후보로 올려줘.
```

**▶ gabo-ham**
```
[머리말] 교체 후보: src/lib/utils/format.ts 및 src/lib/utils 안의 날짜·숫자 포맷 함수.
storageLimits·uploadProgress 같은 도메인 유틸은 남긴다.
```

**▶ gongbang**
```
[머리말] 교체 후보: lib/format.ts(formatKstDate·formatKstDateTime·formatKstShort·formatKstTime·todayKst), lib/auth/rate-limit.ts(clientIp·checkLoginRate·recordLoginFailure·clearLoginFailures).
로그인 실패 기록 저장(Supabase)은 RateStore 어댑터로 이 저장소에 남긴다.
```

**▶ skill** (선택)
```
[머리말] 교체 후보: src/app/lib/date.ts. 효과가 작으면 「보류」 옵션도 리포트에 포함.
```

---

## P2. `@ymjin/push` — Web Push · FCM 발송과 구독 관리

**kitforge 작업**
- `@ymjin/push/server`: `sendWebPush(targets, payload)`(VAPID), `sendFcm(tokens, payload)`(firebase-admin peer), 공통 `PushPayload`·`SendSummary { targets, sent, removed, failed, overLimit }`, 만료 구독 판정(404/410 · FCM unregistered) → `onExpired` 콜백, `PUSH_STALE_DAYS` 정책 헬퍼.
  - 원천: gongbang `lib/services/push.ts`(SendSummary·MAX_PUSH_TARGETS), gabo-ham `src/lib/push/{web-push,fcm,subscriptionPolicy}.ts`, dadeum `lib/services/{webpush,fcm}.ts`·`lib/push-errors.ts`, ohguohgu `server/src/services/pushService.ts`.
- `@ymjin/push/client`(웹): `getPushSupport()`, `isIOSStandalone()`, `subscribeWebPush(vapidKey)` → 서버 저장 콜백.
  - 원천: gabo-ham `src/lib/push/client.ts`, dadeum `lib/push-subscribe.ts`·`lib/push-key.ts`.
- `@ymjin/push/capacitor`: `registerCapacitorFcm / unregisterCapacitorFcm`(`@capacitor-firebase/messaging` peer). 원천: gabo-ham `src/lib/push/capacitor-fcm.ts`.
- 구독·토큰 **저장은 소비자 어댑터**(Neon · Supabase · Prisma 각각).

**공통 프롬프트 머리말**
```
kitforge에 @ymjin/push@<버전>이 발행됐다(server: sendWebPush·sendFcm·SendSummary·만료 구독 처리 / client: 지원 판정·구독 / capacitor: FCM 등록).
구독 저장은 이 저장소 DB 어댑터로 남긴다. CLAUDE.md §24 · reuse-kit.md ② 절차(스캔 → 파일별 리포트 → 승낙 → 배치 교체 + 변경분 테스트 → ADR · TC · HISTORY).
발송 로그 형식·공방 연동 응답 형식이 바뀌면 반드시 리포트에 표기(공방 화면이 읽는다). 실제 기기 푸시 확인이 필요한 TC는 「기기 확인 필요」로 남긴다.
```

**▶ dadeum**
```
[머리말] 교체 후보: lib/services/webpush.ts, lib/services/fcm.ts, lib/push-errors.ts, lib/push-subscribe.ts, lib/push-key.ts,
components/settings/WebPushPermission.tsx, components/notification/PushNotificationManager.tsx(Capacitor 분기).
/api/gongbang/push·push-history·push-trend·cleanup-subscriptions 응답 형식은 유지.
```

**▶ gabo-ham**
```
[머리말] 교체 후보: src/lib/push/{web-push,fcm,firebase-admin,client,capacitor-fcm,subscriptionPolicy}.ts.
notify-family.ts(가족 단위 대상 선정)는 남기고 내부 발송만 키트로 바꾼다. PushPermissionBanner·AddToHomeCard는 P4에서 다룬다.
```

**▶ ohguohgu**
```
[머리말] 서버만 대상: server/src/services/pushService.ts(sendPush·sendPushWithLog·sendSilentPush), pushHealthService.ts.
silent push·최소 앱 버전(SILENT_PUSH_MIN_APP_VERSION) 같은 오구오구 전용 규칙은 남기고 FCM 발송·만료 토큰 처리만 키트로.
mobile(@react-native-firebase)은 네이티브 단계(N4) — 이번엔 건드리지 않는다.
```

**▶ gongbang**
```
[머리말] 교체 후보: lib/services/push.ts(SendSummary·PushPayload·MAX_PUSH_TARGETS·발송). 서비스별 push 화면
(components/{dadeum,gabo,ohguohgu,notifications}/Push*Client.tsx)이 쓰는 타입을 @ymjin/push 타입으로 통일할 수 있는지 리포트.
```

---

## P3. `@ymjin/gongbang` — 공방 관리 API 규격

**kitforge 작업**
- `@ymjin/gongbang/agent`(각 서비스에 설치): `gongbangKeysFromEnv()`(READ/WRITE 키 · 교체 중 2개 허용 · 최소 32자), `gongbangAuthorized(header, keys, scope)`(timing-safe), 응답 봉투 `ok / fail / serverError`, 표준 엔드포인트 타입 `health · summary · users · push-history`.
  - 원천: review77 `src/server/gongbang-auth.ts`(scope·키 교체), dadeum `lib/services/gongbang/guard.ts`(ok·fail·serverError).
- `@ymjin/gongbang/client`(공방에 설치): 서비스별 base URL + 키로 표준 엔드포인트를 호출하는 typed fetcher.
- 목표: 공방의 **직접 DB 접속(ohguohgu · gabo · perkstep)을 표준 API 호출로 대체** → 서비스 DB 자격증명이 공방에서 빠진다.

**공통 프롬프트 머리말**
```
kitforge에 @ymjin/gongbang@<버전>이 발행됐다 — 공방 Admin이 각 서비스를 관리할 때 쓰는 표준 API 규격
(agent: READ/WRITE 키 검증 · 응답 봉투 · 표준 엔드포인트 health/summary/users/push-history).
CLAUDE.md §24 · reuse-kit.md ② 절차로 진행. 키 값은 지어내지 말고 env 이름만 정한다(실제 키 발급·등록은 내가 한다).
공방 쪽 화면이 깨지지 않도록 기존 응답 필드와의 차이를 리포트에 표로 보여줘. 배포 후 handoff/gongbang-deploy 형식으로 배포 핸드오프 작성.
```

**▶ review77 (chilchil)** — 원천 저장소, 키트로 되돌려 쓰기
```
[머리말] 교체 후보: src/server/gongbang-auth.ts(→ agent로 이전), src/server/gongbang.ts의 응답 헬퍼,
src/app/api/gongbang/{health,summary}/route.ts를 표준 엔드포인트 타입에 맞춘다.
reports·domains·platforms 같은 칠칠평 전용 엔드포인트는 그대로 두고 가드·봉투만 키트 것을 쓴다.
```

**▶ dadeum**
```
[머리말] 교체 후보: lib/services/gongbang/guard.ts(→ agent), lib/gongbang-api.ts, app/api/gongbang/*/route.ts 전체의 가드·응답.
users·stats·push-history는 표준 타입에 맞추고, operator-jobs·send-now·mail 같은 전용 엔드포인트는 유지.
DADEUM_READ_KEY / DADEUM_WRITE_KEY env 이름이 바뀌면 공방과 맞춰야 하므로 리포트에 표기.
```

**▶ ohguohgu** — 신규 노출
```
[머리말] 지금은 공방이 오구오구 DB(Prisma/pg)와 Firebase에 직접 붙는다(공방 lib/db/ohguohgu*.ts, lib/services/ohguohgu/*).
server에 @ymjin/gongbang/agent로 표준 엔드포인트(health·summary·users·push-history)를 새로 노출하는 설계를 먼저 리포트해줘:
기존 admin 핸들러(server/src/handlers/admin/*, adminService.ts, adminAuthService.ts)와 겹치는 부분, 라우팅 방식, 키 env 이름.
미션·포인트·보상 같은 전용 기능은 2단계로 미루고 표준 4종부터.
```

**▶ gabo-ham** — 신규 노출
```
[머리말] 지금은 공방이 가보함 DB에 직접 붙는다(공방 lib/db/gabo*.ts, lib/services/gabo/*).
src/app/api/gongbang/ 아래에 표준 엔드포인트(health·summary·users·push-history)를 노출하는 설계를 먼저 리포트해줘.
가족·추억·활동·메일 로그 같은 전용 조회는 2단계. familyId 격리 규칙(가족 외부 노출 금지)이 관리 API에서도 지켜지는지 명시.
```

**▶ perk_step** — 신규 노출
```
[머리말] 지금은 공방이 firebase-admin으로 혜택까지 Firebase Auth를 직접 읽는다(공방 lib/services/perkstep/users.ts).
apps/web에 표준 엔드포인트(health·summary·users)를 노출하는 설계를 리포트해줘. 기존 apps/web/src/lib/dataAdmin.ts와의 관계를 정리.
```

**▶ gongbang** — client 전환
```
[머리말] 이 저장소는 client 쪽. lib/services/{dadeum,review77}/*의 fetch 호출을 @ymjin/gongbang/client로 바꾸고,
ohguohgu·gabo·perkstep은 각 서비스가 표준 API를 노출한 뒤(서비스별 배포 핸드오프 확인 후) lib/db/{ohguohgu,gabo,perkstep}* 직접 접속을 단계적으로 걷어낸다.
서비스별로 전환 순서·롤백 방법·제거될 env(DB 자격증명)를 리포트해줘. 한 서비스씩 승낙받고 진행.
```

**▶ skill** (선택)
```
[머리말] skill은 아직 공방에 붙어 있지 않다(자체 관리자 화면 src/app/pages/admin/* 보유).
표준 엔드포인트(health·summary·users)만 server/에 노출해 공방 대시보드에 올릴지, 자체 관리자를 유지할지 옵션으로 리포트해줘.
```

---

## P4. `@ymjin/ui` 확장 — 웹 화면 패턴 (RN은 N2)

**kitforge 작업**
- `@ymjin/ui` 추가(웹, React Aria + tokens):
  - `ConfirmProvider` + `useConfirm()`(Promise 반환) — 원천: perk_step `ConfirmDialog.tsx`(confirmDialog/ConfirmHost), dadeum `components/common/ConfirmDialog.tsx`
  - `EmptyState`, `PageHeader`, `SectionTitle`, `SegmentedToggle`, `SearchInput`, `BottomSheet` — 원천: dadeum `components/common/*`
  - `AdminShell` + `Sidebar`, `FilterBar`, `DataTable`(Table + Pagination + 필터) — 원천: gongbang `components/layout/*`, `components/common/{FilterBar,Table}.tsx`
  - PWA: `PushPermissionBanner`, `AddToHomeCard` — 원천: gabo-ham `src/components/common/*`
- prop API는 나중에 N2에서 ui-native가 같은 이름·같은 props로 따라올 수 있게 정한다(ADR-0003).

**공통 프롬프트 머리말**
```
kitforge @ymjin/ui@<버전>에 웹 화면 패턴 컴포넌트가 추가됐다
(ConfirmProvider/useConfirm · EmptyState · PageHeader · SegmentedToggle · SearchInput · BottomSheet · AdminShell/Sidebar · FilterBar · DataTable · PushPermissionBanner · AddToHomeCard).
CLAUDE.md §24 · reuse-kit.md ② 절차 + §16 디자인 정합. 토큰이 @ymjin/tokens와 다르면 먼저 토큰 정합 리포트.
화면 단위로 배치를 나눠 승낙받고, 배치마다 스크린샷 전/후 비교와 변경분 테스트(E2E 포함) 실행. 전수 자동 교체 금지.
```

**▶ dadeum** (원천)
```
[머리말] 교체 후보: components/common/{ConfirmDialog,EmptyState,PageHeader,SectionTitle,SegmentedToggle,SearchInput,BottomSheet,Spinner,Tabs,Toggle,Button,Card,Input}.tsx,
components/providers/ThemedToaster.tsx(sonner → 키트 Toast로 바꿀지 옵션). @ymjin/tokens 미사용 상태이므로 토큰 도입(Tailwind preset)부터 리포트.
```

**▶ gabo-ham**
```
[머리말] 교체 후보: src/components/common/{Modal,TabbedGuideModal,PushPermissionBanner,AddToHomeCard,BackLink,UserMenu}.tsx,
src/components/auth/SignupSuccessModals.tsx. @ymjin/tokens 미사용 — 토큰 도입부터 리포트.
```

**▶ gongbang** (원천)
```
[머리말] 교체 후보: components/layout/{AdminShell,Sidebar}.tsx, components/common/{Modal,Table,FilterBar,ErrorText}.tsx,
서비스별 *Client.tsx 안의 목록·필터·확인창. 관리자 전용 화면이라 디자인 변경 허용 폭이 크다 — 일괄 교체 배치를 크게 잡아도 된다는 옵션 포함.
```

**▶ review77 (chilchil)** — 이미 @ymjin/ui 사용
```
[머리말] @ymjin/ui를 <버전>으로 올리고, 손수 만든 src/components/toast-provider.tsx·report-dialog.tsx와
화면 곳곳의 확인창·빈 상태를 키트 ConfirmProvider·EmptyState로 바꿀 후보를 리포트해줘.
```

**▶ perk_step** — 웹만
```
[머리말] apps/web만 대상: src/components/{ConfirmDialog,Toast}.tsx → @ymjin/ui ConfirmProvider·Toast, *Sheet.tsx → BottomSheet.
apps/mobile은 네이티브 단계에서 따로 한다.
```

**▶ sigeumseok** (선택)
```
[머리말] Electron renderer(src/renderer)에 @ymjin/tokens · @ymjin/ui를 도입할 가치가 있는지만 리포트해줘(확인창·빈 상태·테이블 위주).
도입 효과가 작으면 「보류」 권고로 끝내도 된다.
```

**▶ skill** (선택)
```
[머리말] skill은 shadcn(Radix) 35종 + MUI를 쓴다(src/app/components/ui/*). 전면 교체는 하지 않는다.
관리자 화면(src/app/pages/admin/*)의 확인창·빈 상태·목록만 키트로 바꿀 가치가 있는지, MUI 제거 가능성과 함께 리포트해줘.
```

---

## P5. `@ymjin/account` — 약관 · 동의 · 탈퇴 · 공지 팝업

**kitforge 작업** (인증 방식은 서비스마다 다르므로 **인증 위의 계정 흐름만**)
- `legal`: 약관/개인정보 문서 모델(`LegalDoc { kind, version, effectiveAt, sections }`), 버전 비교, 렌더러(`@ymjin/account/react` — W 단계, `/native` — N3). 원천: review77 `src/content/legal/{types,terms,privacy}.ts`·`src/screens/legal.tsx`.
- `consent`: `ConsentGate`(필수 동의 버전이 올라가면 재동의) + 저장 어댑터. 원천: perk_step `apps/web/src/components/ConsentGate.tsx`·`apps/mobile/src/lib/useConsent.ts`·`packages/domain/src/privacy.ts`.
- `withdrawal`: 탈퇴 요청 → 유예 기간 → 철회/확정 상태기계 + 삭제 계획 훅. 원천: ohguohgu `server/src/handlers/{withdraw,withdrawal_cancel,process_withdrawals}.ts`, gabo-ham `src/lib/family/accountDeletePlan.ts`.
- `notice`: 공지 팝업 「오늘 하루 안 보기 / 다시 안 보기」 판정. 원천: ohguohgu `mobile/src/utils/noticeDismissal.ts`.

**공통 프롬프트 머리말**
```
kitforge에 @ymjin/account@<버전>이 발행됐다(legal 문서 모델·렌더러 / ConsentGate / 탈퇴 유예·철회 상태기계 / 공지 팝업 dismiss).
인증·DB는 이 저장소 것을 그대로 쓰고 저장은 어댑터로 주입. CLAUDE.md §24 · reuse-kit.md ② 절차.
⚠️ 약관·개인정보 **문구는 법적 문서라 내용을 바꾸지 말고** 구조만 옮긴다 — 옮긴 뒤 전/후 텍스트 diff가 0인지 테스트로 확인.
탈퇴는 데이터 삭제가 걸리므로 삭제 대상·유예 기간이 기존과 같은지 리포트에 표로 대조.
```

**▶ review77 (chilchil)** (legal 원천)
```
[머리말] 교체 후보: src/content/legal/{types,terms,privacy}.ts(→ LegalDoc 모델), src/screens/legal.tsx, src/app/{terms,privacy}/page.tsx,
src/server/account.ts · src/server/actions/account.ts의 탈퇴 흐름.
```

**▶ perk_step** (consent 원천)
```
[머리말] 이번은 웹 단계 — 교체 후보: apps/web/src/components/ConsentGate.tsx, packages/domain/src/privacy.ts, apps/web의 privacy 페이지,
packages/sync/src/account.ts · apps/web/src/lib/account.ts · apps/web/src/components/AccountPanel.tsx의 탈퇴 부분.
apps/mobile(useConsent · privacy · AccountPanel)은 네이티브 단계 — 공유 패키지(domain · sync)를 바꾸면 mobile은 타입체크·단위 테스트만 확인.
```

**▶ ohguohgu** (withdrawal · notice 원천)
```
[머리말] 이번은 서버 단계 — 교체 후보: server/src/handlers/{withdraw,withdrawal_cancel,process_withdrawals}.ts(상태기계만 키트로, Prisma 삭제는 어댑터).
mobile(WithdrawalModal · AccountSettingsScreen · LegalScreen · noticeDismissal · NoticePopupModal)은 네이티브 단계.
```

**▶ dadeum**
```
[머리말] 교체 후보: app/actions/account.ts(탈퇴), app/{terms,privacy}/page.tsx. 동의 게이트가 없다면 도입 여부를 옵션으로.
```

**▶ gabo-ham**
```
[머리말] 교체 후보: src/components/settings/DeleteAccountSection.tsx, src/lib/family/accountDeletePlan.ts(가족 소유 데이터 처리 계획은 어댑터 쪽에 남김),
src/app/{terms,privacy}/page.tsx.
```

**▶ skill**
```
[머리말] 교체 후보: src/app/pages/{TermsPage,PrivacyPage}.tsx, supabase/functions/delete-account/index.ts(탈퇴 상태기계 적용 여부 — 현재 즉시 삭제라면 유예 도입은 옵션으로만),
src/app/pages/NoticesPage.tsx · components/NoticeDetail.tsx의 공지 팝업 여부.
```

---

## P6. 기존 패키지를 쓰지 않고 있는 곳

**▶ skill — `@ymjin/maps`**
```
@ymjin/maps@0.1.0(Google+Naver 웹 통합 지도)을 이 저장소에 적용하려 한다. CLAUDE.md §24 · reuse-kit.md ② 절차.
교체 후보: src/app/components/NaverMapEmbed.tsx, src/app/lib/naverMaps.ts. 기존 Naver 키 env는 그대로 주입.
```

**▶ gabo-ham — `@ymjin/storage`** (kitforge 선행: Google Drive · 자체 NAS 게이트웨이 provider 추가 검토)
```
@ymjin/storage@<버전>에 Google Drive / 자체 호스팅(NAS 게이트웨이) provider가 추가됐다. CLAUDE.md §24 · reuse-kit.md ② 절차.
교체 후보: src/lib/storage/{providers,gdrive,gatewaySign,probe,uploadTargets}.ts. healthSweep·orphan·grace·nasOffer 같은 정책 로직은 남긴다.
nas-connector 게이트웨이 서명 규격이 바뀌지 않는지 리포트에 명시.
```

---

## N 단계 — 네이티브 (W 단계가 끝난 뒤)

### N0. ui-native 0.2.0 실기기 확인 (PR #3 후속)

**▶ perk_step** — ui-native 0.2.0 발행 후
```
@ymjin/ui-native가 0.2.0으로 올라갔다 — 빌드가 nativewind/jsx-runtime을 쓰고, Slider·DatePicker가 서브패스(/slider · /date-picker)로 빠졌다.
CLAUDE.md §24 · reuse-kit.md 절차로 apps/mobile을 업그레이드해줘:
① apps/mobile/metro.config.js의 jsx-runtime resolveRequest 우회(「키트가 jsxImportSource nativewind로 빌드되면 지운다」 주석 부분) 제거
② 키트 Slider·DatePicker를 쓰지 않으면 @react-native-community/{slider,datetimepicker}가 키트 때문에만 필요한지 확인(PhotoEditor·DateField가 직접 쓰므로 유지일 가능성)
③ 웹(react-native-web) 실행 + EAS 개발 빌드에서 키트 Button·Modal·Select·TextField·Badge의 className 스타일이 그대로인지 스크린샷 전/후 비교.
기기 확인은 내가 해야 하는 단계면 체크리스트로 남겨줘. reuse-kit.md 「ui-native 설치 함정」 ①②④ 항목 갱신안도 정리.
```

### N1. `@ymjin/core`를 RN 앱에 적용

**▶ ohguohgu (mobile)**
```
@ymjin/core@<버전>(KST 날짜·숫자 포맷)을 mobile에 적용한다. server는 웹 단계에서 이미 적용됐다.
CLAUDE.md §24 · reuse-kit.md ② 절차. 교체 후보: mobile/src/utils/format.ts, mobile/src/utils/kst.ts, hooks/useKstDayChange.ts의 날짜 계산.
fmtPoints·fmtPointsWithUnit·toPointDigits·fmtPointInput 같은 포인트 전용 함수는 남긴다.
Expo RN 57 Hermes의 Intl(timeZone: Asia/Seoul, ko-KR) 출력이 기존과 같은지 jest-expo 테스트 + 실기기 스크린샷으로 확인.
```

**▶ perk_step (mobile)**
```
packages/domain이 웹 단계에서 @ymjin/core를 쓰도록 바뀌었다. apps/mobile에서 금액·날짜 표시가 기존과 같은지
Hermes Intl 기준으로 확인하고(단위 테스트 + EAS 개발 빌드 스크린샷), 다른 점이 있으면 리포트해줘.
```

### N2. `@ymjin/ui-native` 확장 — RN 화면 패턴

**kitforge 작업**
- `DialogHost` + `useDialog()`, `ToastHost` + `useToast()`, `EmptyState`, `BottomSheet`, `SheetHeader`, `FormFooter` — 원천: ohguohgu `mobile/src/components/{GlobalDialog,GlobalToast,ModalDialogHost,EmptyState,SheetHeader,FormFooter}.tsx`·`store/use{Dialog,Toast}Store.ts`, perk_step `apps/mobile/src/components/{ConfirmDialog,Toast}.tsx`
- P4에서 정한 웹 `@ymjin/ui` 이름·props를 그대로 따른다(ADR-0003).

**공통 프롬프트 머리말**
```
kitforge @ymjin/ui-native@<버전>에 RN 화면 패턴 컴포넌트가 추가됐다(DialogHost/useDialog · ToastHost/useToast · EmptyState · BottomSheet · SheetHeader · FormFooter).
CLAUDE.md §24 · reuse-kit.md ② 절차 + §16 디자인 정합. 화면 단위 배치로 승낙받고, 배치마다 실기기(또는 EAS 개발 빌드) 스크린샷 전/후 비교와 변경분 테스트. 전수 자동 교체 금지.
```

**▶ perk_step (mobile)**
```
[머리말] apps/mobile/src/components/{ConfirmDialog,Toast}.tsx → @ymjin/ui-native DialogHost·ToastHost, *Sheet.tsx → BottomSheet.
Metro jsx-runtime 우회 제거는 N0에서 끝났다 — 남아 있으면 리포트에 표기.
```

**▶ ohguohgu (mobile)** (원천)
```
[머리말] mobile만 대상. 교체 후보: src/components/{GlobalDialog,ModalDialogHost,CenterDialog,GlobalToast,EmptyState,SheetHeader,FormFooter}.tsx,
src/store/use{Dialog,Toast}Store.ts, src/utils/{confirmLogout,modalPresence}.ts.
현재 NativeWind가 아니라 StyleSheet(*.styles.ts) 기반 — @ymjin/ui-native(NativeWind) 도입 비용·위험을 먼저 리포트하고,
도입 안 함(보류) 옵션도 함께 제시. My* 래퍼 컴포넌트(MyButton·MyInput·MySwitch·MyText)는 키트로 대체 가능한 범위만 표기.
```

### N3. `@ymjin/account` 네이티브 렌더러 · 동의 · 탈퇴 화면

**▶ perk_step (mobile)**
```
@ymjin/account@<버전>의 /native(LegalDoc 렌더러 · ConsentGate)를 apps/mobile에 적용한다. 웹은 이미 적용됐다.
CLAUDE.md §24 · reuse-kit.md ② 절차. 교체 후보: apps/mobile/src/lib/useConsent.ts, apps/mobile/src/app/privacy.tsx, apps/mobile/src/components/AccountPanel.tsx의 탈퇴 부분.
약관 문구는 바꾸지 않는다 — 전/후 텍스트 diff 0 확인.
```

**▶ ohguohgu (mobile)**
```
@ymjin/account@<버전>의 /native를 mobile에 적용한다. server의 탈퇴 상태기계는 이미 키트로 바뀌었다.
CLAUDE.md §24 · reuse-kit.md ② 절차. 교체 후보: src/components/WithdrawalModal.tsx, src/screens/{AccountSettingsScreen,LegalScreen}.tsx,
src/utils/noticeDismissal.ts, src/components/NoticePopupModal.tsx. 약관 문구 diff 0 · 탈퇴 유예/철회 화면 흐름이 server 상태와 맞는지 TC로 확인.
```

### N4. `@ymjin/push/native` (선택)

**kitforge 작업**: `@react-native-firebase/messaging` 기반 토큰 등록·갱신·권한 헬퍼. 원천: ohguohgu `mobile/src/services/{fcm,pushToken,pushRuntime}.ts`. 다른 RN 앱이 푸시를 쓰기 시작할 때만 진행.

---

## 서비스 1회 반영 프롬프트 (W 단계)

K1~K4 패키지가 발행된 뒤, 서비스마다 **아래 프롬프트 하나**로 반영한다. 반영 순서는 위험이 낮은 순서다: gongbang → review77 → dadeum → gabo-ham → perk_step → ohguohgu → skill.

**공통 머리말**
```
kitforge 재사용 키트가 발행됐다: @ymjin/core@<버전> · @ymjin/gongbang@<버전> · @ymjin/push@<버전> · @ymjin/account@<버전>.
이 저장소 CLAUDE.md §24 · docs/workflows/reuse-kit.md ② 절차로 반영하되, **shim 방식**으로 해줘:
아래 파일은 경로와 export 이름을 그대로 두고 본문만 키트 호출로 바꾼다 — 호출부는 바꾸지 않는다.
출력 차이는 kitforge docs/adoption/compat/<서비스>.md(키트 대조 테스트 결과)에 정리돼 있다. 차이가 있는 함수는 패턴 인자로 기존 출력을 유지하는 것이 기본이고, 바꾸려면 리포트에서 옵션으로 제시한다.
순서: 교체 대상 확인 리포트 → 승낙 → 배치 교체 → 기존 테스트 전체 + 변경분 테스트 → ADR · HISTORY · 영향 TC.
키 값은 지어내지 않는다(env 이름만). 배포 후 handoff/gongbang-deploy 형식으로 배포 핸드오프 작성.
```

**▶ gongbang**
```
[머리말] 본문 교체: lib/format.ts(→ @ymjin/core/date, 기존 toLocale 출력은 formatKst 패턴으로 유지), lib/auth/rate-limit.ts · rate-policy.ts(→ @ymjin/core/rate-limit backoffVerdict · clientIp, 저장은 키트 sqlRateStore 대신 기존 admin_login_attempts 집계 유지 가능),
lib/services/push.ts(→ @ymjin/push sendToTargets — 기존 PushDeps를 그대로 넘긴다), lib/services/{dadeum,review77}/*의 fetch 호출(→ @ymjin/gongbang createGongbangClient).
ohguohgu · gabo · perkstep 직접 DB 접속 제거는 이번 범위가 아니다 — 각 서비스가 표준 API를 배포한 뒤 따로 한다.
```

**▶ review77 (chilchil)**
```
[머리말] 본문 교체: src/server/rate-limit.ts(→ createRateLimiter + firestoreRateStore, hashKeys: true — 기존 sha256 키와 같은지 확인. LIMITS 표는 그대로),
src/server/gongbang-auth.ts · src/server/gongbang.ts의 가드 · gongbangRoute(→ @ymjin/gongbang, 같은 이름), src/content/legal/types.ts(→ @ymjin/account LegalDoc 타입 re-export).
api/gongbang/* route 파일과 약관 본문(terms.ts · privacy.ts)은 건드리지 않는다.
```

**▶ dadeum**
```
[머리말] 본문 교체: lib/format.ts(→ @ymjin/core/date · number — date-fns 패턴과 같은 formatKst 패턴, fmtRelative는 문구가 달라지므로 옵션 제시),
lib/services/webpush.ts · fcm.ts · lib/push-errors.ts(→ @ymjin/push webPushSender · fcmSender · isDeadSubscription — 구독 조회 · 정리 SQL은 deps로 그대로),
lib/services/gongbang/guard.ts(→ @ymjin/gongbang, 같은 이름 · DADEUM_READ_KEY/DADEUM_WRITE_KEY 유지).
```

**▶ gabo-ham**
```
[머리말] 본문 교체: src/lib/utils/format.ts(formatBytes → @ymjin/core/number), src/lib/push/{web-push,fcm,client,capacitor-fcm,subscriptionPolicy}.ts(→ @ymjin/push). notify-family.ts는 그대로.
신규: src/app/api/gongbang/ 아래 표준 엔드포인트(health · summary · users · push-history)를 @ymjin/gongbang 팩토리로 — route 파일은 한 줄씩, 데이터 함수만 작성.
familyId 격리 규칙이 관리 API에서도 지켜지는지 TC로 확인. 계약 테스트(verifyGongbangContract) 실행.
```

**▶ perk_step (web만)**
```
[머리말] 본문 교체: packages/domain/src/format.ts(won · shortWon · todaySeoul · formatAmountInput · newId · nowIso · shiftMonth → @ymjin/core re-export, 도메인 함수는 그대로), apps/web/src/lib/rateLimit.ts(→ memoryStore + createRateLimiter, retryAfter · clientKey 이름 유지).
신규: apps/web에 공방 표준 엔드포인트(health · summary · users)를 @ymjin/gongbang 팩토리로.
apps/mobile은 코드 수정 없이 타입체크 · 단위 테스트만(기기 확인은 N 단계).
```

**▶ ohguohgu (server만)**
```
[머리말] 본문 교체: server/src/utils/kst.ts · format.ts(→ @ymjin/core/date · number — fmtPoints는 formatNumber로, 함수 이름 유지), server/src/services/pushService.ts의 FCM 발송부(→ @ymjin/push fcmSender — silent push · 버전 규칙은 그대로).
신규: 공방 표준 엔드포인트(health · summary · users · push-history)를 @ymjin/gongbang Lambda 어댑터로. mobile은 건드리지 않는다(N 단계).
```

**▶ skill**
```
[머리말] 본문 교체: src/app/lib/date.ts(→ @ymjin/core/date). @ymjin/auth 0.3.1 → 0.4.0 업그레이드(P0 프롬프트 참고)도 이번에 함께.
@ymjin/maps 적용은 K6 확인 결과에 따라 별도.
```

## 진행 순서 권장

1. **W 단계**: kitforge K1~K4(→ K5 · K6) 완료 · 한 번에 발행 → 서비스 1회 반영(gongbang → review77 → dadeum → gabo-ham → perk_step → ohguohgu → skill) → 공방 직접 DB 접속 제거 PR
   **N 단계**: N0(ui-native 0.2.0 실기기) → N1 → N2 → N3 → (N4)
2. 키트 대조 테스트로 서비스별 출력 차이를 `docs/adoption/compat/<서비스>.md`에 미리 정리해 두고, 서비스 세션은 그 차이표를 확인만 한다.
3. 서비스 적용이 끝나면 그 서비스가 `handoff/gongbang-deploy/` 배포 핸드오프를 남기고, 공방 배포 이력에 등록.
