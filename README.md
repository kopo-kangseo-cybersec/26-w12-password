# 비밀번호 보안 도구 (`26-w12-password`)

> 실습 안내와 완성 기준은 [`guide.md`](./guide.md)를 참고하세요.

## 소개

**비밀번호 점검소**: 비밀번호 점검 대시보드 형태의 웹앱

- 한 페이지에 카드 3개 배치: 강도 검사 / 안전한 생성기 / 유출 여부 확인
- 생성기에서 만든 비밀번호를 복사해 강도 검사·유출 확인에 바로 넣어 볼 수 있는 흐름
- 라이트/다크 모드 전환, 입력창 보기/숨기기 버튼 지원

## Vite 프로젝트 직접 구성 경험

1. 지난주와 달랐던 점
   - 지난주에는 `package.json`, `vite.config.js`가 이미 있어서 코드만 작성하면 됐음
   - 이번에는 framework(React), variant(JavaScript), linter를 직접 고르고, 배포 설정(`base: './'`, `gh-pages`, `deploy` 스크립트)도 직접 추가함
   - 템플릿 안에 미리 들어 있던 설정 하나하나가 왜 필요한지 알게 됨 (예: `base: './'`가 없으면 GitHub Pages 하위 경로에서 흰 화면)
   - 기본 데모 화면(App.jsx, App.css, index.css)을 지우고 처음부터 다시 구성함
2. README.md와 .gitignore 덮어쓰기
   - 기존 파일이 있어도 생성 도구가 아무 말 없이 덮어쓸 수 있다는 점을 확인함. 그래서 `Remove existing files` 대신 `Ignore files and continue`를 골라 guide.md와 .github를 지킴
   - Vite 기본 `.gitignore`는 `*.local`만 막고 있어서 `.env` 파일은 그대로 커밋될 수 있었음
   - 추가한 규칙: `.env`, `.env.*` (단, 변수 이름만 공유하는 `!.env.example`은 예외)
   - 이번 앱은 API 키가 없지만, 프로젝트를 만들 때 비밀 파일 차단부터 해 두는 습관이 필요함

## 나의 AI 기획·구현 과정

1. AI 협업 방식
   - Claude 채팅으로 기능을 한 단계씩 나눠 요청하고, 받은 코드를 직접 파일에 적용하고 브라우저에서 확인한 뒤 커밋하는 방식
   - 기능마다 컴포넌트 파일을 분리 (`StrengthChecker.jsx`, `Generator.jsx`, `LeakChecker.jsx`)
   - 기능 하나가 동작할 때마다 커밋해서 세이브포인트를 남김
2. 강도 기준
   - 조건 5가지: 12자 이상 / 소문자 / 대문자 / 숫자 / 특수문자
   - 통과 개수로 점수 계산: 5개 강함(초록), 3~4개 보통(주황), 0~2개 약함(빨강)
   - 점수만큼 색 막대가 차오르게 표시하고, 조건별 통과 여부도 함께 보여 줌
3. 막혔던 문제와 해결
   - `git clone` 없이 주소만 입력해서 PowerShell 에러 → 명령어 앞부분을 빠뜨린 것을 확인하고 다시 실행
   - Vite 8 기본 `index.css`(가운데 정렬, 폭 제한, 큰 제목 등)가 카드 레이아웃과 충돌 → 데모 전용 스타일을 지우고 CSS 변수로 다시 작성
   - 처음 만든 생성기는 숫자를 체크해도 숫자가 하나도 안 들어갈 수 있었음 → 체크한 종류마다 1글자씩 먼저 넣고, 나머지를 채운 뒤 crypto 난수로 순서를 섞도록 수정
   - 처음에 linter를 ESLint로 골랐음 → guide와 맞추기 위해 ESLint 패키지를 지우고 Oxlint로 바꾼 뒤 `npm run lint` 통과 확인

## 보안 점검 (사이버보안과 체크포인트)

1. `crypto.getRandomValues()`를 써야 하는 이유
   - `Math.random()`은 암호용이 아닌 의사난수라, 출력값 몇 개로 내부 상태를 추정해 다음 값을 예측할 수 있음
   - `crypto.getRandomValues()`는 운영체제의 암호학적 난수 생성기를 써서 예측이 사실상 불가능함
   - 생성기의 글자 뽑기와 순서 섞기 모두 `crypto.getRandomValues()`만 사용
2. Network 탭에서 확인한 실제 요청
   - 요청 주소: `https://api.pwnedpasswords.com/range/5BAA6` (테스트 비밀번호 `password`)
   - Request headers의 `:path`도 `/range/5BAA6`이라 앞 5글자만 전송됨
   - 비밀번호 원문과 전체 해시(40글자)는 주소·헤더 어디에도 없음
   - 해시 비교는 대문자로 맞춘 뒤(`toUpperCase()`) 브라우저 안에서만 함
   - 입력한 비밀번호는 `console.log`, `localStorage` 어디에도 남기지 않음
3. k-익명성으로도 서버가 알 수 있는 정보
   - 해시 앞 5글자 (내 비밀번호가 그 접두어를 가진 수백 개 후보 중 하나라는 것)
   - 요청한 IP 주소, 요청 시각, 브라우저 정보(User-Agent 등)
   - 즉 비밀번호 자체는 지키지만, 누가 언제 조회했다는 사실까지 숨기지는 못함

## 실행 및 배포 링크

- Netlify 배포 URL: https://glittery-kleicha-0429a8.netlify.app/
- GitHub Pages 배포 URL: https://mojodori.github.io/26-w12-password/

## 나만의 확장 기능

- **Add-Padding 헤더 적용**: 유출 확인 요청에 `Add-Padding: true`를 넣어 서버가 유출 횟수 0인 가짜 항목을 섞어 보내게 함. 응답 크기로 접두어를 추측하기 어려워짐. 가짜 항목은 횟수가 0이라 대조 단계에서 자동으로 걸러짐 (Network 탭 Request headers에서 `Add-Padding: true` 확인)
- **생성기 보완**: 체크한 문자 종류가 최소 1글자씩 반드시 포함되도록 하고, crypto 난수로 순서 섞기
- **강도 색 막대**: 점수에 따라 빨강/주황/초록 막대 표시
- **보기/숨기기 버튼**: 강도 검사·유출 확인 입력창에서 비밀번호 표시 전환
- **라이트/다크 모드**: CSS 변수로 색을 관리하고, 처음에는 컴퓨터 설정을 따라감