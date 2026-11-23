import { useState } from 'react';
import { generateSecurePassword } from '../utils/cryptoUtils';

export default function PasswordGenerator({ onApplyToInspector }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    hasUpper: true,
    hasLower: true,
    hasNumber: true,
    hasSpecial: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState(() => {
    return generateSecurePassword(16, {
      hasUpper: true,
      hasLower: true,
      hasNumber: true,
      hasSpecial: true,
    });
  });
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // 옵션 변경 핸들러 (최소 1개 이상 강제)
  const handleOptionChange = (key) => {
    const activeCount = Object.values(options).filter(Boolean).length;
    if (options[key] && activeCount <= 1) {
      return; // 마지막 남은 옵션은 해제할 수 없음
    }

    const nextOptions = { ...options, [key]: !options[key] };
    setOptions(nextOptions);
    // 옵션 변경 시 새 비밀번호 즉시 생성
    const nextPassword = generateSecurePassword(length, nextOptions);
    setGeneratedPassword(nextPassword);
    setCopied(false);
    setApplied(false);
  };

  const handleLengthChange = (e) => {
    const nextLen = parseInt(e.target.value, 10);
    setLength(nextLen);
    const nextPassword = generateSecurePassword(nextLen, options);
    setGeneratedPassword(nextPassword);
    setCopied(false);
    setApplied(false);
  };

  const handleRegenerate = () => {
    const nextPassword = generateSecurePassword(length, options);
    setGeneratedPassword(nextPassword);
    setCopied(false);
    setApplied(false);
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 복사 폴백
      const textarea = document.createElement('textarea');
      textarea.value = generatedPassword;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyToInspector && generatedPassword) {
      onApplyToInspector(generatedPassword);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <section className="card generator-card" aria-labelledby="generator-heading">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-badge">기능 C</span>
          <h2 id="generator-heading" className="card-title">암호학적 안전 비밀번호 생성기</h2>
        </div>
        <span className="card-hint">CSPRNG 난수 엔진</span>
      </div>

      {/* 생성된 비밀번호 표시창 */}
      <div className="generated-display-container">
        <div className="generated-password-box">
          <span className="generated-text">{generatedPassword}</span>
        </div>

        <div className="generated-actions">
          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={handleRegenerate}
            title="새 비밀번호 생성"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>새로 생성</span>
          </button>

          <button
            type="button"
            className={`action-btn ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopy}
            title="클립보드에 복사"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>복사하기</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`action-btn ${applied ? 'btn-accent-active' : 'btn-accent'}`}
            onClick={handleApply}
            title="좌측 검사기에 입력하여 즉시 강도 및 유출 검사"
          >
            {applied ? (
              <span>✓ 적용 완료!</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>점검기에 적용</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 길이 조절 슬라이더 */}
      <div className="control-section">
        <div className="slider-header">
          <label htmlFor="password-length-slider" className="control-label">
            비밀번호 길이
          </label>
          <div className="length-badge-wrap">
            <span className="length-badge">{length}자</span>
            <span className="length-comment">
              {length < 12 ? '기본 권장' : length < 16 ? '우수한 강도' : '강력한 보안'}
            </span>
          </div>
        </div>

        <div className="slider-wrapper">
          <input
            id="password-length-slider"
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={handleLengthChange}
            className="length-slider"
          />
          <div className="slider-ticks">
            <span>8자</span>
            <span>12자</span>
            <span>16자(기본)</span>
            <span>24자</span>
            <span>32자</span>
          </div>
        </div>
      </div>

      {/* 문자 종류 체크박스 */}
      <div className="control-section">
        <div className="control-label">문자 종류 구성 (최소 1개 이상 필수)</div>
        <div className="options-grid">
          <label className={`option-card ${options.hasUpper ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={options.hasUpper}
              onChange={() => handleOptionChange('hasUpper')}
              disabled={options.hasUpper && Object.values(options).filter(Boolean).length === 1}
            />
            <div className="option-info">
              <span className="option-name">대문자 (A-Z)</span>
              <span className="option-sample">예: ABC...</span>
            </div>
          </label>

          <label className={`option-card ${options.hasLower ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={options.hasLower}
              onChange={() => handleOptionChange('hasLower')}
              disabled={options.hasLower && Object.values(options).filter(Boolean).length === 1}
            />
            <div className="option-info">
              <span className="option-name">소문자 (a-z)</span>
              <span className="option-sample">예: abc...</span>
            </div>
          </label>

          <label className={`option-card ${options.hasNumber ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={options.hasNumber}
              onChange={() => handleOptionChange('hasNumber')}
              disabled={options.hasNumber && Object.values(options).filter(Boolean).length === 1}
            />
            <div className="option-info">
              <span className="option-name">숫자 (0-9)</span>
              <span className="option-sample">예: 012...</span>
            </div>
          </label>

          <label className={`option-card ${options.hasSpecial ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={options.hasSpecial}
              onChange={() => handleOptionChange('hasSpecial')}
              disabled={options.hasSpecial && Object.values(options).filter(Boolean).length === 1}
            />
            <div className="option-info">
              <span className="option-name">특수문자</span>
              <span className="option-sample">예: !@#$%^&*</span>
            </div>
          </label>
        </div>
      </div>

      {/* 보안 원리 안내 카드 */}
      <div className="security-notice-card">
        <div className="notice-icon">🛡️</div>
        <div className="notice-content">
          <h4 className="notice-title">CSPRNG 무작위성 보장 원리</h4>
          <p className="notice-text">
            예측 가능한 <code>Math.random()</code> 대신 브라우저 운영체제 엔트로피 풀을 사용하는{' '}
            <code>crypto.getRandomValues()</code>로 각 문자셋에서 최소 1글자 이상을 반드시 선출하고,
            Fisher-Yates 알고리즘으로 무작위 셔플합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
