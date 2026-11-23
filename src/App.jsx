import { useRef, useState } from 'react'
import './App.css'

const strengthNames = ['매우 약함', '약함', '보통', '강함', '매우 강함']
const strengthColors = ['#fb7185', '#fb923c', '#facc15', '#4ade80', '#34d399']
const ambiguousCharacters = '0O1lI'
const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
}
const characterLabels = {
  uppercase: '대문자',
  lowercase: '소문자',
  numbers: '숫자',
  symbols: '특수문자',
}

function inspectPassword(password) {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  }
  const poolSize =
    (checks.uppercase ? 26 : 0) +
    (checks.lowercase ? 26 : 0) +
    (checks.numbers ? 10 : 0) +
    (checks.symbols ? [...characterSets.symbols].length : 0)
  const entropy = password.length && poolSize
    ? Math.round(password.length * Math.log2(poolSize))
    : 0
  const normalized = password.toLowerCase()
  const warnings = []

  if (['1234', 'qwer', 'password', 'abcd', 'asdf'].some((pattern) => normalized.includes(pattern))) {
    warnings.push('1234, qwer, password처럼 흔히 쓰이는 패턴이 포함되어 있습니다.')
  }
  if (/(.)\1{2,}/u.test(password)) {
    warnings.push('같은 문자가 3회 이상 연속으로 반복됩니다.')
  }

  const presentTypes = [checks.uppercase, checks.lowercase, checks.numbers, checks.symbols]
    .filter(Boolean).length
  let score = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4
  if (password.length < 8) score = Math.min(score, 0)
  else if (password.length < 12) score = Math.min(score, 2)
  if (presentTypes < 3) score = Math.min(score, 2)
  if (warnings.length) score = Math.min(score, 1)

  return { checks, entropy, score, warnings }
}

function secureRandomInt(maxExclusive) {
  const range = 0x100000000
  const limit = Math.floor(range / maxExclusive) * maxExclusive
  const randomValues = new Uint32Array(1)
  let value
  do {
    window.crypto.getRandomValues(randomValues)
    value = randomValues[0]
  } while (value >= limit)
  return value % maxExclusive
}

function createPassword(length, options) {
  const selectedSets = Object.keys(characterSets)
    .filter((key) => options[key])
    .map((key) => characterSets[key])

  if (!selectedSets.length) {
    throw new Error('문자 종류를 하나 이상 선택해 주세요.')
  }

  const filteredSets = selectedSets.map((set) => (
    options.excludeAmbiguous
      ? [...set].filter((character) => !ambiguousCharacters.includes(character)).join('')
      : set
  ))
  const availableSets = filteredSets.filter(Boolean)
  const allCharacters = availableSets.join('')
  if (length < availableSets.length) {
    throw new Error('선택한 문자 종류 수보다 길이가 짧습니다.')
  }

  const passwordCharacters = availableSets.map((set) => set[secureRandomInt(set.length)])
  while (passwordCharacters.length < length) {
    passwordCharacters.push(allCharacters[secureRandomInt(allCharacters.length)])
  }
  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1)
    ;[passwordCharacters[index], passwordCharacters[swapIndex]] =
      [passwordCharacters[swapIndex], passwordCharacters[index]]
  }
  return passwordCharacters.join('')
}

