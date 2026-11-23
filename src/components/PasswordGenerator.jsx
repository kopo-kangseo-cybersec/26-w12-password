import { useState, useId } from 'react'
import { generateSecurePassword } from '../utils/crypto'

export default function PasswordGenerator({ onUsePassword }) {
  const [length, setLength] = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generateSecurePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }),
  )
  const [copied, setCopied] = useState(false)

  const lengthRangeId = useId()
  const upperId = useId()
  const lowerId = useId()
  const numberId = useId()
  const symbolId = useId()
  const ambiguousId = useId()

  const handleGenerate = () => {
    const pwd = generateSecurePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      avoidAmbiguous,
    })
    setGeneratedPassword(pwd)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!generatedPassword) return
    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">🎲 암호학적 난수 생성기 (CSPRNG)</h2>
          <p className="card-desc">
            <code>Math.random()</code>은 예측 가능하므로 절대 보안용으로 사용하지 않습니다. 본 생성기는 브라우저의{' '}
            <strong>crypto.getRandomValues()</strong> API만을 사용합니다.
          </p>
        </div>
      </div>

      {/* 생성된 비밀번호 표시 상자 */}
      <div className="generator-display-box">
        <div className="password-display-text" spellCheck="false">
          {generatedPassword}
        </div>
        <div className="display-actions">
          <button
            type="button"
            className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopy}
          >
            {copied ? '✓ 복사 완료!' : '📋 클립보드 복사'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGenerate}
          >
            🔄 새로 생성
          </button>
        </div>
      </div>

      {/* 설정 슬라이더 및 체크박스 */}
      <div className="generator-controls">
        <div className="control-group">
          <div className="slider-header">
            <label htmlFor={lengthRangeId} className="control-label">
              비밀번호 길이: <strong>{length}자</strong>
            </label>
            <span className="slider-hint">
              {length < 12 ? '⚠️ 12자 이상 권장' : length >= 20 ? '🛡️ 최상급 보안 강도' : '👍 양호한 보안'}
            </span>
          </div>
          <input
            id={lengthRangeId}
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => {
              setLength(Number(e.target.value))
            }}
            className="range-slider"
          />
        </div>

        <div className="options-grid">
          <label htmlFor={upperId} className="checkbox-card">
            <input
              id={upperId}
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <div>
              <div className="option-name">대문자 (A-Z)</div>
              <div className="option-sub">ABCDEF...</div>
            </div>
          </label>

          <label htmlFor={lowerId} className="checkbox-card">
            <input
              id={lowerId}
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <div>
              <div className="option-name">소문자 (a-z)</div>
              <div className="option-sub">abcdef...</div>
            </div>
          </label>

          <label htmlFor={numberId} className="checkbox-card">
            <input
              id={numberId}
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <div>
              <div className="option-name">숫자 (0-9)</div>
              <div className="option-sub">0123456789</div>
            </div>
          </label>

          <label htmlFor={symbolId} className="checkbox-card">
            <input
              id={symbolId}
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <div>
              <div className="option-name">특수문자</div>
              <div className="option-sub">!@#$%^&*...</div>
            </div>
          </label>

          <label htmlFor={ambiguousId} className="checkbox-card checkbox-card-wide">
            <input
              id={ambiguousId}
              type="checkbox"
              checked={avoidAmbiguous}
              onChange={(e) => setAvoidAmbiguous(e.target.checked)}
            />
            <div>
              <div className="option-name">혼동하기 쉬운 문자 제외 (I, l, 1, O, 0)</div>
              <div className="option-sub">눈으로 읽기 쉽고 오타를 방지합니다.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="card-footer-action">
        {onUsePassword && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onUsePassword(generatedPassword)}
          >
            🔍 이 비밀번호를 강도/유출 검사기에서 점검하기 →
          </button>
        )}
      </div>
    </div>
  )
}
