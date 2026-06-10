---
"@kitforge/maps": minor
---

Add React Native support — `@kitforge/maps/native` + cross-platform `@kitforge/maps/ui`.

같은 `<Map>`/`<Marker>`/`<Polygon>`/`<Polyline>` 코드를 웹과 React Native 양쪽에서
사용합니다. `@kitforge/maps/ui`로 import하면 번들러가 플랫폼별 구현을 자동 선택합니다
(웹→`/react`, Metro→`/native`, `exports` 조건 사용).

**`@kitforge/maps/native`** (react-native-maps 래핑):
- `GoogleMaps()`(Android 기본/iOS Google 설정) · `AppleMaps()`(iOS 기본)
- `<Map>`은 zoom↔region delta 변환, onPress→onClick, onRegionChangeComplete→center/zoom
- `useCurrentPosition`은 navigator.geolocation 기반이라 웹과 공유
- core 타입(LatLng·MarkerOptions 등) 웹과 공유, 구현만 분기

**제약**:
- **네이버 네이티브 미지원** — react-native-maps는 Google/Apple만. `NaverMaps()`는 명확한 에러 throw. 네이버는 웹(`/react`)에서 사용
- 키는 네이티브 설정(app.json/Info.plist/AndroidManifest)에 둠 — `GoogleMaps({apiKey})`의 apiKey는 네이티브에서 무시(웹 API 동일성 유지용)
- `react-native`·`react-native-maps` optional peerDependency, **dev/EAS build 필요**(Expo Go 불가)

20개 스모크 테스트 통과 (provider 디스크립터, zoom↔delta 변환, 컴포넌트 prop 매핑).
