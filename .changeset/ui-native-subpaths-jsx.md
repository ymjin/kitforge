---
"@ymjin/ui-native": minor
---

설치 함정 2가지를 키트에서 고쳤습니다.

- **`className`이 키트 컴포넌트에 먹지 않던 문제**: 빌드가 `react/jsx-runtime` 대신 `nativewind/jsx-runtime`을 쓰도록 바꿨습니다. 앱 Metro에서 키트의 jsx-runtime을 `react-native-css-interop`으로 돌리던 `resolveRequest` 우회는 이제 지워도 됩니다.
- **선택 패키지가 없으면 번들이 실패하던 문제**: `Slider`와 `DatePicker`를 메인 엔트리에서 빼서 서브패스로 옮겼습니다. 메인 엔트리는 더 이상 `@react-native-community/slider`와 `@react-native-community/datetimepicker`를 가져오지 않습니다.

**바뀐 import (breaking)**

```diff
- import { Slider, DatePicker } from "@ymjin/ui-native";
+ import { Slider } from "@ymjin/ui-native/slider";
+ import { DatePicker } from "@ymjin/ui-native/date-picker";
```
