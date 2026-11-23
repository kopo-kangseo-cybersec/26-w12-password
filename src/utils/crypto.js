/**
 * Web Crypto API 기반 보안 유틸리티 함수
 * 
 * 보안 규칙:
 * 1. 난수 생성은 Math.random() 대신 crypto.getRandomValues()만 사용합니다.
 * 2. 비밀번호는 콘솔에 출력하거나 로컬스토리지에 저장하지 않습니다.
 * 3. HIBP range API는 SHA-1 앞 5글자만 전송하며 대조는 브라우저에서 대문자로 수행합니다.
 */

/**
 * 문자열을 SHA-1 해시(대문자 40자리 16진수)로 변환합니다.
 * @param {string} text 
 * @returns {Promise<string>}
 */
export async function sha1Hex(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * k-익명성 원리를 사용하여 Have I Been Pwned Range API로 비밀번호 유출 여부를 조회합니다.
 * @param {string} password 
 * @returns {Promise<{
 *   breached: boolean,
 *   count: number,
 *   prefix: string,
 *   suffix: string,
 *   hash: string,
 *   requestUrl: string,
 *   totalRangeHashes: number
 * }>}
 */
export async function checkPwnedPassword(password) {
  if (!password) {
    throw new Error('비밀번호를 입력해 주세요.')
  }

  // 1. 브라우저에서 SHA-1 해시 계산 (대문자 40자)
  const hash = await sha1Hex(password)
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const requestUrl = `https://api.pwnedpasswords.com/range/${prefix}`

  // 2. 앞 5자리만 HIBP API로 전송 (Add-Padding 헤더 적용: 응답 크기 기반 추론 공격 방어)
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
    },
  })

  if (!response.ok) {
    throw new Error(`API 요청 실패 (상태 코드: ${response.status})`)
  }

  const text = await response.text()
  const lines = text.split(/\r?\n/)

  let breached = false
  let count = 0
  let totalRangeHashes = 0

  // 3. 브라우저 내부에서 대문자 기준으로 suffix 대조
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const [hashSuffix, countStr] = trimmed.split(':')
    const leakCount = parseInt(countStr, 10) || 0

    // Add-Padding으로 삽입된 가짜 데이터(유출횟수 0)가 아닐 때 카운트
    if (leakCount > 0) {
      totalRangeHashes += 1
    }

    if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
      if (leakCount > 0) {
        breached = true
        count = leakCount
      }
    }
  }

  return {
    breached,
    count,
    prefix,
    suffix,
    hash,
    requestUrl,
    totalRangeHashes,
  }
}

/**
 * CSPRNG(crypto.getRandomValues)를 사용하여 안전한 비밀번호를 생성합니다.
 * @param {Object} options
 * @param {number} options.length 비밀번호 길이 (기본: 16)
 * @param {boolean} options.uppercase 대문자 포함 여부
 * @param {boolean} options.lowercase 소문자 포함 여부
 * @param {boolean} options.numbers 숫자 포함 여부
 * @param {boolean} options.symbols 특수문자 포함 여부
 * @param {boolean} options.excludeAmbiguous 혼동하기 쉬운 문자 제외 (1, l, I, 0, O 등)
 * @returns {string}
 */
export function generateSecurePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
  excludeAmbiguous = false,
} = {}) {
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz'
  let numberChars = '0123456789'
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (excludeAmbiguous) {
    const ambiguous = /[il1Lo0O]/g
    upperChars = upperChars.replace(ambiguous, '')
    lowerChars = lowerChars.replace(ambiguous, '')
    numberChars = numberChars.replace(ambiguous, '')
    symbolChars = symbolChars.replace(/[|;:,.<>]/g, '')
  }

  const charSets = []
  if (uppercase && upperChars.length) charSets.push(upperChars)
  if (lowercase && lowerChars.length) charSets.push(lowerChars)
  if (numbers && numberChars.length) charSets.push(numberChars)
  if (symbols && symbolChars.length) charSets.push(symbolChars)

  if (charSets.length === 0) {
    // 모든 옵션이 꺼져있을 경우 소문자 기본값
    charSets.push(lowerChars)
  }

  const allChars = charSets.join('')
  const passwordChars = []

  // 1. 선택된 각 문자 그룹에서 최소 1글자씩 보장
  for (const set of charSets) {
    const randomBuffer = new Uint32Array(1)
    window.crypto.getRandomValues(randomBuffer)
    passwordChars.push(set[randomBuffer[0] % set.length])
  }

  // 2. 나머지 길이를 전체 문자셋에서 암호학적 난수로 채움
  const remainingLength = Math.max(0, length - passwordChars.length)
  if (remainingLength > 0) {
    const randomBuffer = new Uint32Array(remainingLength)
    window.crypto.getRandomValues(randomBuffer)
    for (let i = 0; i < remainingLength; i++) {
      passwordChars.push(allChars[randomBuffer[i] % allChars.length])
    }
  }

  // 3. Fisher-Yates 셔플 (crypto.getRandomValues 사용)
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1)
    window.crypto.getRandomValues(rand)
    const j = rand[0] % (i + 1)
    const temp = passwordChars[i]
    passwordChars[i] = passwordChars[j]
    passwordChars[j] = temp
  }

  return passwordChars.join('')
}
