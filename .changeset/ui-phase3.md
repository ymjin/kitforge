---
"@kitforge/ui": minor
---

Add `@kitforge/ui` Phase 3 — navigation & data components.

- `Tabs` + `TabList` · `Tab` · `TabPanel` — 키보드 탐색 탭
- `Accordion` + `AccordionItem` — React Aria `DisclosureGroup` 기반, 다중/단일 확장
- `DropdownMenu` + `MenuItem` · `MenuSeparator` — 키보드·타입어헤드 지원 메뉴
- `Table` + `TableHeader` · `TableBody` · `Column` · `Row` · `Cell` — 정렬·행 선택·키보드 탐색
- `Pagination` — 페이지 범위 + 생략부호(…) 로직, 직접 구현 (headless 불필요)

모두 `@kitforge/tokens` CSS 변수로 스타일링. 28개 테스트 통과 (Tabs·Table·Pagination SSR 렌더 17 + Accordion·DropdownMenu jsdom 상호작용 11).
