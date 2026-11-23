import { useState, useId } from 'react';
import { evaluatePasswordStrength, checkPwnedPassword } from '../utils/cryptoUtils';

export default function PasswordInspector({ password, onPasswordChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [pwnedResult, setPwnedResult] = useState(null);
  const [pwnedError, setPwnedError] = useState(null);

  const passwordInputId = useId();

  // 브라우저 내부 실시간 강도 평가
  const strength = evaluatePasswordStrength(password);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onPasswordChange(val);
    // 비밀번호가 바뀌면 이전 유출 검사 결과 리셋
    if (pwnedResult || pwnedError) {
      setPwnedResult(null);
      setPwnedError(null);
    }
  };

  const handleClear = () => {
    onPasswordChange('');
    setPwnedResult(null);
    setPwnedError(null);
  };

  const handleCheckPwned = async () => {
    if (!password) return;

    setIsCheckingPwned(true);
    setPwnedResult(null);
    setPwnedError(null);

    try {
      const result = await checkPwnedPassword(password);
      setPwnedResult(result);
    } catch (err) {
      setPwnedError(err.message || '유출 확인 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsCheckingPwned(false);
    }
  };

  return (
    <section className="card inspector-card" aria-labelledby="inspector-heading">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-badge">기능 A & B</span>
          <h2 id="inspector-heading" className="card-title">비밀번호 강도 및 유출 검사기</h2>
        </div>
        <span className="card-hint">클라이언트 실시간 진단</span>
      </div>

      {/* 입력 영역 */}
      <div className="input-group">
        <label htmlFor={passwordInputId} className="input-label">
          점검할 비밀번호 입력
        </label>
        <div className="password-input-wrapper">
          <input
            id={passwordInputId}
            type={showPassword ? 'text' : 'password'}
            className="text-input"
            value={password}
            onChange={handleInputChange}
            placeholder="비밀번호를 입력하여 보안성을 진단하세요"
            autoComplete="off"
            spellCheck="false"
          />
          {password && (
            <button
              type="button"
              className="icon-action-btn"
              onClick={handleClear}
              aria-label="입력 지우기"
              title="입력 지우기"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className="icon-action-btn toggle-eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 강도 게이지 바 */}
      <div className="strength-container">
        <div className="strength-header">
          <span className="strength-title">실시간 보안 강도</span>
          <span
            className="strength-label-badge"
            style={{ backgroundColor: `${strength.color}22`, color: strength.color, borderColor: strength.color }}
          >
            {password ? strength.label : '입력 대기'}
          </span>
        </div>

        <div className="progress-track" role="progressbar" aria-valuenow={strength.percent} aria-valuemin="0" aria-valuemax="100">
          <div
            className="progress-fill"
            style={{
              width: `${password ? strength.percent : 0}%`,
              backgroundColor: strength.color,
              boxShadow: password ? `0 0 12px ${strength.color}88` : 'none',
            }}
          />
        </div>

        <div className="strength-scale">
          <span className={strength.score >= 1 && password ? 'active' : ''}>매우 약함</span>
          <span className={strength.score >= 2 ? 'active' : ''}>약함</span>
          <span className={strength.score >= 3 ? 'active' : ''}>보통</span>
          <span className={strength.score >= 4 ? 'active' : ''}>강함</span>
        </div>
      </div>

      {/* 평가 기준 체크리스트 */}
      <div className="checklist-container">
        <div className="checklist-title">보안 요소 체크리스트</div>
        <div className="checklist-grid">
          <div className={`check-item ${strength.checklist.length ? 'met' : ''}`}>
            <span className="check-icon">{strength.checklist.length ? '✓' : '✕'}</span>
            <span className="check-text">
              길이 8자 이상
              <span className="check-subtext">
                {password.length < 8
                  ? ` (현재 ${password.length}자: 매우 약함)`
                  : password.length <= 11
                  ? ` (현재 ${password.length}자: 기본)`
                  : password.length <= 15
                  ? ` (현재 ${password.length}자: 우수)`
                  : ` (현재 ${password.length}자: 최고점)`}
              </span>
            </span>
          </div>

          <div className={`check-item ${strength.checklist.hasUpper ? 'met' : ''}`}>
            <span className="check-icon">{strength.checklist.hasUpper ? '✓' : '✕'}</span>
            <span className="check-text">대문자 (A-Z) 포함</span>
          </div>

          <div className={`check-item ${strength.checklist.hasLower ? 'met' : ''}`}>
            <span className="check-icon">{strength.checklist.hasLower ? '✓' : '✕'}</span>
            <span className="check-text">소문자 (a-z) 포함</span>
          </div>

          <div className={`check-item ${strength.checklist.hasNumber ? 'met' : ''}`}>
            <span className="check-icon">{strength.checklist.hasNumber ? '✓' : '✕'}</span>
            <span className="check-text">숫자 (0-9) 포함</span>
          </div>

          <div className={`check-item ${strength.checklist.hasSpecial ? 'met' : ''}`}>
            <span className="check-icon">{strength.checklist.hasSpecial ? '✓' : '✕'}</span>
            <span className="check-text">특수문자 (!@#$%^&* 등) 포함</span>
          </div>
        </div>
      </div>

      {/* 취약 패턴 감점 경고창 */}
      {strength.warnings.length > 0 && (
        <div className="warning-box" role="alert">
          <div className="warning-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <strong>취약 패턴 감점 경고</strong>
          </div>
          <ul className="warning-list">
            {strength.warnings.map((warn) => (
              <li key={warn}>{warn}</li>
            ))}
          </ul>
          {strength.isCompromisedPattern && (
            <p className="warning-penalty">
              * 취약 키보드/연속 패턴 감지로 인해 종합 강도가 <strong>'약함' 이하로 강제 하향</strong>되었습니다.
            </p>
          )}
        </div>
      )}

      {/* k-익명성 기반 유출 확인 섹션 */}
      <div className="leak-check-section">
        <div className="leak-header">
          <div>
            <h3 className="section-subtitle">k-익명성 기반 유출 조회 (HIBP Range API)</h3>
            <p className="section-desc">비밀번호 원문이나 40자리 전체 해시는 절대 전송되지 않습니다.</p>
          </div>
          <button
            type="button"
            className="action-btn btn-primary"
            onClick={handleCheckPwned}
            disabled={!password || isCheckingPwned}
          >
            {isCheckingPwned ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>조회 중...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>유출 여부 확인</span>
              </>
            )}
          </button>
        </div>

        {/* 에러 발생 시 */}
        {pwnedError && (
          <div className="alert-banner alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{pwnedError}</span>
          </div>
        )}

        {/* 유출 확인 결과 */}
        {pwnedResult && (
          <div className={`pwned-result-card ${pwnedResult.pwned ? 'is-leaked' : 'is-safe'}`}>
            <div className="result-main">
              {pwnedResult.pwned ? (
                <>
                  <div className="result-badge badge-danger">
                    <span className="dot"></span> 유출 위험 감지
                  </div>
                  <h4 className="result-headline danger-text">
                    유출됨! {pwnedResult.count.toLocaleString()}회 노출됨
                  </h4>
                  <p className="result-subtext">
                    실제 발생한 데이터 유출 사고 목록에서 일치하는 비밀번호가 발견되었습니다. 즉시 다른 비밀번호로 변경하세요.
                  </p>
                </>
              ) : (
                <>
                  <div className="result-badge badge-safe">
                    <span className="dot"></span> 유출 내역 없음
                  </div>
                  <h4 className="result-headline safe-text">
                    확인된 데이터 유출 내역이 없습니다
                  </h4>
                  <p className="result-subtext">
                    Have I Been Pwned의 수억 건 유출 데이터베이스와 대조 결과 해당 비밀번호는 노출되지 않았습니다.
                  </p>
                </>
              )}
            </div>

            {/* k-익명성 프로세스 및 Network 전송 검증 시각화 */}
            <div className="k-anonymity-visualizer">
              <div className="visualizer-header">
                <span className="visualizer-title">🔬 최소 전송 원칙 검증 다이어그램</span>
                <span className="padding-indicator">Add-Padding: 가짜 {pwnedResult.paddingFiltered}건 필터링 완료</span>
              </div>

              <div className="flow-steps">
                <div className="flow-step">
                  <div className="step-num">Step 1</div>
                  <div className="step-content">
                    <span className="step-label">브라우저 내 SHA-1 해시 계산</span>
                    <code className="hash-code">
                      <span className="highlight-prefix">{pwnedResult.prefix}</span>
                      <span className="muted-suffix">{pwnedResult.suffix}</span>
                    </code>
                    <span className="step-note">(대문자 40자리 변환 완료)</span>
                  </div>
                </div>

                <div className="flow-step">
                  <div className="step-num">Step 2</div>
                  <div className="step-content">
                    <span className="step-label">외부 네트워크 전송 (앞 5자리만 전송)</span>
                    <code className="url-code">{pwnedResult.requestedUrl}</code>
                    <span className="step-note">헤더: Add-Padding: true 전송</span>
                  </div>
                </div>

                <div className="flow-step">
                  <div className="step-num">Step 3</div>
                  <div className="step-content">
                    <span className="step-label">브라우저 내부 대조</span>
                    <span className="step-desc">
                      수신된 {pwnedResult.totalReturned}개 해시 중 뒤 35자리(
                      <code className="mini-code">{pwnedResult.suffix.slice(0, 8)}...</code>)를 브라우저 메모리에서 직접 대조
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
