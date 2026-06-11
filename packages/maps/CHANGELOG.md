# @ymjin/maps

## 0.1.0

### Minor Changes

- 5e77dc6: Add `@ymjin/maps` — one React map interface over Google Maps and Naver Maps.

  공통 `MapProvider`/`MapController` 계약 위에 provider별 SDK 어댑터를 두어, provider만
  바꾸면 같은 코드로 구글/네이버 지도를 전환합니다.

  **구성**:

  - `@ymjin/maps` — 코어 타입(LatLng·MapOptions·Marker·Polygon 등) + `MapController` 계약 + `loadScript` SDK 로더(URL 중복 제거)
  - `@ymjin/maps/providers` — `GoogleMaps({ apiKey })`, `NaverMaps({ ncpKeyId })`
  - `@ymjin/maps/react` — `<Map>`, `<Marker>`, `<Polygon>`, `<Polyline>`, `useCurrentPosition`(GPS)

  **특징**:

  - 통일 기능: 중심/줌·마커·폴리곤·폴리라인·click/zoom/center 이벤트·fitBounds. provider 전용 기능은 각 핸들의 `native`로 접근
  - SDK는 `<script>`로 온디맨드 로드(미번들), API 키는 소비자가 주입(공개·도메인 제한값)
  - 좌표 정규화: 내부 `{lat,lng}` ↔ 각 SDK 좌표 타입 자동 변환
  - 네이버는 NCP Maps. 2025 마이그레이션으로 스크립트 파라미터가 `ncpKeyId`로 변경됨(`scriptParam`으로 override 가능)
  - **클러스터링은 v1 미포함** — 필요 시 추가하는 확장점

  34개 스모크 테스트 통과 (로더 dedup/callback/polling, 구글·네이버 어댑터 가짜 SDK 검증, React Map/Marker/useCurrentPosition jsdom 렌더).

- caf15d4: Add React Native support — `@ymjin/maps/native` + cross-platform `@ymjin/maps/ui`.

  같은 `<Map>`/`<Marker>`/`<Polygon>`/`<Polyline>` 코드를 웹과 React Native 양쪽에서
  사용합니다. `@ymjin/maps/ui`로 import하면 번들러가 플랫폼별 구현을 자동 선택합니다
  (웹→`/react`, Metro→`/native`, `exports` 조건 사용).

  **`@ymjin/maps/native`** (react-native-maps 래핑):

  - `GoogleMaps()`(Android 기본/iOS Google 설정) · `AppleMaps()`(iOS 기본)
  - `<Map>`은 zoom↔region delta 변환, onPress→onClick, onRegionChangeComplete→center/zoom
  - `useCurrentPosition`은 navigator.geolocation 기반이라 웹과 공유
  - core 타입(LatLng·MarkerOptions 등) 웹과 공유, 구현만 분기

  **제약**:

  - **네이버 네이티브 미지원** — react-native-maps는 Google/Apple만. `NaverMaps()`는 명확한 에러 throw. 네이버는 웹(`/react`)에서 사용
  - 키는 네이티브 설정(app.json/Info.plist/AndroidManifest)에 둠 — `GoogleMaps({apiKey})`의 apiKey는 네이티브에서 무시(웹 API 동일성 유지용)
  - `react-native`·`react-native-maps` optional peerDependency, **dev/EAS build 필요**(Expo Go 불가)

  20개 스모크 테스트 통과 (provider 디스크립터, zoom↔delta 변환, 컴포넌트 prop 매핑).
