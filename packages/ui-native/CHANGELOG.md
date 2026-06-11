# @ymjin/ui-native

## 0.1.1

### Patch Changes

- Updated dependencies [ec55f83]
  - @ymjin/tokens@0.1.1

## 0.1.0

### Minor Changes

- 2c20cbc: Add `@ymjin/ui-native` — React Native components (NativeWind + tokens).

  웹 `@ymjin/ui`(React Aria)는 그대로 두고, RN용 컴포넌트를 **별도 패키지**로
  제공합니다. 스타일은 **NativeWind + `@ymjin/tokens` Tailwind 프리셋** — 웹(Tailwind)과
  앱(NativeWind)이 같은 클래스·같은 값(`bg-primary-500` 동일). prop API(`variant`·`size`)는
  웹과 동일, 이벤트만 RN식(`onPress`·`onValueChange`).

  **Phase 1**: Button · TextField · Switch · Checkbox · Modal · Badge · Card(+Header/Body/Footer) · Spinner

  - RN 기본요소(Pressable·TextInput·Text·View) + RN Switch/Modal/ActivityIndicator로 구현
  - class로 못 주는 색(RN trackColor·placeholderTextColor·spinner color)은 `@ymjin/tokens` JS 값 import → 단일 소스 유지
  - peerDependency: `@ymjin/tokens`·`nativewind`·`react`·`react-native`. 소비자가 tailwind.config 프리셋 + nativewind/babel 설정
  - **Phase 2**(커뮤니티 래핑): Select·DatePicker·RadioGroup·Slider·Toast

  28개 스모크 테스트 통과 (컴포넌트 className/prop 매핑 — variant·size·토큰 색·a11y·토글·Modal 구조). 실제 렌더는 NativeWind 트랜스폼이 필요해 EAS build에서 확인.

- ec827c2: Add `@ymjin/ui-native` Phase 2 — RadioGroup, Select, Slider, DatePicker, Toast.

  - `RadioGroup` + `Radio` — 순수 RN(Pressable), context 기반 선택
  - `Select` — 토큰 스타일 트리거 + `Modal` 옵션 리스트 (네이티브 picker 대신 순수 RN → iOS·안드로이드 동일 외형, 웹 Select와 일치). `options` 배열 prop
  - `Slider` — `@react-native-community/slider` 래핑, 트랙·썸을 토큰 색으로 (optional peer)
  - `DatePicker` — `@react-native-community/datetimepicker` 래핑(네이티브 휠/다이얼로그), 트리거에 포맷된 날짜 표시 (optional peer)
  - `ToastProvider` + `useToast` — 순수 RN(portal 없어 절대배치 오버레이), variant별 좌측 보더 색

  모두 `@ymjin/tokens`로 스타일. `@react-native-community/slider`·`datetimepicker`는 optional peerDependency(Slider·DatePicker 사용 시에만).

  17개 스모크 테스트 통과 (react-test-renderer로 context/state 컴포넌트 + 직접 호출로 stateless — Radio 선택·onPress, Select 옵션·placeholder, Slider 토큰 tint, DatePicker 포맷, Toast 큐·variant·dismiss).

### Patch Changes

- Updated dependencies [3b821c7]
  - @ymjin/tokens@0.1.0
