/**
 * 보안 암호화 유틸리티 함수 모음
 * - Web Crypto API (crypto.getRandomValues, crypto.subtle) 사용
 * - Math.random() 사용 금지 (CSPRNG 원칙 준수)
 * - 비밀번호 콘솔 로깅 및 로컬 스토리지 저장 금지
 */

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'
const NUMBER_CHARS = '0123456789'
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS_CHARS = 'Il1O0'

/**
 * 안전한 난수 생성기를 이용한 비밀번호 생성
 * @param {Object} options
 * @param {number} options.length
 * @param {boolean} options.uppercase
 * @param {boolean} options.lowercase
 * @param {boolean} options.numbers
 * @param {boolean} options.symbols
 * @param {boolean} options.avoidAmbiguous
 * @returns {string} 생성된 비밀번호
 */
export function generateSecurePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
  avoidAmbiguous = false,
}) {
  let charPool = ''
  let guaranteedChars = []

  const filterAmbiguous = (str) =>
    avoidAmbiguous ? str.split('').filter((c) => !AMBIGUOUS_CHARS.includes(c)).join('') : str

  const poolUpper = filterAmbiguous(UPPERCASE_CHARS)
  const poolLower = filterAmbiguous(LOWERCASE_CHARS)
  const poolNum = filterAmbiguous(NUMBER_CHARS)
  const poolSym = filterAmbiguous(SYMBOL_CHARS)

  if (uppercase && poolUpper.length > 0) {
    charPool += poolUpper
    guaranteedChars.push(getRandomChar(poolUpper))
  }
  if (lowercase && poolLower.length > 0) {
    charPool += poolLower
    guaranteedChars.push(getRandomChar(poolLower))
  }
  if (numbers && poolNum.length > 0) {
    charPool += poolNum
    guaranteedChars.push(getRandomChar(poolNum))
  }
  if (symbols && poolSym.length > 0) {
    charPool += poolSym
    guaranteedChars.push(getRandomChar(poolSym))
  }

  if (charPool.length === 0) {
    charPool = poolLower || LOWERCASE_CHARS
    guaranteedChars.push(getRandomChar(charPool))
  }

  // 남은 길이만큼 CSPRNG로 무작위 문자 채우기
  const remainingLength = Math.max(0, length - guaranteedChars.length)
  const randomIndices = new Uint32Array(remainingLength)
  window.crypto.getRandomValues(randomIndices)

  const remainingChars = []
  for (let i = 0; i < remainingLength; i++) {
    const idx = randomIndices[i] % charPool.length
    remainingChars.push(charPool[idx])
  }

  // 전체 배열을 암호학적으로 안전하게 셔플 (Fisher-Yates with crypto.getRandomValues)
  const allChars = [...guaranteedChars, ...remainingChars]
  const shuffleIndices = new Uint32Array(allChars.length)
  window.crypto.getRandomValues(shuffleIndices)

  for (let i = allChars.length - 1; i > 0; i--) {
    const j = shuffleIndices[i] % (i + 1)
    const temp = allChars[i]
    allChars[i] = allChars[j]
    allChars[j] = temp
  }

  return allChars.join('')
}

function getRandomChar(str) {
  const arr = new Uint32Array(1)
  window.crypto.getRandomValues(arr)
  return str[arr[0] % str.length]
}

/**
 * SHA-1 해시 계산 (Web Crypto API 사용)
 * @param {string} text
 * @returns {Promise<string>} 대문자 40자리 Hex 해시 문자열
 */
export async function calculateSha1(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

/**
 * k-익명성 기반 비밀번호 유출 확인 (Have I Been Pwned API)
 * - 앞 5글자만 외부 서버로 전송
 * - 뒤 35글자는 브라우저 내부에서만 대조
 * @param {string} password
 * @param {Object} options
 * @param {boolean} options.addPadding - Add-Padding: true 헤더 적용 여부
 * @returns {Promise<Object>} 유출 결과 정보
 */
export async function checkPwnedPassword(password, { addPadding = true } = {}) {
  if (!password) {
    return { pwned: false, count: 0, prefix: '', suffix: '', requestUrl: '' }
  }

  // 1. 브라우저에서 SHA-1 계산 (대문자 40자)
  const fullHash = await calculateSha1(password)
  const prefix = fullHash.slice(0, 5)
  const suffix = fullHash.slice(5)
  const requestUrl = `https://api.pwnedpasswords.com/range/${prefix}`

  // 2. 서버에는 앞 5자리만 전송 (최소 전송 원칙)
  const headers = {}
  if (addPadding) {
    headers['Add-Padding'] = 'true'
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`API 요청 실패 (HTTP 상태 코드: ${response.status})`)
  }

  const responseText = await response.text()

  // 3. 응답 파싱 및 브라우저 로컬 대조
  const lines = responseText.split('\r\n')
  let pwned = false
  let count = 0

  for (const line of lines) {
    if (!line.trim()) continue
    const [entrySuffix, countStr] = line.trim().split(':')
    const parsedCount = parseInt(countStr, 10) || 0

    // Add-Padding 활성화 시 가짜 데이터(0회)가 포함될 수 있으므로 유효 유출만 체크
    if (entrySuffix && entrySuffix.toUpperCase() === suffix) {
      if (parsedCount > 0) {
        pwned = true
        count = parsedCount
        break
      }
    }
  }

  return {
    pwned,
    count,
    prefix,
    suffix,
    requestUrl,
    candidatesCount: lines.filter((l) => l.trim().length > 0).length,
  }
}

