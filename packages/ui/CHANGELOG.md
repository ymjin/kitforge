# @ymjin/ui

## 0.1.1

### Patch Changes

- Updated dependencies [ec55f83]
  - @ymjin/tokens@0.1.1

## 0.1.0

### Minor Changes

- 530c456: Add standalone `Calendar` component (React Aria `Calendar`).

  `DatePicker`의 팝오버/입력 없이 인라인으로 단일 날짜를 고르는 월 달력입니다.
  `<I18nProvider locale="ko-KR">`로 감싸면 한국어 월·요일 이름이 표시됩니다
  (2026년 6월, 일·월·화…). 기존 `.kf-calendar*` 스타일 재사용 + standalone 래퍼.

- a46e937: Add `@ymjin/ui` — accessible React components (React Aria) styled with `@ymjin/tokens`.

  접근성·키보드·포커스 로직은 React Aria가, 외형은 `@ymjin/tokens` CSS 변수가
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

  - 스타일은 `@ymjin/ui/styles.css` + `@ymjin/tokens/css`를 앱 루트에서 import
  - 한국어 날짜는 `<I18nProvider locale="ko-KR">`로 감싸기 (RAC에서 re-export)
  - peerDependency: `@ymjin/tokens` · `react` · `react-dom` · `react-aria-components`

  41개 테스트 통과 (SSR 렌더 33 + Modal jsdom 클라이언트 렌더 8).

- 7ebb352: Add `@ymjin/ui` Phase 2 — 16 components across form, overlay, integration, and display.

  **폼 완성** (React Aria):

  - `Textarea` · `RadioGroup`+`Radio` · `Combobox`+`ComboboxItem`(검색형 select) · `Slider` · `NumberField`

  **오버레이/피드백**:

  - `Popover` · `Tooltip` · `Drawer`(4방향 placement) · `AlertDialog`(confirm() 대체) · `ToastProvider`+`useToast`(경량 자체 큐)

  **패키지 연동**:

  - `FileUpload` — `@ymjin/storage` Signed PUT URL 직업로드 연동 (`getUploadUrl` → 서버 거치지 않고 스토리지 직접 업로드)
  - `Avatar` — `@ymjin/auth` 세션 user 연동 (`user` prop), 이미지 실패 시 이니셜 폴백 (한국어 이름 지원)

  **표시용 기본**:

  - `Badge` · `Card`(+Header/Body/Footer) · `Spinner` · `Skeleton`

  모두 `@ymjin/tokens` CSS 변수로 스타일링. 88개 테스트 통과 (SSR 렌더 + jsdom 클라이언트 렌더로 portal 컴포넌트 검증).

- 2367f22: Add `@ymjin/ui` Phase 3 — navigation & data components.

  - `Tabs` + `TabList` · `Tab` · `TabPanel` — 키보드 탐색 탭
  - `Accordion` + `AccordionItem` — React Aria `DisclosureGroup` 기반, 다중/단일 확장
  - `DropdownMenu` + `MenuItem` · `MenuSeparator` — 키보드·타입어헤드 지원 메뉴
  - `Table` + `TableHeader` · `TableBody` · `Column` · `Row` · `Cell` — 정렬·행 선택·키보드 탐색
  - `Pagination` — 페이지 범위 + 생략부호(…) 로직, 직접 구현 (headless 불필요)

  모두 `@ymjin/tokens` CSS 변수로 스타일링. 28개 테스트 통과 (Tabs·Table·Pagination SSR 렌더 17 + Accordion·DropdownMenu jsdom 상호작용 11).

- 086ad8b: Add `Progress` and `SearchField` (React Aria).

  - `Progress` — 진행 바. `value`(+`minValue`/`maxValue`)로 determinate, `isIndeterminate`로 무한 진행. sm/md/lg 두께, 퍼센트 표시.
  - `SearchField` — 검색 입력. 내장 지우기 버튼 + `Escape`로 비우기, `onSubmit`(Enter) 지원.

  13개 테스트 통과 (SSR 렌더 — value%, min/max 비율, indeterminate, 검색 input/clear).

### Patch Changes

- b7a5942: Fix `Calendar`/`DatePicker` selected-date alignment. The date cell rendered as
  a plain block, so the number sat at the top of its box and the selected/hover
  background looked offset. The cell now flex-centers its content, aligning the
  background with the number exactly.
- Updated dependencies [3b821c7]
  - @ymjin/tokens@0.1.0
