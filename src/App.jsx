import { useEffect, useMemo, useRef, useState } from 'react'
import {
  checkPasswordPwned,
  generatePassword,
  getPasswordStrength,
} from './passwordSecurity.js'
import './App.css'

const CHARACTER_OPTIONS = [
  { key: 'uppercase', label: '대문자', sample: 'A-Z' },
  { key: 'lowercase', label: '소문자', sample: 'a-z' },
  { key: 'numbers', label: '숫자', sample: '0-9' },
  { key: 'symbols', label: '특수문자', sample: '!@#' },
]

function App() {
  const [theme, setTheme] = useState('light')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [leakStatus, setLeakStatus] = useState({ type: 'idle' })
  const [isCheckingLeak, setIsCheckingLeak] = useState(false)
  const leakRequestRef = useRef(null)
  const [passwordLength, setPasswordLength] = useState(18)
  const [characterOptions, setCharacterOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [generatorMessage, setGeneratorMessage] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const selectedOptionCount = Object.values(characterOptions).filter(Boolean)
    .length

  useEffect(() => () => leakRequestRef.current?.abort(), [])

  function handlePasswordChange(event) {
    leakRequestRef.current?.abort()
    leakRequestRef.current = null
    setPassword(event.target.value)
    setLeakStatus({ type: 'idle' })
    setIsCheckingLeak(false)
  }

  async function handleLeakCheck(event) {
    event.preventDefault()
    if (!password || isCheckingLeak) return

    const controller = new AbortController()
    leakRequestRef.current = controller
    setIsCheckingLeak(true)
    setLeakStatus({ type: 'loading' })

    try {
      const count = await checkPasswordPwned(password, controller.signal)
      setLeakStatus({ type: count > 0 ? 'found' : 'safe', count })
    } catch (error) {
      if (error?.name === 'AbortError') return
      setLeakStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : '유출 확인 중 알 수 없는 오류가 발생했습니다.',
      })
    } finally {
      if (leakRequestRef.current === controller) {
        leakRequestRef.current = null
        setIsCheckingLeak(false)
      }
    }
  }

  function handleGenerate() {
    setGeneratorMessage('')
    setCopyMessage('')

    try {
      setGeneratedPassword(
        generatePassword(passwordLength, characterOptions),
      )
    } catch (error) {
      setGeneratedPassword('')
      setGeneratorMessage(
        error instanceof Error
          ? error.message
          : '비밀번호 생성 중 오류가 발생했습니다.',
      )
    }
  }

  async function handleCopyPassword() {
    if (!generatedPassword) return

    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopyMessage('클립보드에 복사했습니다.')
    } catch {
      setCopyMessage(
        '복사할 수 없습니다. 브라우저 권한을 확인하거나 직접 선택해 주세요.',
      )
    }
  }

  function handleOptionChange(key) {
    setCharacterOptions((current) => ({
      ...current,
      [key]: !current[key],
    }))
    setGeneratorMessage('')
    setGeneratedPassword('')
    setCopyMessage('')
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="비밀번호 보안 도구 홈">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3.5 26 7v7.4c0 6.4-4.1 11.6-10 14.1-5.9-2.5-10-7.7-10-14.1V7l10-3.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m11.5 15.8 3 3 6-6.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-copy">
            <span className="brand-eyebrow">SECURE BY DESIGN</span>
            <span className="brand-name">비밀번호 보안 도구</span>
          </span>
        </a>

        <div className="theme-picker" role="group" aria-label="화면 테마 선택">
          <button
            type="button"
            className={theme === 'light' ? 'theme-choice active' : 'theme-choice'}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            <span aria-hidden="true">☀</span>
            라이트
          </button>
          <button
            type="button"
            className={theme === 'dark' ? 'theme-choice active' : 'theme-choice'}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            <span aria-hidden="true">☾</span>
            다크
          </button>
        </div>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">YOUR PASSWORD, YOUR CONTROL</p>
            <h1 id="page-title">
              비밀번호를 더 안전하게
              <br />
              <span>점검하고 만들어 보세요.</span>
            </h1>
            <p className="intro-description">
              강도 확인부터 안전한 생성, 유출 여부까지 한곳에서 확인할 수
              있어요.
            </p>
          </div>
          <div className="privacy-pill">
            <span className="privacy-dot" aria-hidden="true" />
            입력한 비밀번호는 저장되지 않습니다
          </div>
        </section>

        <section className="tool-grid" aria-label="비밀번호 도구">
          <article className="panel checker-panel">
            <div className="panel-heading">
              <div className="panel-icon checker-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10m-9.5 0h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="panel-kicker">CHECKUP</p>
                <h2>비밀번호 점검</h2>
              </div>
              <span className="local-badge">브라우저 내 검사</span>
            </div>

            <form onSubmit={handleLeakCheck}>
              <label className="field-label" htmlFor="password-input">
                점검할 비밀번호
              </label>
              <div className="password-field">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="비밀번호를 입력하세요"
                  aria-describedby="strength-description"
                />
                <button
                  className="visibility-button"
                  type="button"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>

              <div className={`strength-card strength-${strength.level}`}>
                <div className="strength-topline">
                  <span className="strength-caption">비밀번호 강도</span>
                  <span className="strength-label">{strength.label}</span>
                </div>
                <div
                  className="strength-meter"
                  role="meter"
                  aria-label="비밀번호 강도"
                  aria-valuemin="0"
                  aria-valuemax="3"
                  aria-valuenow={strength.level}
                  aria-valuetext={strength.label}
                >
                  {[1, 2, 3].map((level) => (
                    <span
                      className={
                        strength.level >= level ? 'meter-segment filled' : 'meter-segment'
                      }
                      key={level}
                    />
                  ))}
                </div>
                <p id="strength-description">{strength.description}</p>
              </div>

              <button
                className="primary-button leak-button"
                type="submit"
                disabled={!password || isCheckingLeak}
              >
                {isCheckingLeak ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    유출 여부 확인 중
                  </>
                ) : (
                  '유출 여부 확인'
                )}
                {!isCheckingLeak && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className={`leak-result result-${leakStatus.type}`} aria-live="polite">
              {leakStatus.type === 'idle' && (
                <p>확인 버튼을 누르면 유출 여부를 조회합니다.</p>
              )}
              {leakStatus.type === 'loading' && (
                <p>SHA-1 앞 5자리만 전송해 확인하고 있습니다.</p>
              )}
              {leakStatus.type === 'safe' && (
                <>
                  <span className="result-symbol" aria-hidden="true">✓</span>
                  <p>조회된 유출 기록이 없습니다.</p>
                </>
              )}
              {leakStatus.type === 'found' && (
                <>
                  <span className="result-symbol" aria-hidden="true">!</span>
                  <p>
                    유출 기록이 <strong>{leakStatus.count.toLocaleString()}회</strong>{' '}
                    발견되었습니다. 다른 비밀번호를 사용하세요.
                  </p>
                </>
              )}
              {leakStatus.type === 'error' && <p>{leakStatus.message}</p>}
            </div>
          </article>

          <article className="panel generator-panel">
            <div className="panel-heading">
              <div className="panel-icon generator-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3.5v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.51-6.01-2.12 2.12m-7.78 7.78-2.12 2.12m12.02 0-2.12-2.12m-7.78-7.78L6.99 6.99"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </div>
              <div>
                <p className="panel-kicker">GENERATOR</p>
                <h2>안전한 비밀번호 생성</h2>
              </div>
              <span className="secure-badge">CSPRNG</span>
            </div>

            <div className="length-row">
              <label className="field-label" htmlFor="password-length">
                비밀번호 길이
              </label>
              <output htmlFor="password-length" className="length-value">
                {passwordLength}자
              </output>
            </div>
            <input
              id="password-length"
              className="length-slider"
              type="range"
              min="8"
              max="64"
              value={passwordLength}
              onChange={(event) => {
                setPasswordLength(Number(event.target.value))
                setGeneratedPassword('')
                setCopyMessage('')
              }}
            />
            <div className="slider-labels">
              <span>8자</span>
              <span>64자</span>
            </div>

            <fieldset className="character-fieldset">
              <legend className="field-label">포함할 문자</legend>
              <div className="character-options">
                {CHARACTER_OPTIONS.map(({ key, label, sample }) => (
                  <label className="character-option" key={key}>
                    <input
                      type="checkbox"
                      checked={characterOptions[key]}
                      onChange={() => handleOptionChange(key)}
                    />
                    <span className="custom-checkbox" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path
                          d="m3.5 8 3 3 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="option-copy">
                      <span>{label}</span>
                      <small>{sample}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              className="primary-button generate-button"
              type="button"
              disabled={selectedOptionCount === 0}
              onClick={handleGenerate}
            >
              <span aria-hidden="true">✦</span>
              비밀번호 생성
            </button>
            {generatorMessage && (
              <p className="form-message error-message" role="alert">
                {generatorMessage}
              </p>
            )}

            <div className="generated-output">
              <label className="field-label" htmlFor="generated-password">
                생성된 비밀번호
              </label>
              <div className="generated-field">
                <input
                  id="generated-password"
                  type="text"
                  value={generatedPassword}
                  placeholder="생성 버튼을 눌러주세요"
                  readOnly
                  spellCheck="false"
                  autoComplete="off"
                />
                <button
                  className="copy-button"
                  type="button"
                  disabled={!generatedPassword}
                  onClick={handleCopyPassword}
                >
                  복사
                </button>
              </div>
              <p className="form-message" aria-live="polite">
                {copyMessage}
              </p>
            </div>
          </article>
        </section>

        <aside className="privacy-note" aria-label="유출 확인의 개인정보 안내">
          <div className="privacy-note-icon" aria-hidden="true">i</div>
          <div>
            <h2>유출 확인은 이렇게 작동해요</h2>
            <p>
              비밀번호는 브라우저 안에서 SHA-1으로 변환됩니다. 조회에는 해시의
              앞 5자리만 전송하고, 전체 해시 비교는 브라우저에서 진행합니다.
              따라서 비밀번호 자체는 전송되지 않지만, 서버는 접두사와 IP 주소 및
              요청 시각을 알 수 있어 완전한 익명은 아닙니다.
            </p>
          </div>
        </aside>
      </main>

      <footer className="page-footer">
        <span>비밀번호를 기록하거나 저장하지 않습니다.</span>
        <span>안전한 난수 생성 · k-익명성 조회</span>
      </footer>
    </div>
  )
}

export default App