/**
 * 비밀번호 강도 실시간 평가 (브라우저 로컬 연산)
 * @param {string} password
 * @returns {Object}
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '입력 대기',
      color: '#64748b',
      percentage: 0,
      entropy: 0,
      feedback: ['비밀번호를 입력해 강도를 확인하세요.'],
      metrics: {
        hasLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSymbol: false,
        hasCommonPattern: false,
      },
    }
  }

  const len = password.length
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  // 엔트로피 계산 (문자 풀 크기 기준)
  let poolSize = 0
  if (hasLower) poolSize += 26
  if (hasUpper) poolSize += 26
  if (hasNumber) poolSize += 10
  if (hasSymbol) poolSize += 32
  poolSize = Math.max(poolSize, 1)

  const entropy = Math.round(len * Math.log2(poolSize))

  // 취약 패턴 검사
  const lowerPwd = password.toLowerCase()
  const commonWeakPatterns = [
    '1234',
    'abcd',
    'qwerty',
    'asdf',
    'password',
    'admin',
    'love',
    'secret',
    'guest',
    'welcome',
  ]
  const hasCommonPattern =
    commonWeakPatterns.some((pattern) => lowerPwd.includes(pattern)) ||
    /(.)\1{3,}/.test(password) // 동일 문자 4회 이상 반복

  let score = 0
  const feedback = []

  if (len < 8) {
    score = 1
    feedback.push('최소 8자 이상(권장 12자 이상)으로 설정하세요.')
  } else if (len >= 16) {
    score += 3
  } else if (len >= 12) {
    score += 2
  } else {
    score += 1
  }

  const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length
  score += varietyCount

  if (hasCommonPattern) {
    score = Math.max(1, score - 2)
    feedback.push('연속 문자, 키보드 배열, 흔한 단어 등 취약 패턴이 감지되었습니다.')
  }

  if (!hasUpper) feedback.push('영문 대문자를 포함하면 강도가 높아집니다.')
  if (!hasLower) feedback.push('영문 소문자를 포함하세요.')
  if (!hasNumber) feedback.push('숫자를 포함하세요.')
  if (!hasSymbol) feedback.push('특수문자(!@#$ 등)를 포함하세요.')

  // 최종 점수 1~5 정규화
  let finalScore = 1
  let label = '매우 취약'
  let color = '#ef4444' // red-500
  let percentage = 20

  if (score >= 6 && len >= 12 && varietyCount >= 3 && !hasCommonPattern) {
    finalScore = 5
    label = '매우 안전'
    color = '#10b981' // emerald-500
    percentage = 100
  } else if (score >= 5 && len >= 10 && varietyCount >= 3) {
    finalScore = 4
    label = '안전'
    color = '#06b6d4' // cyan-500
    percentage = 80
  } else if (score >= 3 && len >= 8) {
    finalScore = 3
    label = '보통'
    color = '#f59e0b' // amber-500
    percentage = 60
  } else if (score >= 2) {
    finalScore = 2
    label = '취약'
    color = '#f97316' // orange-500
    percentage = 40
  }

  if (feedback.length === 0) {
    feedback.push('권장 기준을 모두 만족하는 훌륭한 비밀번호입니다!')
  }

  return {
    score: finalScore,
    label,
    color,
    percentage,
    entropy,
    feedback,
    metrics: {
      hasLength: len >= 12,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
      hasCommonPattern,
    },
  }
}

/**
 * PBKDF2 및 AES-256-GCM을 이용한 비밀 메모 암호화 (영지식 암호화 시뮬레이터)
 * @param {string} password - 마스터 비밀번호
 * @param {string} plaintext - 암호화할 원문
 * @returns {Promise<string>} Base64 인코딩된 암호문 패키지 (salt + iv + ciphertext)
 */
export async function encryptWithPassword(password, plaintext) {
  const enc = new TextEncoder()
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc.encode(plaintext),
  )

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * PBKDF2 및 AES-256-GCM 복호화
 * @param {string} password
 * @param {string} base64Payload
 * @returns {Promise<string>} 복호화된 원문
 */
export async function decryptWithPassword(password, base64Payload) {
  const enc = new TextEncoder()
  const binaryString = atob(base64Payload)
  const combined = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i)
  }

  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    ciphertext,
  )

  return new TextDecoder().decode(decrypted)
}
