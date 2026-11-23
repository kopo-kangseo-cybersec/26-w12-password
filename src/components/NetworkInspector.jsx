export default function NetworkInspector() {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <span className="badge badge-primary">원리 심층 분석</span>
          <h2 className="card-title">📡 Network 탭 검증 가이드 & k-익명성 원리</h2>
          <p className="card-desc">
            과제 평가 기준: 개발자 도구(<code>F12</code>) → <strong>Network</strong> 탭에서 실제로 외부로 나간 요청을
            확인하고 <code>README.md</code>에 기록해야 합니다.
          </p>
        </div>
      </div>

      {/* k-익명성 도해 */}
      <div className="flow-container">
        <h3 className="flow-title">k-익명성(k-Anonymity) 4단계 동작 메커니즘</h3>

        <div className="flow-steps-grid">
          <div className="flow-step-card">
            <div className="step-num">Step 1</div>
            <h4>비밀번호 입력</h4>
            <p>사용자가 <code>"password"</code>를 입력합니다. 이 값은 오직 브라우저 메모리에만 머뭅니다.</p>
          </div>

          <div className="flow-step-card">
            <div className="step-num">Step 2</div>
            <h4>로컬 SHA-1 해시화</h4>
            <p>
              Web Crypto API로 40자리 해시 생성:
              <br />
              <code className="code-snippet">
                <span className="hl-prefix">5BAA6</span>
                <span className="hl-suffix">1E4C9B93F3F0...</span>
              </code>
            </p>
          </div>

          <div className="flow-step-card">
            <div className="step-num">Step 3</div>
            <h4>앞 5글자만 외부 전송</h4>
            <p>
              서버에 보내는 것은 오직 접두사뿐:
              <br />
              <code className="code-snippet">GET /range/5BAA6</code>
            </p>
          </div>

          <div className="flow-step-card">
            <div className="step-num">Step 4</div>
            <h4>브라우저 내부 대조</h4>
            <p>
              서버가 보낸 500여 개의 접미사 목록에서 내 접미사가 있는지 <strong>브라우저가 직접</strong> 찾습니다.
            </p>
          </div>
        </div>
      </div>

      {/* F12 Network 탭 검증 가이드 */}
      <div className="how-to-verify-box">
        <h3>🔍 개발자 도구 Network 탭 확인 실습 방법</h3>
        <ol className="verify-list">
          <li>
            브라우저에서 <strong>F12</strong> (또는 <code>Ctrl + Shift + I</code>)를 눌러 개발자 도구를 엽니다.
          </li>
          <li>
            상단 탭 중 <strong>Network(네트워크)</strong> 탭을 클릭하고, 필터를 <strong>Fetch/XHR</strong>로 설정합니다.
          </li>
          <li>
            첫 번째 탭의 검사기에서 <strong>"HIBP 유출 이력 확인"</strong> 버튼을 누릅니다.
          </li>
          <li>
            목록에 나타난 <code>5BAA6</code> (혹은 입력한 비밀번호의 5자리 해시) 요청을 클릭하고 <strong>Headers</strong>를 확인합니다.
          </li>
          <li>
            <strong>Request URL:</strong> <code>https://api.pwnedpasswords.com/range/5BAA6</code> 형태로 5글자만 찍혀 있는 것을 확인합니다.
          </li>
        </ol>
      </div>

      {/* 보안 분석 문답 */}
      <div className="faq-grid">
        <div className="faq-card">
          <h4>Q. 왜 Math.random() 대신 crypto.getRandomValues()를 써야 하나요?</h4>
          <p>
            <code>Math.random()</code>은 의사 난수 생성기(PRNG)로 이전 출력값들을 알면 다음 난수를 수학적으로 예측할 수 있습니다.
            반면 <code>crypto.getRandomValues()</code>는 운영체제의 암호학적 엔트로피 풀(CSPRNG)을 사용하므로 다음 난수를 예측할 수 없어 비밀번호 생성에 필수적입니다.
          </p>
        </div>

        <div className="faq-card">
          <h4>Q. k-익명성이 완전한 익명이 아닌 이유는 무엇인가요?</h4>
          <p>
            비밀번호 원문은 서버에 전달되지 않지만, 사용자의 IP 주소, 요청 시각, 그리고 해시의 앞 5글자는 서버에 기록됩니다.
            따라서 비밀번호의 세부 내용은 완벽히 보호되지만, "이 IP의 사용자가 특정 시점에 비밀번호 유출 여부를 조회했다"는 사실 자체는 서버 관리자가 알 수 있습니다.
          </p>
        </div>

        <div className="faq-card">
          <h4>Q. Add-Padding: true 헤더의 역할은 무엇인가요?</h4>
          <p>
            공격자가 네트워크 패킷 크기(Response Size)를 감청하여 특정 해시 접두사에 해당하는 비밀번호 목록의 크기를 추측하는 사이드 채널 공격을 막기 위해,
            응답에 가짜 데이터(유출횟수 0)를 랜덤하게 채워 넣어 패킷 크기를 균일화하는 기법입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
