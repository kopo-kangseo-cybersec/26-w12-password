import { useState } from 'react'

// 문자 종류별 후보
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'

// 0 ~ max-1 사이 안전한 난수 하나 뽑기
function randomIndex(max) {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function Generator() {
  const [length, setLength] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  // 체크된 종류만 모으기
  const groups = []
  if (useLower) groups.push(LOWER)
  if (useUpper) groups.push(UPPER)
  if (useNumbers) groups.push(NUMBERS)
  if (useSymbols) groups.push(SYMBOLS)
  const allChars = groups.join('')

  function generate() {
    const chars = []

    // 1. 체크한 종류마다 최소 1글자씩 먼저 넣기
    for (const group of groups) {
      chars.push(group[randomIndex(group.length)])
    }

    // 2. 남은 길이는 전체 후보에서 채우기
    while (chars.length < length) {
      chars.push(allChars[randomIndex(allChars.length)])
    }

    // 3. 순서 섞기 (앞자리가 항상 소문자, 대문자...로 시작하지 않게)
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1)
      const temp = chars[i]
      chars[i] = chars[j]
      chars[j] = temp
    }

    setResult(chars.join(''))
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
        <button onClick={generate} disabled={groups.length === 0}>
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

      <p className="note">
        crypto.getRandomValues()로 예측하기 어려운 난수를 만들고, 체크한 문자 종류는 최소 1글자씩 꼭
        포함합니다.
      </p>
    </section>
  )
}

export default Generator