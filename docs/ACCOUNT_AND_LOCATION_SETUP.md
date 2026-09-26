# 회원가입·위치 기반 방문 가게 확인

## 현재 구현과 외부 설정

- 직접 가입: 이메일·비밀번호(10~128자). 비밀번호 원문 대신 salt+scrypt 해시 저장.
- 소셜 가입: 네이버 또는 구글의 서비스 구분과 불투명 계정 ID만 저장. 이메일로 계정을 임의 병합하지 않음. 이름·전화번호·생년월일·사진·provider 토큰 미저장.
- 필수 정보 처리 안내 버전과 가입 시각 저장. 세션은 7일 유효하며 로그아웃/탈퇴 시 폐기.
- 웹 로그인은 HttpOnly SameSite=Lax 쿠키, 네이티브는 SecureStore에 앱 세션 토큰 저장.
- 지갑 설정과 위치 조회 동의는 계정별 기기에 저장. 계정 간 동기화는 하지 않음.
- 위치: 사용자 안내 및 동의 후 사용 중 위치만 요청. 위치 좌표를 르모아 서버에서 카카오 Local 검색으로 전달. 좌표·이동 기록을 DB나 로그에 저장하지 않음.
- 앱 재실행 시 조회 동의가 있으면 위치 조회를 시작. 현재 지원하는 9개 브랜드의 지점만 검색.
- 가게 1곳이어도 확인을 받음. 여러 후보·위치 오차가 있을 때 지점명, 주소, 거리 목록 제공. GPS로 층을 확정하지 않으며 검색 API가 층 정보를 주지 않는 경우 그 사실을 표시.
- 가게 확인 → 기존 보유 멤버십 혜택 → 결제카드 선택 흐름.

**외부 서비스 계정/키가 아직 제공되지 않았습니다.** 소셜 OAuth와 실제 장소 검색은 연결 코드를 구현하고 모의 응답으로 테스트했지만, 공급자 실서비스 인증/실제 위치 검색은 검증 전입니다. 미설정 기능은 앱에서 준비 중으로 표시합니다. Google/Naver 버튼이 성공했다고 가장하거나 GPS 결과를 생성하지 않습니다.

## 로컬 PC 실행

Node 24 이상. 기존처럼 `mobile`에서 실행합니다.

```sh
npm ci
npm run export:web
npm run preview
```

주소: `http://127.0.0.1:4173/`. 서버는 PC의 loopback에만 연결합니다.
테스트 ID `admin`, 비밀번호 `admin`을 로그인 화면에 입력합니다.
관리자 모드에서 위치 조회 없이 `테스트: 가까운 가게 1곳`, `테스트: 위치 오차·여러 층 가게`를 선택할 수 있습니다. 모든 가상 지점은 테스트 데이터로 표시합니다. 실제 회원 정보를 열람하는 관리 기능은 없습니다.

테스트 관리자는 `npm run preview`의 로컬 모드에만 활성화됩니다. `NODE_ENV=production`에서는 비활성화되고, API는 원격 주소의 관리자 요청도 거부합니다. 공개용 `node server/index.mjs`는 관리자 테스트를 활성화하지 않습니다.

계정 DB는 Git에서 제외된 `server/data/lemoa.sqlite`에 있습니다. 이 폴더를 공개 정적 파일 경로에 포함하지 마세요. 계정 DB는 웹 배포 파일 `mobile/dist`와 분리되어 있습니다.

## 외부 서비스 등록 후 설정

`server/.env.example`를 같은 폴더의 `.env`로 복사하고 해당 PC에서만 값을 입력합니다. `.env`와 DB는 Git에서 제외됩니다. 비밀키를 채팅이나 `EXPO_PUBLIC_*`에 넣지 마세요.

