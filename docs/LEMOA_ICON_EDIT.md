# 르모아 아이콘 편집 기록

2026-09-25. 사용자 제공 르모아 로고의 내부 심볼과 레터링을 확대했습니다.
방식: 내장 imagegen 이미지 편집. CLI 및 실행 중 AI 기능을 사용하지 않았습니다.
결과: `mobile/assets/identity/lemoa.png`. 앱 헤더, 장식 로고, Android 아이콘과 웹 파비콘에서 공통 사용합니다.

## 최종 편집 프롬프트

Use case: precise-object-edit. Edit this Le Moa app icon. Preserve the square canvas, rounded-square outline, lavender-to-coral gradient background and the exact design of the white symbol and custom Korean lettering. Enlarge only the central white symbol and lettering '르모아' together by about 20% around their combined center to improve small-icon readability. Maintain relative placement: symbol above lettering, and the arrow integrated into 르. Text must remain exactly '르모아'. Keep all white shapes fully within the icon with comfortable margins. Do not invent a new symbol or font, add text, shadows or change background. Output a single square app icon.

20%는 편집 요청의 목표이며 픽셀 단위의 정확한 확대율을 뜻하지 않습니다.