function App() {
  const [theme, setTheme] = useState('dark')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [breachState, setBreachState] = useState({ status: 'idle', count: 0, message: '' })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  })
  const [generatorError, setGeneratorError] = useState('')
  const requestId = useRef(0)
  const analysis = inspectPassword(password)

  const updatePassword = (value) => {
    requestId.current += 1
    setPassword(value)
    setBreachState({ status: 'idle', count: 0, message: '' })
  }

  const checkBreaches = async () => {
    if (!password || breachState.status === 'loading') return
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest
    const checkedPassword = password
    setBreachState({ status: 'loading', count: 0, message: '' })

    try {
      if (!window.crypto?.subtle) {
        throw new Error('이 브라우저에서는 안전한 해시 기능을 사용할 수 없습니다.')
      }
      const digest = await window.crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(checkedPassword),
      )
      const hash = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
      const prefix = hash.slice(0, 5)
      const suffix = hash.slice(5)
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      })
      if (!response.ok) {
        throw new Error(`유출 확인 요청에 실패했습니다. (HTTP ${response.status})`)
      }
      const responseBody = await response.text()
      const count = responseBody.split(/\r?\n/u).reduce((matches, line) => {
        const [candidateSuffix, rawCount] = line.trim().split(':')
        const candidateCount = Number.parseInt(rawCount, 10)
        return candidateSuffix?.toUpperCase() === suffix && candidateCount > 0
          ? candidateCount
          : matches
      }, 0)

      if (requestId.current === currentRequest) {
        setBreachState({
          status: count > 0 ? 'breached' : 'safe',
          count,
          message: count > 0
            ? '즉시 비밀번호를 변경하고, 같은 비밀번호를 사용하는 다른 계정도 확인하세요.'
            : '유출 기록을 찾지 못했습니다. 계정마다 고유한 비밀번호를 사용하세요.',
        })
      }
    } catch (error) {
      if (requestId.current === currentRequest) {
        setBreachState({
          status: 'error',
          count: 0,
          message: error instanceof Error ? error.message : '유출 여부를 확인하지 못했습니다.',
        })
      }
    }
  }

  const generatePassword = () => {
    try {
      setGeneratedPassword(createPassword(length, options))
      setCopyMessage('')
      setGeneratorError('')
    } catch (error) {
      setGeneratorError(error instanceof Error ? error.message : '비밀번호를 생성하지 못했습니다.')
    }
  }

  const copyPassword = async () => {
    if (!generatedPassword) return
    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopyMessage('클립보드에 복사했습니다.')
    } catch {
      setCopyMessage('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  const clearAll = () => {
    updatePassword('')
    setIsVisible(false)
    setCopyMessage('')
    setGeneratorError('')
    setGeneratedPassword('')
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="세이프키 홈">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>safe<span className="brand-accent">key</span></span>
        </a>
        <div className="side-label">보안 도구</div>
        <nav className="side-nav" aria-label="주요 메뉴">
          <a className="nav-item active" href="#diagnosis">
            <span className="nav-icon" aria-hidden="true">⌁</span> 비밀번호 진단
          </a>
          <a className="nav-item" href="#generator">
            <span className="nav-icon" aria-hidden="true">✳</span> 비밀번호 생성
          </a>
        </nav>
        <div className="sidebar-note">
          <span className="note-shield" aria-hidden="true">◇</span>
          <strong>개인정보 보호 우선</strong>
          <p>비밀번호는 이 기기에서만 처리됩니다. 저장하거나 기록하지 않습니다.</p>
        </div>
        <div className="sidebar-footer"><span className="status-dot" /> 모든 시스템 정상</div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumb">보안 도구 <span>/</span> 비밀번호 보안</div>
          <div className="topbar-actions">
            <span className="local-badge"><span className="status-dot" /> 로컬 보호 모드</span>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              {theme === 'dark' ? '☼' : '☾'}
            </button>
          </div>
        </header>

        <section className="page-heading" aria-labelledby="page-title">
          <div className="eyebrow"><span className="eyebrow-line" /> PASSWORD SECURITY SUITE</div>
          <h1 id="page-title">비밀번호 보안 진단 및 생성기</h1>
          <p>안전한 비밀번호를 만들고, 지금 바로 보안 상태를 확인하세요.</p>
        </section>

        <div className="dashboard-grid">
          <section className="panel diagnosis-panel" id="diagnosis" aria-labelledby="diagnosis-title">
            <div className="panel-heading">
              <div className="panel-icon purple" aria-hidden="true">⌕</div>
              <div>
                <h2 id="diagnosis-title">비밀번호 진단</h2>
                <p>입력한 비밀번호는 브라우저 안에서만 분석됩니다.</p>
              </div>
              <span className="panel-step">01</span>
            </div>

            <label className="field-label" htmlFor="password-input">진단할 비밀번호</label>
            <div className="password-input-wrap">
              <span className="input-lock" aria-hidden="true">▣</span>
              <input
                id="password-input"
                type={isVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => updatePassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="new-password"
                spellCheck="false"
              />
              <button
                className="input-action"
                type="button"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {isVisible ? '숨김' : '표시'}
              </button>
              <button className="clear-button" type="button" onClick={clearAll} aria-label="모두 초기화">
                초기화
              </button>
            </div>

            <div className="strength-row">
              <div>
                <span className="field-label">비밀번호 강도</span>
                <div className="strength-value" style={{ color: password ? strengthColors[analysis.score] : undefined }}>
                  {password ? strengthNames[analysis.score] : '입력 대기 중'}
                </div>
              </div>
              <div className="entropy-value">
                <strong>{analysis.entropy}</strong><span> bits</span>
                <small>추정 엔트로피</small>
              </div>
            </div>
            <div
              className="strength-meter"
              role="progressbar"
              aria-label="비밀번호 강도"
              aria-valuemin="0"
              aria-valuemax="5"
              aria-valuenow={password ? analysis.score + 1 : 0}
            >
              {strengthNames.map((name, index) => (
                <span
                  className={password && index <= analysis.score ? 'meter-segment filled' : 'meter-segment'}
                  key={name}
                  style={{ '--segment-color': strengthColors[index] }}
                />
              ))}
            </div>

            <div className="check-list" aria-label="비밀번호 요건">
              {[
                ['length', '12자 이상'],
                ['uppercase', '대문자 포함'],
                ['lowercase', '소문자 포함'],
                ['numbers', '숫자 포함'],
                ['symbols', '특수문자 포함'],
              ].map(([key, label]) => (
                <div className={`check-item ${analysis.checks[key] ? 'checked' : ''}`} key={key}>
                  <span className="checkmark" aria-hidden="true">{analysis.checks[key] ? '✓' : '·'}</span>
                  {label}
                </div>
              ))}
            </div>

            {analysis.warnings.length > 0 && (
              <div className="warning-box" role="status">
                <span aria-hidden="true">!</span>
                <div>{analysis.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
              </div>
            )}

            <div className="panel-divider" />
            <div className="breach-heading">
              <div>
                <h3>유출 비밀번호 확인</h3>
                <p>Have I Been Pwned 데이터베이스에서 확인합니다.</p>
              </div>
              <span className="hibp-tag">HIBP</span>
            </div>
            <button
              className="primary-button breach-button"
              type="button"
              onClick={checkBreaches}
              disabled={!password || breachState.status === 'loading'}
            >
              {breachState.status === 'loading' ? <><span className="spinner" /> 조회 중...</> : '유출 여부 조회'}
              {breachState.status !== 'loading' && <span aria-hidden="true">→</span>}
            </button>
            {breachState.status !== 'idle' && breachState.status !== 'loading' && (
              <div className={`breach-result ${breachState.status}`} role="status">
                <span className="result-icon" aria-hidden="true">
                  {breachState.status === 'breached' ? '!' : breachState.status === 'safe' ? '✓' : '×'}
                </span>
                <div>
                  <strong>
                    {breachState.status === 'breached'
                      ? `${breachState.count.toLocaleString('en-US')}회 유출 확인`
                      : breachState.status === 'safe' ? '유출 내역 없음' : '조회 실패'}
                  </strong>
                  <p>{breachState.message}</p>
                </div>
              </div>
            )}
            <div className="privacy-note">
              <span className="privacy-icon" aria-hidden="true">⌑</span>
              이번 조회에서 외부로 전송된 데이터: <strong>prefix 5글자만 전송됨</strong>
            </div>
          </section>

          <section className="panel generator-panel" id="generator" aria-labelledby="generator-title">
            <div className="panel-heading">
              <div className="panel-icon green" aria-hidden="true">✳</div>
              <div>
                <h2 id="generator-title">안전한 비밀번호 생성</h2>
                <p>암호학적으로 안전한 난수로 생성합니다.</p>
              </div>
              <span className="panel-step">02</span>
            </div>

            <div className="generator-length-heading">
              <label className="field-label" htmlFor="password-length">비밀번호 길이</label>
              <span className="length-value">{length}<small>자</small></span>
            </div>
            <input
              className="length-slider"
              id="password-length"
              type="range"
              min="8"
              max="32"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              style={{ '--range-progress': `${((length - 8) / 24) * 100}%` }}
            />
            <div className="range-labels"><span>8자</span><span>32자</span></div>

            <div className="option-heading">문자 종류</div>
            <div className="option-grid">
              {Object.entries(characterLabels).map(([key, label]) => (
                <label className="option-card" key={key}>
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                  <span className="custom-checkbox" aria-hidden="true">✓</span>
                  <span>{label}</span>
                  <small>{key === 'uppercase' ? 'A–Z' : key === 'lowercase' ? 'a–z' : key === 'numbers' ? '0–9' : '!@#'}</small>
                </label>
              ))}
            </div>
            <label className="exclude-option">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(event) => setOptions((current) => ({ ...current, excludeAmbiguous: event.target.checked }))}
              />
              <span className="custom-checkbox" aria-hidden="true">✓</span>
              <span>헷갈리는 문자 제외</span>
              <small>0, O, 1, l, I</small>
            </label>

            <button className="primary-button generate-button" type="button" onClick={generatePassword}>
              <span aria-hidden="true">✳</span> 비밀번호 생성하기
            </button>
            {generatorError && <p className="inline-error" role="alert">{generatorError}</p>}

            <div className="generated-output">
              <div className="output-label"><span>생성된 비밀번호</span><span className="secure-label"><span className="status-dot" /> 안전한 난수</span></div>
              <div className="output-field">
                <output aria-label="생성된 비밀번호">{generatedPassword || '생성 버튼을 눌러주세요'}</output>
                <button
                  className="copy-button"
                  type="button"
                  onClick={copyPassword}
                  disabled={!generatedPassword}
                  aria-label="생성된 비밀번호 복사"
                >
                  복사
                </button>
              </div>
              {copyMessage && <p className="copy-message" role="status">{copyMessage}</p>}
            </div>
            <div className="generator-tip">
              <span aria-hidden="true">✦</span>
              <p>각 계정마다 서로 다른 비밀번호를 사용하고, 안전한 비밀번호 관리자를 이용하세요.</p>
            </div>
          </section>
        </div>
        <footer className="page-footer">
          <span>SAFEKEY <span className="footer-dot">·</span> PERSONAL SECURITY TOOLKIT</span>
          <span>진단은 로컬에서, 유출 조회는 k-익명성으로 보호됩니다.</span>
        </footer>
      </main>
    </div>
  )
}

export default App
