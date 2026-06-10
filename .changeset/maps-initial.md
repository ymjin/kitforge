---
"@kitforge/maps": minor
---

Add `@kitforge/maps` — one React map interface over Google Maps and Naver Maps.

공통 `MapProvider`/`MapController` 계약 위에 provider별 SDK 어댑터를 두어, provider만
바꾸면 같은 코드로 구글/네이버 지도를 전환합니다.

**구성**:
- `@kitforge/maps` — 코어 타입(LatLng·MapOptions·Marker·Polygon 등) + `MapController` 계약 + `loadScript` SDK 로더(URL 중복 제거)
- `@kitforge/maps/providers` — `GoogleMaps({ apiKey })`, `NaverMaps({ ncpKeyId })`
- `@kitforge/maps/react` — `<Map>`, `<Marker>`, `<Polygon>`, `<Polyline>`, `useCurrentPosition`(GPS)

**특징**:
- 통일 기능: 중심/줌·마커·폴리곤·폴리라인·click/zoom/center 이벤트·fitBounds. provider 전용 기능은 각 핸들의 `native`로 접근
- SDK는 `<script>`로 온디맨드 로드(미번들), API 키는 소비자가 주입(공개·도메인 제한값)
- 좌표 정규화: 내부 `{lat,lng}` ↔ 각 SDK 좌표 타입 자동 변환
- 네이버는 NCP Maps. 2025 마이그레이션으로 스크립트 파라미터가 `ncpKeyId`로 변경됨(`scriptParam`으로 override 가능)
- **클러스터링은 v1 미포함** — 필요 시 추가하는 확장점

34개 스모크 테스트 통과 (로더 dedup/callback/polling, 구글·네이버 어댑터 가짜 SDK 검증, React Map/Marker/useCurrentPosition jsdom 렌더).
