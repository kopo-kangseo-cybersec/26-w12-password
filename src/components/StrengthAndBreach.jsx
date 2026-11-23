import { useState, useMemo } from 'react';
import { evaluatePasswordStrength } from '../utils/strength';
import { checkPwnedPassword } from '../utils/crypto';

export default function StrengthAndBreach({ password, setPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const [breachResult, setBreachResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 브라우저 로컬에서 실시간 강도 평가
  const strength = useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  // 비밀번호 변경 시 기존 유출 검사 결과 초기화
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setBreachResult(null);
    setErrorMsg('');
  };

  // '유출 여부 확인' 버튼 클릭 시에만 API 호출 (k-익명성)
  const handleCheckBreach = async () => {
    if (!password) {
      setErrorMsg('유출 여부를 확인하려면 먼저 비밀번호를 입력하세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await checkPwnedPassword(password);
      setBreachResult(result);
    } catch (err) {
      setErrorMsg(err.message || '유출 확인 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card strength-breach-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">🛡️</span>
          <div>
            <h2 className="card-title">강도 검사 & 유출 확인</h2>
            <p className="card-subtitle">100% 로컬 강도 분석 및 k-익명성 기반 유출 대조</p>
          </div>
        </div>
      </div>

      {/* 비밀번호 입력 필드 */}
      <div className="input-group">
        <label className="field-label" htmlFor="password-input">
          점검할 비밀번호
        </label>
        <div className="password-input-wrapper">
          <input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            className="text-input"
            placeholder="비밀번호를 입력하거나 생성기에서 가져오세요"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="icon-button toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? '비밀번호 가리기' : '비밀번호 보기'}
            aria-label={showPassword ? '비밀번호 가리기' : '비밀번호 보기'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
          {password && (
            <button
              type="button"
              className="icon-button clear-btn"
              onClick={() => {
                setPassword('');
                setBreachResult(null);
                setErrorMsg('');
              }}
              title="비우기"
              aria-label="비우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 강도 게이지 시각화 */}
      <div className="strength-section">
        <div className="strength-header">
          <span className="strength-title">보안 강도</span>
          <span
            className="strength-badge"
            style={{
              backgroundColor: `${strength.color}22`,
              color: strength.color,
              borderColor: strength.color
            }}
          >
            {strength.label}
          </span>
        </div>

        {/* 5단계 프로그레스 바 */}
        <div className="progress-track" role="progressbar" aria-valuenow={strength.percent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="progress-fill"
            style={{
              width: `${strength.percent}%`,
              backgroundColor: strength.color
            }}
          />
        </div>

        {/* 문자 조합 체크리스트 */}
        <div className="checklist-grid">
          <div className={`check-item ${strength.checks.minLength ? 'valid' : ''}`}>
            <span className="check-icon">{strength.checks.minLength ? '✓' : '○'}</span>
            <span>8자 이상 ({password.length}자)</span>
          </div>
          <div className={`check-item ${strength.checks.hasUpper ? 'valid' : ''}`}>
            <span className="check-icon">{strength.checks.hasUpper ? '✓' : '○'}</span>
            <span>대문자 (A-Z)</span>
          </div>
          <div className={`check-item ${strength.checks.hasLower ? 'valid' : ''}`}>
            <span className="check-icon">{strength.checks.hasLower ? '✓' : '○'}</span>
            <span>소문자 (a-z)</span>
          </div>
          <div className={`check-item ${strength.checks.hasNumber ? 'valid' : ''}`}>
            <span className="check-icon">{strength.checks.hasNumber ? '✓' : '○'}</span>
            <span>숫자 (0-9)</span>
          </div>
          <div className={`check-item ${strength.checks.hasSymbol ? 'valid' : ''}`}>
            <span className="check-icon">{strength.checks.hasSymbol ? '✓' : '○'}</span>
            <span>특수문자 (!@#$)</span>
          </div>
        </div>

        {/* 취약 패턴 경고 */}
        {strength.warnings.length > 0 && (
          <div className="alert-box warning-box">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              {strength.warnings.map((warn) => (
                <p key={warn} className="alert-text">{warn}</p>
              ))}
            </div>
          </div>
        )}

        {/* 개선 제안 안내 */}
        {strength.suggestions.length > 0 && (
          <div className="suggestion-box">
            <span className="suggestion-icon">💡</span>
            <div className="suggestion-content">
              {strength.suggestions.map((sug) => (
                <p key={sug} className="suggestion-text">{sug}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* k-익명성 유출 확인 섹션 */}
      <div className="breach-section">
        <div className="breach-header">
          <div>
            <h3 className="section-title">글로벌 유출 이력 점검 (HIBP)</h3>
            <p className="section-desc">
              Have I Been Pwned(수억 건의 해킹 유출 DB)와 k-익명성 방식으로 대조합니다.
            </p>
          </div>
          <button
            type="button"
            className="action-button primary-btn check-breach-btn"
            onClick={handleCheckBreach}
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                <span>확인 중...</span>
              </>
            ) : (
              '유출 여부 확인'
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="alert-box danger-box">
            <span className="alert-icon">🚨</span>
            <p className="alert-text">{errorMsg}</p>
          </div>
        )}

        {breachResult && (
          <div className={`breach-result ${breachResult.isPwned ? 'pwned' : 'safe'}`}>
            <div className="result-main">
              <span className="result-icon">{breachResult.isPwned ? '🚨' : '✅'}</span>
              <div className="result-text-area">
                <h4 className="result-title">
                  {breachResult.isPwned
                    ? `위험! ${breachResult.count.toLocaleString()}회 유출된 비밀번호입니다`
                    : '안전! 알려진 유출 내역이 없습니다'}
                </h4>
                <p className="result-desc">
                  {breachResult.isPwned
                    ? '이 비밀번호는 과거 대규모 데이터 침해 사고에 노출되었습니다. 다른 계정에서도 즉시 변경하세요!'
                    : 'Have I Been Pwned의 침해 데이터베이스에 기록되지 않은 비밀번호입니다.'}
                </p>
              </div>
            </div>

            {/* k-익명성 투명성 정보 (Prefix만 노출) */}
            <div className="transparency-badge">
              <span className="badge-tag">k-익명성 검증 정보</span>
              <span className="badge-info">
                실제 전송된 해시 접두사: <code>{breachResult.prefix}</code> (앞 5자리만 전송됨)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
