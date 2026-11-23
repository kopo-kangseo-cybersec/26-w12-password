import { useState } from 'react'

// 문자 종류별 후보
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'

function Generator() {
  const [length, setLength] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  // 체크된 종류만 모아서 후보 문자열 만들기
  let chars = ''
  if (useLower) chars += LOWER
  if (useUpper) chars += UPPER
  if (useNumbers) chars += NUMBERS
  if (useSymbols) chars += SYMBOLS

  function generate() {
    // 안전한 난수: crypto.getRandomValues (Math.random 사용 X)
    const randomNumbers = new Uint32Array(length)
    crypto.getRandomValues(randomNumbers)

    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars[randomNumbers[i] % chars.length]
    }

    setResult(password)
    setCopied(false)
  }

  function copy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
  }

  return (
    <section className="card">
      <h2>안전한 비밀번호 생성기</h2>

      <p>길이: {length}자</p>
      <input
        type="range"
        min="8"
        max="32"
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
      />

      <div>
        <label>
          <input type="checkbox" checked={useLower} onChange={() => setUseLower(!useLower)} /> 소문자
        </label>{' '}
        <label>
          <input type="checkbox" checked={useUpper} onChange={() => setUseUpper(!useUpper)} /> 대문자
        </label>{' '}
        <label>
          <input type="checkbox" checked={useNumbers} onChange={() => setUseNumbers(!useNumbers)} /> 숫자
        </label>{' '}
        <label>
          <input type="checkbox" checked={useSymbols} onChange={() => setUseSymbols(!useSymbols)} /> 특수문자
        </label>
      </div>

      <p>
        <button onClick={generate} disabled={chars === ''}>
          생성
        </button>
      </p>

      {result && (
        <div>
          <input type="text" value={result} readOnly />
          <p>
            <button onClick={copy}>복사</button> {copied && '복사됨'}
          </p>
        </div>
      )}

      <p className="note">crypto.getRandomValues()로 예측하기 어려운 난수를 만들어 생성합니다.</p>
    </section>
  )
}

export default Generator