| 항목 | 설정 |
| --- | --- |
| 서비스 주소 | `LEMOA_ORIGIN` — 앱이 사용하는 서버의 정확한 origin |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Naver | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` |
| 카카오 장소 검색 | `KAKAO_REST_API_KEY` |

Google OAuth Web application에 승인된 리디렉션 URI `<LEMOA_ORIGIN>/api/auth/oauth/google/callback`을 등록합니다. 요청 범위는 `openid`뿐입니다. 개발용 테스트 사용자/동의 화면도 공급자 설정에 맞게 등록합니다.

네이버 로그인 애플리케이션에 서비스 URL과 `<LEMOA_ORIGIN>/api/auth/oauth/naver/callback`을 등록합니다. 계정 식별 외 프로필 정보를 필수 수집으로 설정하지 마세요. 공개 사용은 네이버 검수 등 공급자 요구 사항을 충족해야 합니다.

카카오 개발자 앱의 REST API 키로 Local API 사용을 준비하고 API 사용 권한/쿼터를 확인합니다. 한 번의 주변 조회는 9개 브랜드를 각각 검색합니다. 상위 15개/브랜드, 반경 150~1000m(위치 오차에 따라 확대), 최종 최대 40개 지점을 제공합니다. 검색 반경 밖이나 지도 DB에 누락된 가게는 직접 검색으로 선택합니다.

외부 설정 후 서버를 재시작해야 합니다. 기존 동작 중 서버를 중복 실행하지 마세요.

## Android

`EXPO_PUBLIC_API_URL`은 앱에서 접근 가능한 API 주소입니다. Android 에뮬레이터의 PC API 접근은 `http://10.0.2.2:4173`을 사용할 수 있습니다. 실기기와 소셜 인증에는 접근 가능한 HTTPS 서버를 배포해 사용하세요. `127.0.0.1`은 휴대폰에서 PC를 가리키지 않습니다.

위치/보안 저장/라우터 플러그인을 추가했으므로 기존 설치 앱은 새 네이티브 빌드가 필요합니다. `lemoa://auth/callback`을 소셜 인증 후 앱으로 돌아오는 고정 주소로 사용하며, 60초 단일 사용 코드와 PKCE 검증 후 앱 세션을 발급합니다. 다른 리디렉션 주소는 클라이언트 입력으로 받지 않습니다.

실제 기기에서 위치 거부·꺼짐·낮은 정확도·다층 건물과 소셜 브라우저 복귀는 별도 검증이 필요합니다. Android 코드 번들 검사는 기기 검증을 대신하지 않습니다.

## 공개 출시 전 남은 작업

- 배포 주소, TLS, 실제 DB 운영/백업 및 운영자의 개인정보 처리방침·이용약관 확정.
- 이메일 소유 확인과 비밀번호 재설정용 메일 서비스 연결. 현재 직접 가입 이메일은 인증된 이메일로 취급하지 않음.
- 외부 로그인 제공자 등록/심사와 실제 기기에서 로그인·로그아웃 검증.
- 장소 검색 API 연결 및 현장 위치·지점 검증. 제3자 위치 처리 고지는 실제 운영 조건에 맞게 검토.
- 계정별 속도 제한은 현재 단일 서버 프로세스 기준이며 분산 배포 시 공유 저장소로 이전.

## 검증

```sh
cd mobile
npm run lint
npm run typecheck
npm test
npm run test:server
npm run export:web
npx expo export --platform android --output-dir dist-android
```

서버 테스트는 임시 메모리 DB와 공급자 모의 응답을 사용합니다. 계정 테스트 데이터와 위치는 실제 개인 정보가 아닙니다.

## 공식 기술 자료

- [Expo Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Expo SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [Expo WebBrowser](https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [네이버 로그인 API](https://developers.naver.com/docs/login/api/api.md)
- [카카오 Local API](https://developers.kakao.com/docs/ko/local/dev-guide)

## 의존성 점검 기록

2026-09-26: npm audit에서 중간 등급 13개 항목(전이 의존성 포함)이 보고되었습니다. 실제 원인은 decode-uri-component의 비정상 URL 디코딩 처리와 Expo 빌드 도구의 uuid 버퍼 처리입니다. 자동 수정 제안은 Expo/Router의 구버전으로 변경하므로 적용하지 않았습니다. 공개 배포 전 호환되는 상위 패키지 보안 업데이트가 필요합니다. 이 기록은 회원 API의 동작 테스트 결과와 별개입니다.

- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
- https://github.com/advisories/GHSA-w5hq-g745-h8pq
