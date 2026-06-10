---
"@kitforge/ui": minor
---

Add `@kitforge/ui` Phase 2 — 16 components across form, overlay, integration, and display.

**폼 완성** (React Aria):
- `Textarea` · `RadioGroup`+`Radio` · `Combobox`+`ComboboxItem`(검색형 select) · `Slider` · `NumberField`

**오버레이/피드백**:
- `Popover` · `Tooltip` · `Drawer`(4방향 placement) · `AlertDialog`(confirm() 대체) · `ToastProvider`+`useToast`(경량 자체 큐)

**패키지 연동**:
- `FileUpload` — `@kitforge/storage` Signed PUT URL 직업로드 연동 (`getUploadUrl` → 서버 거치지 않고 스토리지 직접 업로드)
- `Avatar` — `@kitforge/auth` 세션 user 연동 (`user` prop), 이미지 실패 시 이니셜 폴백 (한국어 이름 지원)

**표시용 기본**:
- `Badge` · `Card`(+Header/Body/Footer) · `Spinner` · `Skeleton`

모두 `@kitforge/tokens` CSS 변수로 스타일링. 88개 테스트 통과 (SSR 렌더 + jsdom 클라이언트 렌더로 portal 컴포넌트 검증).
