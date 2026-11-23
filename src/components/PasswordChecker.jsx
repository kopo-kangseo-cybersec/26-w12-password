import { useState, useId } from 'react'
import { evaluatePasswordStrength, checkPwnedPassword } from '../utils/crypto'

export default function PasswordChecker({ initialPassword = '', onSendToVault }) {
  const [password, setPassword] = useState(initialPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [addPadding, setAddPadding] = useState(true)
  const [loading, setLoading] = useState(false)
  const [leakResult, setLeakResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const passwordInputId = useId()
  const paddingCheckboxId = useId()

  const strength = evaluatePasswordStrength(password)

  const handleCheckPwned = async () => {
    if (!password) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const result = await checkPwnedPassword(password, { addPadding })
      setLeakResult(result)
    } catch (err) {
      setErrorMsg(err.message || '유출 확인 요청 중 오류가 발생했습니다.')
      setLeakResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPassword('')
    setLeakResult(null)
    setErrorMsg(null)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">🔍 실시간 비밀번호 강도 & 유출 확인</h2>
          <p className="card-desc">
            입력된 비밀번호는 브라우저 외부로 전송되지 않으며, 유출 확인 시에도 <strong>SHA-1 해시 앞 5글자만</strong> 전송됩니다.
          </p>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={passwordInputId} className="form-label">
          점검할 비밀번호
        </label>
        <div className="input-with-actions">
          <input
            id={passwordInputId}
            type={showPassword ? 'text' : 'password'}
            className="input-field"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (leakResult) setLeakResult(null)
            }}
            placeholder="점검할 비밀번호를 입력하세요 (예: password, SafeP@ssw0rd!2026)"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '비밀번호 가리기' : '비밀번호 보기'}
          >
            {showPassword ? '🙈 숨기기' : '👁️ 보기'}
          </button>
          {password && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClear}
              title="비우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 실시간 강도 게이지 */}
      <div className="strength-container">
        <div className="strength-header">
          <div className="strength-label-group">
            <span className="strength-tag" style={{ backgroundColor: strength.color }}>
              {strength.label}
            </span>
            <span className="entropy-tag">추정 엔트로피: <strong>{strength.entropy} bits</strong></span>
          </div>
          <span className="strength-score">{strength.percentage}%</span>
        </div>

        <div className="strength-bar-bg">
          <div
            className="strength-bar-fill"
            style={{
              width: `${strength.percentage}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>

        {/* 조합 요건 칩 */}
        <div className="metrics-grid">
          <span className={`metric-chip ${strength.metrics.hasLength ? 'valid' : ''}`}>
            {strength.metrics.hasLength ? '✓' : '✗'} 12자 이상
          </span>
          <span className={`metric-chip ${strength.metrics.hasUpper ? 'valid' : ''}`}>
            {strength.metrics.hasUpper ? '✓' : '✗'} 대문자(A-Z)
          </span>
          <span className={`metric-chip ${strength.metrics.hasLower ? 'valid' : ''}`}>
            {strength.metrics.hasLower ? '✓' : '✗'} 소문자(a-z)
          </span>
          <span className={`metric-chip ${strength.metrics.hasNumber ? 'valid' : ''}`}>
            {strength.metrics.hasNumber ? '✓' : '✗'} 숫자(0-9)
          </span>
          <span className={`metric-chip ${strength.metrics.hasSymbol ? 'valid' : ''}`}>
            {strength.metrics.hasSymbol ? '✓' : '✗'} 특수문자(!@#$)
          </span>
          <span className={`metric-chip ${!strength.metrics.hasCommonPattern ? 'valid' : 'warning'}`}>
            {!strength.metrics.hasCommonPattern ? '✓ 취약 패턴 없음' : '⚠️ 취약 패턴 감지'}
          </span>
        </div>

        {/* 보안 피드백 목록 */}
        <ul className="feedback-list">
          {strength.feedback.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      {/* 유출 확인 섹션 */}
      <div className="pwned-section">
        <div className="pwned-controls">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCheckPwned}
            disabled={!password || loading}
          >
            {loading ? 'k-익명성 검증 중...' : '🌐 HIBP 유출 이력 확인 (k-익명성)'}
          </button>

          <label htmlFor={paddingCheckboxId} className="checkbox-label" title="가짜 항목을 섞어 응답 패킷 크기로 비밀번호를 추측하지 못하게 차단">
            <input
              id={paddingCheckboxId}
              type="checkbox"
              checked={addPadding}
              onChange={(e) => setAddPadding(e.target.checked)}
            />
            <span>Add-Padding: true 헤더 적용 (트래픽 분석 방지)</span>
          </label>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <strong>요청 실패:</strong> {errorMsg}
          </div>
        )}

        {leakResult && (
          <div className={`leak-result-card ${leakResult.pwned ? 'leak-danger' : 'leak-safe'}`}>
            <div className="leak-header">
              <span className="leak-icon">{leakResult.pwned ? '🚨' : '🛡️'}</span>
              <div>
                <h3 className="leak-title">
                  {leakResult.pwned
                    ? `유출 이력 감지됨: ${leakResult.count.toLocaleString()}회 발견!`
                    : '안전함: 알려진 해킹 사고에서 유출되지 않은 비밀번호입니다.'}
                </h3>
                <p className="leak-sub">
                  {leakResult.pwned
                    ? '이 비밀번호는 Have I Been Pwned 데이터베이스에 등록된 실제 유출 비밀번호입니다. 즉시 다른 비밀번호로 교체하세요.'
                    : 'k-익명성 조회 결과 수 억 개의 유출 데이터베이스에 일치하는 기록이 없습니다.'}
                </p>
              </div>
            </div>

            {/* k-익명성 네트워크 전송 증명 패널 */}
            <div className="audit-box">
              <div className="audit-title">📡 Network 탭 전송 내역 검증 (최소 전송 원칙)</div>
              <div className="audit-grid">
                <div className="audit-item">
                  <span className="audit-label">실제 전송된 요청 URL:</span>
                  <code className="audit-value">{leakResult.requestUrl}</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">외부로 전송된 해시 접두사:</span>
                  <code className="audit-value highlight-prefix">{leakResult.prefix} (단 5글자)</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">브라우저 로컬에서 대조한 접미사:</span>
                  <code className="audit-value highlight-suffix">{leakResult.suffix} (35글자, 외부 미전송)</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">원문 비밀번호 전송 여부:</span>
                  <span className="audit-value safe-badge">❌ 0% (완전 미전송, 로컬 연산만 수행)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {onSendToVault && password && (
        <div className="card-footer-action">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onSendToVault(password)}
          >
            🔐 이 비밀번호로 암호화 금고 시뮬레이션 하기 →
          </button>
        </div>
      )}
    </div>
  )
}
