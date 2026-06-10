---
"@kitforge/ui": minor
---

Add `@kitforge/ui` — accessible React components (React Aria) styled with `@kitforge/tokens`.

접근성·키보드·포커스 로직은 React Aria가, 외형은 `@kitforge/tokens` CSS 변수가
담당합니다. 브라우저·OS 편차 없이 동일한 위젯을 제공합니다.

**Phase 1 컴포넌트** (7종):
- `Button` — variant(primary/secondary/outline/ghost/danger) · size(sm/md/lg)
- `TextField` — label · description · error 슬롯
- `Select` + `SelectItem` — 네이티브 `<select>` 대체 (완전 커스텀 팝업)
- `Checkbox` — 커스텀 인디케이터
- `Switch` — iOS 스타일 토글
- `DatePicker` — 캘린더 + 국제화 (kitforge/ui의 원래 출발점, `<input type=date>` 대체)
- `Modal` — 포커스 트랩 · 스크롤 잠금 · Esc/외부 클릭 닫기

**설정**:
- 스타일은 `@kitforge/ui/styles.css` + `@kitforge/tokens/css`를 앱 루트에서 import
- 한국어 날짜는 `<I18nProvider locale="ko-KR">`로 감싸기 (RAC에서 re-export)
- peerDependency: `@kitforge/tokens` · `react` · `react-dom` · `react-aria-components`

41개 테스트 통과 (SSR 렌더 33 + Modal jsdom 클라이언트 렌더 8).
