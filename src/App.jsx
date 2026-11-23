import { useState } from 'react' 
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Clipboard,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Moon,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Wifi,
} from 'lucide-react'
import { checkPasswordBreach, generatePassword, getPasswordStrength } from './passwordUtils.js'

const CHARACTER_OPTIONS = [
  { id: 'uppercase', label: '대문자', sample: 'A–Z' },
  { id: 'lowercase', label: '소문자', sample: 'a–z' },
  { id: 'numbers', label: '숫자', sample: '0–9' },
  { id: 'symbols', label: '특수문자', sample: '!@#' },
]

function App() {
  const [theme, setTheme] = useState('light')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [length, setLength] = useState(20)
  const [enabledSets, setEnabledSets] = useState(['uppercase', 'lowercase', 'numbers', 'symbols'])
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copyState, setCopyState] = useState('idle')
  const [breachState, setBreachState] = useState({ status: 'idle' })
  const [generatorError, setGeneratorError] = useState('')
  const strength = getPasswordStrength(password)

  function toggleCharacterSet(setId) {
    setEnabledSets((current) => {
      const next = current.includes(setId)
        ? current.filter((item) => item !== setId)
        : [...current, setId]
      setLength((currentLength) => Math.max(currentLength, next.length))
      return next
    })
  }

  function createPassword() {
    try {
      const nextPassword = generatePassword(length, enabledSets)
      setGeneratedPassword(nextPassword)
      setGeneratorError('')
    } catch (error) {
      setGeneratorError(error.message)
    }
  }

  async function copyGeneratedPassword() {
    if (!generatedPassword) return

    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2400)
    }
  }

  async function handleBreachCheck(event) {
    event.preventDefault()
    if (!password) {
      setBreachState({ status: 'error', message: '먼저 비밀번호를 입력해 주세요.' })
      return
    }

    setBreachState({ status: 'loading' })
    try {
      const result = await checkPasswordBreach(password)
      setBreachState({ status: 'done', ...result })
    } catch (error) {
      setBreachState({ status: 'error', message: error.message })
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value)
    setBreachState({ status: 'idle' })
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="세이프키 홈">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span>safe<span className="brand-accent">key</span></span>
        </a>
        <div className="topbar-actions">
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'light' ? '다크 모드로 전환' : '화이트 모드로 전환'}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'light' ? '다크 모드' : '화이트 모드'}</span>
          </button>
          <div className="topbar-note"><span className="status-dot" /> 브라우저에서 안전하게 처리 중</div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> PERSONAL SECURITY TOOLKIT</div>
            <h1>비밀번호, 더 안전하게<br /><span>지금 점검해 보세요.</span></h1>
            <p>강도를 확인하고, 안전하게 생성하고, 유출 여부까지 한곳에서 확인할 수 있어요.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="hero-lock"><LockKeyhole size={42} strokeWidth={1.6} /></div>
            <span className="float-icon float-one"><Fingerprint size={19} /></span>
            <span className="float-icon float-two"><Shield size={17} /></span>
            <span className="float-spark">✳</span>
          </div>
        </section>

        <section className="dashboard" aria-label="비밀번호 보안 도구">
          <div className="main-column">
            <section className="card checker-card">
              <div className="card-heading">
                <div className="heading-icon purple"><KeyRound size={19} /></div>
                <div><h2>비밀번호 점검</h2><p>강도와 유출 여부를 확인해 보세요</p></div>
                <span className="local-badge"><LockKeyhole size={12} /> 로컬 검사</span>
              </div>
              <form onSubmit={handleBreachCheck}>
                <label className="field-label" htmlFor="password-input">확인할 비밀번호</label>
                <div className="password-input-wrap">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="new-password"
                  />
                  <button
                    className="icon-button reveal-button"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="strength-row" aria-live="polite">
                  <span className="strength-caption">비밀번호 강도</span>
                  <span className={`strength-label ${strength.color}`}>{strength.label}</span>
                </div>
                <div className={`strength-meter ${strength.color}`} aria-label={`강도: ${strength.label}`}>
                  {[1, 2, 3, 4].map((segment) => (
                    <span
                      key={segment}
                      className={strength.score >= [1, 3, 5, 7][segment - 1] ? 'filled' : ''}
                    />
                  ))}
                </div>
                <div className="strength-hint"><CircleHelp size={13} /> 길고 다양한 문자를 조합할수록 더 안전해요.</div>

                <button className="primary-button check-button" type="submit" disabled={breachState.status === 'loading'}>
                  {breachState.status === 'loading'
                    ? <><span className="spinner" /> 유출 여부 확인 중</>
                    : <>유출 여부 확인하기 <ArrowRight size={16} /></>}
                </button>
              </form>

              {breachState.status === 'done' && (
                <div className={`breach-result ${breachState.count ? 'breached' : 'safe'}`} role="status">
                  {breachState.count ? <ShieldAlert size={19} /> : <CheckCircle2 size={19} />}
                  <div>
                    <strong>{breachState.count ? '유출 기록이 발견됐어요' : '유출 기록이 발견되지 않았어요'}</strong>
                    <p>{breachState.count
                      ? `${breachState.count.toLocaleString()}회 유출 기록이 확인됐습니다. 다른 비밀번호로 변경해 주세요.`
                      : '알려진 유출 목록에서 일치 항목을 찾지 못했습니다.'}</p>
                    <small>전송된 SHA-1 접두사: {breachState.prefix} · 비밀번호 원문은 전송되지 않았어요</small>
                  </div>
                </div>
              )}
              {breachState.status === 'error' && <p className="form-error" role="alert">{breachState.message}</p>}

              <div className="privacy-note">
                <LockKeyhole size={14} />
                <span>비밀번호는 기기 밖으로 전송되지 않아요. SHA-1 해시의 앞 5글자만 조회에 사용됩니다.</span>
              </div>
            </section>

            <section className="card generator-card">
              <div className="card-heading">
                <div className="heading-icon mint"><RefreshCw size={18} /></div>
                <div><h2>안전한 비밀번호 생성</h2><p>암호학적으로 안전한 난수로 생성합니다</p></div>
                <span className="crypto-badge"><ShieldCheck size={12} /> CRYPTO SECURE</span>
              </div>

              <div className="generator-result">
                <div className={`generated-value ${generatedPassword ? '' : 'placeholder'}`}>
                  {generatedPassword || '생성 버튼을 눌러 시작하세요'}
                </div>
                <button className="icon-button copy-button" type="button" onClick={copyGeneratedPassword} disabled={!generatedPassword} aria-label="생성한 비밀번호 복사">
                  {copyState === 'copied' ? <Check size={17} /> : <Clipboard size={17} />}
                </button>
              </div>
              {copyState !== 'idle' && (
                <span className={`copy-feedback ${copyState === 'error' ? 'error-text' : ''}`} role="status">
                  {copyState === 'copied' ? '클립보드에 복사했어요.' : '복사할 수 없어요. 브라우저 권한을 확인해 주세요.'}
                </span>
              )}

              <div className="length-row">
                <label htmlFor="length-slider">비밀번호 길이</label>
                <span className="length-value">{length}<small>자</small></span>
              </div>
              <input
                id="length-slider"
                className="length-slider"
                type="range"
                min={Math.max(8, enabledSets.length)}
                max="40"
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                style={{ '--range-progress': `${((length - Math.max(8, enabledSets.length)) / (40 - Math.max(8, enabledSets.length))) * 100}%` }}
              />
              <div className="range-labels"><span>8자</span><span>40자</span></div>

              <div className="options-label">포함할 문자</div>
              <div className="character-options">
                {CHARACTER_OPTIONS.map((option) => (
                  <label className={`character-option ${enabledSets.includes(option.id) ? 'selected' : ''}`} key={option.id}>
                    <input
                      type="checkbox"
                      checked={enabledSets.includes(option.id)}
                      onChange={() => toggleCharacterSet(option.id)}
                    />
                    <span className="custom-checkbox">{enabledSets.includes(option.id) && <Check size={12} />}</span>
                    <span className="option-copy"><strong>{option.label}</strong><small>{option.sample}</small></span>
                  </label>
                ))}
              </div>
              {generatorError && <p className="form-error" role="alert">{generatorError}</p>}
              <button className="primary-button generate-button" type="button" onClick={createPassword}>
                <Sparkles size={16} /> 새 비밀번호 생성 <ArrowDownToLine size={16} />
              </button>
            </section>
          </div>

          <aside className="side-column">
            <section className="privacy-card">
              <div className="privacy-card-icon"><Fingerprint size={20} /></div>
              <span className="side-eyebrow">YOUR PRIVACY MATTERS</span>
              <h2>비밀번호를<br />보내지 않고 확인해요.</h2>
              <p>k-익명성 방식으로 해시 앞 5글자만 보내고, 나머지 확인은 이 브라우저에서 직접 해요.</p>
              <div className="privacy-flow">
                <div className="flow-item"><span className="flow-number">01</span><span><strong>브라우저에서 해시</strong><small>SHA-1 전체 해시 생성</small></span><LockKeyhole size={15} /></div>
                <div className="flow-connector" />
                <div className="flow-item"><span className="flow-number">02</span><span><strong>일부만 조회</strong><small>앞 5글자만 서버로 전송</small></span><ArrowRight size={15} /></div>
                <div className="flow-connector" />
                <div className="flow-item"><span className="flow-number">03</span><span><strong>내 기기에서 대조</strong><small>전체 해시는 브라우저에만</small></span><CheckCircle2 size={15} /></div>
              </div>
              <div className="network-note"><Wifi size={14} /><span>서버는 접두사·IP·요청 시각을 볼 수 있어요.</span></div>
            </section>

            <section className="tip-card">
              <div className="tip-icon"><Activity size={17} /></div>
              <div><strong>안전한 비밀번호 팁</strong><p>다른 사이트에서 사용하지 않은 16자 이상의 비밀번호를 사용하세요.</p></div>
            </section>

            <div className="footer-note"><Shield size={13} /> 보안은 좋은 비밀번호에서 시작됩니다.</div>
          </aside>
        </section>

        <footer className="page-footer">
          <span>SAFEKEY <span className="footer-separator">/</span> 비밀번호 보안 도구</span>
          <span>비밀번호는 저장되지 않으며 브라우저를 닫으면 사라집니다.</span>
        </footer>
      </main>
    </div>
  )
}

export default App
