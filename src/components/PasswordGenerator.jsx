import { useState } from 'react';
import { generateSecurePassword } from '../utils/crypto';

export default function PasswordGenerator({ onApplyPassword }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generateSecurePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false
    })
  );
  const [copied, setCopied] = useState(false);

  // 비밀번호 생성 헬퍼
  const createNewPassword = (opts = {}) => {
    const config = {
      length: opts.length ?? length,
      uppercase: opts.uppercase ?? uppercase,
      lowercase: opts.lowercase ?? lowercase,
      numbers: opts.numbers ?? numbers,
      symbols: opts.symbols ?? symbols,
      excludeAmbiguous: opts.excludeAmbiguous ?? excludeAmbiguous
    };
    const pwd = generateSecurePassword(config);
    setGeneratedPassword(pwd);
    setCopied(false);
  };

  // 새로고침 클릭
  const handleRegenerate = () => {
    createNewPassword();
  };

  // 길이 슬라이더 변경 핸들러
  const handleLengthChange = (e) => {
    const newLength = parseInt(e.target.value, 10);
    setLength(newLength);
    createNewPassword({ length: newLength });
  };

  // 클립보드 복사
  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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

  // 문자셋 체크박스 토글 (최소 1개는 반드시 선택되도록 방어)
  const handleToggle = (type) => {
    const states = { uppercase, lowercase, numbers, symbols };
    const currentTrueCount = Object.values(states).filter(Boolean).length;

    // 만약 현재 켜져 있는 옵션을 끄려 하고, 이것이 유일하게 켜진 옵션이라면 해제 불가
    if (states[type] && currentTrueCount <= 1) {
      return;
    }

    const nextStates = { ...states, [type]: !states[type] };

    if (type === 'uppercase') setUppercase(nextStates.uppercase);
    if (type === 'lowercase') setLowercase(nextStates.lowercase);
    if (type === 'numbers') setNumbers(nextStates.numbers);
    if (type === 'symbols') setSymbols(nextStates.symbols);

    createNewPassword(nextStates);
  };

  // 헷갈리는 문자 제외 토글
  const handleAmbiguousToggle = (e) => {
    const nextVal = e.target.checked;
    setExcludeAmbiguous(nextVal);
    createNewPassword({ excludeAmbiguous: nextVal });
  };

  return (
    <div className="card generator-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">⚙️</span>
          <div>
            <h2 className="card-title">안전한 비밀번호 생성기</h2>
            <p className="card-subtitle">CSPRNG (crypto.getRandomValues) 기반 암호학적 난수</p>
          </div>
        </div>
      </div>

      {/* 생성된 비밀번호 표시창 */}
      <div className="generated-display-area">
        <div className="password-display-box" title="생성된 비밀번호">
          <span className="mono-password">{generatedPassword || '생성 중...'}</span>
        </div>
        <div className="generator-actions">
          <button
            type="button"
            className="action-button secondary-btn"
            onClick={handleRegenerate}
            title="새 비밀번호 다시 생성"
          >
            🔄 새로고침
          </button>
          <button
            type="button"
            className={`action-button ${copied ? 'success-btn' : 'primary-btn'}`}
            onClick={handleCopy}
            title="클립보드로 복사"
          >
            {copied ? '✓ 복사 완료!' : '📋 복사하기'}
          </button>
        </div>
      </div>

      {/* 강도 검사 연동 버튼 */}
      <div className="apply-section">
        <button
          type="button"
          className="action-button glow-btn apply-btn"
          onClick={() => onApplyPassword(generatedPassword)}
          title="이 비밀번호를 바로 강도 및 유출 검사창으로 보냅니다"
        >
          🚀 이 비밀번호로 바로 강도·유출 검사하기
        </button>
      </div>

      <div className="divider" />

      {/* 커스터마이징 옵션 */}
      <div className="options-container">
        {/* 길이 슬라이더 */}
        <div className="option-row">
          <div className="option-label-group">
            <span className="option-name">비밀번호 길이</span>
            <span className="option-value-badge">{length}자</span>
          </div>
          <input
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={handleLengthChange}
            className="slider"
          />
          <div className="slider-ticks">
            <span>8자 (최소)</span>
            <span>16자 (권장)</span>
            <span>32자 (최대)</span>
          </div>
        </div>

        {/* 문자 종류 선택 체크박스 */}
        <div className="checkbox-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={() => handleToggle('uppercase')}
            />
            <span className="custom-checkbox" />
            <span>대문자 (A-Z)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={() => handleToggle('lowercase')}
            />
            <span className="custom-checkbox" />
            <span>소문자 (a-z)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={numbers}
              onChange={() => handleToggle('numbers')}
            />
            <span className="custom-checkbox" />
            <span>숫자 (0-9)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={symbols}
              onChange={() => handleToggle('symbols')}
            />
            <span className="custom-checkbox" />
            <span>특수문자 (!@#$)</span>
          </label>
        </div>

        {/* 헷갈리는 문자 제외 옵션 */}
        <div className="toggle-row">
          <label className="checkbox-label toggle-label">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={handleAmbiguousToggle}
            />
            <span className="custom-checkbox" />
            <span>
              헷갈리는 문자 제외 (<code>0, O, I, l, 1</code>)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
