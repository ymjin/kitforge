---
"@ymjin/ui-native": patch
---

Modal: iOS 접근성에서 창 안 버튼 · 항목을 따로 고를 수 있게 했습니다.

배경 · 본문 `Pressable`이 기본으로 접근성 요소라 iOS가 창 전체를 「제목, 내용, 취소, 삭제」 한 이름으로 합쳐
VoiceOver(와 Maestro 같은 시험 도구)가 확인 버튼 · `Select` 항목을 누를 수 없었습니다. 두 `Pressable`을
`accessible={false}`로, 본문에 `accessibilityViewIsModal`, 제목에 `accessibilityRole="header"`를 줬습니다.
