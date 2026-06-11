---
"@kitforge/ui-native": minor
---

Add `@kitforge/ui-native` — React Native components (NativeWind + tokens).

웹 `@kitforge/ui`(React Aria)는 그대로 두고, RN용 컴포넌트를 **별도 패키지**로
제공합니다. 스타일은 **NativeWind + `@kitforge/tokens` Tailwind 프리셋** — 웹(Tailwind)과
앱(NativeWind)이 같은 클래스·같은 값(`bg-primary-500` 동일). prop API(`variant`·`size`)는
웹과 동일, 이벤트만 RN식(`onPress`·`onValueChange`).

**Phase 1**: Button · TextField · Switch · Checkbox · Modal · Badge · Card(+Header/Body/Footer) · Spinner

- RN 기본요소(Pressable·TextInput·Text·View) + RN Switch/Modal/ActivityIndicator로 구현
- class로 못 주는 색(RN trackColor·placeholderTextColor·spinner color)은 `@kitforge/tokens` JS 값 import → 단일 소스 유지
- peerDependency: `@kitforge/tokens`·`nativewind`·`react`·`react-native`. 소비자가 tailwind.config 프리셋 + nativewind/babel 설정
- **Phase 2**(커뮤니티 래핑): Select·DatePicker·RadioGroup·Slider·Toast

28개 스모크 테스트 통과 (컴포넌트 className/prop 매핑 — variant·size·토큰 색·a11y·토글·Modal 구조). 실제 렌더는 NativeWind 트랜스폼이 필요해 EAS build에서 확인.
