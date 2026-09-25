# 이미지 및 혜택 출처

확인일: 2026-09-24. 데이터는 실시간 개인 실적 조회가 아닌 공식 안내의 조건부 요약입니다.

## 이미지

정확한 원본 URL과 파일명은 [asset-sources.json](../mobile/src/asset-sources.json)에 기록했습니다. 9개 브랜드는 공식 웹사이트 또는 해당 브랜드의 공식 Google Play 배포 이미지입니다. 카드 4종은 현대카드·롯데카드의 상품 이미지와 하나카드 공식 PDF의 스마트라이프 카드 앞면입니다. 생성형 모델로 로고나 카드를 재현하지 않았습니다.

이미지는 상품 식별을 위한 대표 디자인이며 사용자의 발급 디자인과 다를 수 있습니다. 저작권·상표권은 각 권리자에게 있습니다. 공개된 공식 이미지라는 사실만으로 상업적 재배포 허가가 확인되는 것은 아닙니다. 상업 출시 전 권리자 가이드/허가를 확보해야 하며, 이 자산에 앱 코드의 라이선스를 적용하지 않습니다.

## 결제카드

- [하나 SK패밀리 스마트라이프 공식 안내장](https://m.hanacard.co.kr/leaflet/03/03374_20240828.pdf): 1페이지 상품형 구분, 2페이지 스마트라이프/공통 서비스. 마트 쿠폰을 현장 10% 할인으로 표시하지 않음. OK캐쉬백 0.3~0.9% 구간과 공통 커피 10% 할인, 전월 20만원 조건. PDF 판본은 2024년이며 이후 제휴 변경/커피 세부 한도는 카드사에서 확인하도록 안내.
- [롯데 힐튼 아너스 아멕스 프리미엄](https://www.lottecard.co.kr/app/LPCDADB_V100.lc?vtCdKndC=P14735-A14735): 국내 일반 가맹점 1,500원당 2 힐튼 포인트. 현금 할인율로 환산하지 않음.
- [현대 the Pink Edition3 공식 설명](https://card.hyundaicard.com/include2026/event/wpr_p.html): 이벤트 가입 캐시백을 상시 혜택에 넣지 않음. 기본 1.5%/전월50만원, 쇼핑5%/전월100만원. 올리브영 패션·뷰티 월3만 M포인트. 다른 에디션과 혼용하지 않음.
- [현대 ZERO Edition3 포인트형 상품 가이드북](https://www.hyundaicard.com/upload/card/ZERO%20Edition3%28%ED%8F%AC%EC%9D%B8%ED%8A%B8%ED%98%95%29%20%EC%83%81%ED%92%88%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf): 실적/한도 없이 1.2% M포인트, 선불 충전/무이자/자체 할인 등 제외.

M포인트·힐튼 포인트·OK캐쉬백은 서로 다른 단위입니다. 최적 카드 순위를 만들지 않고 사용자 주카드를 우선 표시합니다. 이용금액·실적·잔여 한도를 수집하지 않으므로 실제 확정 혜택이나 복수 할인 합산액을 계산하지 않습니다.

## 멤버십

- [SKT 파리바게뜨](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=1053), [SKT 브랜드 안내](https://m.tworld.co.kr/membership/benefit/brand): 모바일 바코드 기준 파리바게뜨/CU VIP·GOLD 1천원당100원 또는100P, SILVER50원 또는50P. 할인형/적립형 별도 설정.
- [SKT 파파존스](https://sktmembership.tworld.co.kr/mps/pc-bff/benefitbrand/detail.do?brandId=329): VIP30%, GOLD·SILVER15%, 할인형/적립형 구분.
- [아웃백 SKT·KT](https://m.outback.co.kr/partner/cashback.do?menuIdx=52): SKT VIP·GOLD15%, SILVER5%; KT VVIP·VIP·GOLD15%, 그 외5%. 횟수/한도/제외 안내는 화면과 공식 링크 참조.
- [파리바게뜨 KT](https://www.paris.co.kr/affiliate-card/kt-%EB%A9%A4%EB%B2%84%EC%8B%AD/): 상위3등급 1천원당100원, 나머지50원. 포인트 차감·일1회·결제금액20만원 한도.
- [LG U+ 등급별 안내](https://www.lguplus.com/ujam/55): 파리바게뜨 VVIP·VIP100원/1천원, 우수50원/1천원.
- [아웃백 자체 멤버십](https://m.outback.co.kr/benefit/membershipBenefit.do): WELCOME·SILVER2%, GOLD·PLATINUM3% 적립 또는10% 할인. 할인과 적립은 선택이며 할인은 타 제휴 할인 중복 불가.
- [KT 공식 앱](https://play.google.com/store/apps/details?id=com.olleh.android.oc2&hl=ko), [LG U+one 공식 앱](https://play.google.com/store/apps/details?id=com.lguplus.mobile.cs&hl=ko): Android 앱 첫 화면으로 연결. LG 멤버십은 U+one 앱에서 확인.

멤버십별 로그인·개인등급 조회 API 연동은 구현하지 않았습니다. 통신사와 아웃백의 등급은 직접 선택하고 저장합니다. 기타 브랜드는 공식 앱에 표시된 등급을 메모로 저장하며, 확인되지 않은 등급별 혜택률을 추정하지 않습니다. 특정 통신사가 추가되었다고 9개 브랜드 전체에 해당 통신사의 상시 혜택이 있다는 뜻은 아닙니다. 한시적 행사·구독상품은 상시 제휴로 등록하지 않습니다.
