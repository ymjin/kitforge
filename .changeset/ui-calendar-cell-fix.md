---
"@kitforge/ui": patch
---

Fix `Calendar`/`DatePicker` selected-date alignment. The date cell rendered as
a plain block, so the number sat at the top of its box and the selected/hover
background looked offset. The cell now flex-centers its content, aligning the
background with the number exactly.
