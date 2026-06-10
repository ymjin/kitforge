---
"@kitforge/ui": minor
---

Add `Progress` and `SearchField` (React Aria).

- `Progress` — 진행 바. `value`(+`minValue`/`maxValue`)로 determinate, `isIndeterminate`로 무한 진행. sm/md/lg 두께, 퍼센트 표시.
- `SearchField` — 검색 입력. 내장 지우기 버튼 + `Escape`로 비우기, `onSubmit`(Enter) 지원.

13개 테스트 통과 (SSR 렌더 — value%, min/max 비율, indeterminate, 검색 input/clear).
