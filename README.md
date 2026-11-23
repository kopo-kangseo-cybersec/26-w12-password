# 비밀번호 보안 도구 (`26-w12-password`)

> 이 README는 실습을 완성한 뒤, 배포 직전 단계에서 직접 채워 넣습니다.
> 실습 안내와 완성 기준은 [`guide.md`](./guide.md)를 참고하세요.

## 소개

브라우저 안에서 비밀번호 강도를 점검하고, `crypto.getRandomValues()` 기반 생성기로 안전한 비밀번호를 만듭니다. Have I Been Pwned의 range API를 사용해 유출 여부도 확인합니다. 라이트·다크 테마를 선택할 수 있으며, 입력한 비밀번호는 저장하지 않습니다.

## Vite 프로젝트 직접 구성 경험

<!--
1. 빈 저장소에서 `npm create vite@latest .`로 직접 프로젝트를 차려 보니, 지난주(미리 준비된 템플릿)와 비교해 무엇이 달랐나요?
2. `create-vite`가 README.md와 .gitignore를 덮어쓴 것을 보고 무엇을 느꼈나요? .gitignore에 무엇을 추가했고, 왜 필요한가요?
-->

## 나의 AI 기획·구현 과정

<!--
1. 어떤 AI 협업 방식을 선택했나요? (Gemini 웹 기획 → Antigravity IDE 구현 / Antigravity Implementation Plan / VS Code Copilot 병행 등)
2. 비밀번호 "강도"의 기준을 어떻게 정했나요?
3. 구현 중 가장 막혔던 문제는 무엇이었고, 어떻게 해결했나요?
-->

## 보안 점검 (사이버보안과 체크포인트)

### Network 탭 검증 결과

- 검증용 공개 예시 `password`로 확인한 요청: `GET https://api.pwnedpasswords.com/range/5BAA6`
- 요청 경로에는 SHA-1 해시 앞 5글자만 포함되며, 비밀번호와 전체 해시는 전송하지 않습니다. 응답의 나머지 해시 대조는 브라우저 안에서 수행합니다.
- 서버는 요청한 5글자 접두사와 IP 주소, 요청 시각을 볼 수 있으므로 완전한 익명은 아닙니다.

<!--
1. 비밀번호 생성에 Math.random() 대신 crypto.getRandomValues()를 써야 하는 이유는 무엇인가요?
2. 유출 확인 시 Network 탭에서 확인한 실제 요청 주소를 그대로 적어 주세요. (예: https://api.pwnedpasswords.com/range/XXXXX)
   비밀번호나 전체 해시가 전송되지 않았나요?
3. k-익명성 방식으로도 서버가 알 수 있는 정보는 무엇인가요? (완전한 익명이 아닌 이유)
-->

## 실행 및 배포 링크

- Netlify 배포 URL:
- GitHub Pages 배포 URL:

## 나만의 확장 기능

<!-- 기본 4가지 기준 외에 추가한 기능(예: Add-Padding 적용, AES 암호화 금고 탭, 흔한 패턴 감지 등)을 적어 주세요 -->
