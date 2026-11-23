/**
 * 비밀번호 강도, 엔트로피, 크래킹 소요 시간 계산 및 패턴 분석 유틸리티
 */

/**
 * 비밀번호 엔트로피(Entropy in bits)를 계산합니다.
 * E = L * log2(R)
 * L: 비밀번호 길이, R: 사용 가능한 문자셋 크기
 * @param {string} password 
 * @returns {{ entropy: number, poolSize: number }}
 */
export function calculateEntropy(password) {
  if (!password) return { entropy: 0, poolSize: 0 }

  let poolSize = 0
  if (/[a-z]/.test(password)) poolSize += 26
  if (/[A-Z]/.test(password)) poolSize += 26
  if (/[0-9]/.test(password)) poolSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33

  if (poolSize === 0) return { entropy: 0, poolSize: 0 }

  const entropy = Math.round(password.length * Math.log2(poolSize) * 10) / 10
  return { entropy, poolSize }
}

/**
 * 엔트로피를 기반으로 무차별 대입 공격(Brute-force) 예상 소요 시간을 인간 친화적 문자열로 변환합니다.
 * 초당 100억 회(10^10 guesses/sec, 고성능 GPU 클러스터 기준) 가정
 * @param {number} entropy 
 * @returns {string}
 */
export function estimateCrackTime(entropy) {
  if (entropy <= 0) return '즉시'

  // 예상 시도 횟수 평균 = 2^(entropy - 1)
  const guessesPerSecond = 1e10
  const seconds = Math.pow(2, entropy - 1) / guessesPerSecond

  if (seconds < 1) return '1초 미만 (즉시 크랙)'
  if (seconds < 60) return `${Math.round(seconds)}초`
  if (seconds < 3600) return `${Math.round(seconds / 60)}분`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}시간`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)}일`
  if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)}년`
  if (seconds < 31536000 * 1000000) return `${Math.round(seconds / (31536000 * 1000))}천 년`
  return `${Math.round(seconds / (31536000 * 1000000))}백만 년 이상`
}

/**
 * 흔한 취약 패턴(반복, 연속, 키보드 배열) 감지
 * @param {string} password 
 * @returns {string[]} 감지된 경고 메시지 목록
 */
export function detectPatterns(password) {
  const warnings = []
  if (!password) return warnings

  // 1. 동일 문자 3회 이상 연속 (예: aaa, 111)
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('동일한 문자가 3번 이상 연속으로 반복됩니다.')
  }

  // 2. 연속된 숫자 패턴 (예: 123, 234, 987)
  const numbers = '01234567890123456789'
  const reversedNumbers = '98765432109876543210'
  for (let i = 0; i < password.length - 2; i++) {
    const chunk = password.slice(i, i + 3)
    if (/^\d{3}$/.test(chunk)) {
      if (numbers.includes(chunk) || reversedNumbers.includes(chunk)) {
        warnings.push(`연속된 숫자 패턴("${chunk}")이 포함되어 있습니다.`)
        break
      }
    }
  }

  // 3. 연속된 키보드 배열 (예: qwer, asdf, zxcv)
  const keyboardSequences = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
  const lowerPass = password.toLowerCase()
  for (const seq of keyboardSequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.slice(i, i + 4)
      if (lowerPass.includes(sub)) {
        warnings.push(`키보드 배열 패턴("${sub}")이 포함되어 있습니다.`)
        break
      }
    }
  }

  // 4. 흔한 단어 패턴
  const commonWords = ['password', 'admin', 'root', 'user', 'guest', 'login', 'pass', 'test']
  for (const word of commonWords) {
    if (lowerPass.includes(word)) {
      warnings.push(`자주 사용되는 취약 단어("${word}")가 포함되어 있습니다.`)
      break
    }
  }

  return warnings
}

/**
 * 비밀번호 강도 종합 점수 및 정보 계산 (브라우저 메모리 내부에서만 수행)
 * @param {string} password 
 * @returns {{
 *   score: number, // 0: 매우 취약, 1: 취약, 2: 보통, 3: 안전, 4: 매우 안전
 *   label: string,
 *   color: string,
 *   entropy: number,
 *   crackTime: string,
 *   checks: {
 *     length: boolean,
 *     hasLower: boolean,
 *     hasUpper: boolean,
 *     hasNumber: boolean,
 *     hasSymbol: boolean,
 *   },
 *   warnings: string[],
 *   suggestions: string[]
 * }}
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '비밀번호를 입력하세요',
      color: '#6b7280',
      entropy: 0,
      crackTime: '0초',
      checks: {
        length: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSymbol: false,
      },
      warnings: [],
      suggestions: ['8자 이상의 다양한 문자 조합을 사용해 보세요.'],
    }
  }

  const { entropy } = calculateEntropy(password)
  const crackTime = estimateCrackTime(entropy)
  const warnings = detectPatterns(password)

  const checks = {
    length: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  }

  // 충족한 기준 개수
  const passedCount = Object.values(checks).filter(Boolean).length

  let score = 0
  if (password.length < 8) {
    score = 0
  } else if (entropy < 40) {
    score = 1
  } else if (entropy < 60) {
    score = passedCount >= 3 ? 2 : 1
  } else if (entropy < 80) {
    score = passedCount >= 4 ? 3 : 2
  } else {
    score = 4
  }

  // 치명적 패턴이 발견되면 점수 강등
  if (warnings.length > 0 && score > 1) {
    score -= 1
  }

  const levels = [
    { label: '매우 취약 (Very Weak)', color: '#ef4444' }, // red-500
    { label: '취약 (Weak)', color: '#f97316' },           // orange-500
    { label: '보통 (Fair)', color: '#eab308' },           // yellow-500
    { label: '안전 (Strong)', color: '#22c55e' },         // green-500
    { label: '매우 안전 (Very Strong)', color: '#10b981' }, // emerald-500
  ]

  const suggestions = []
  if (password.length < 12) suggestions.push('길이를 12자 이상으로 늘려 엔트로피를 높이세요.')
  if (!checks.hasUpper) suggestions.push('대문자(A-Z)를 1개 이상 추가하세요.')
  if (!checks.hasLower) suggestions.push('소문자(a-z)를 1개 이상 추가하세요.')
  if (!checks.hasNumber) suggestions.push('숫자(0-9)를 1개 이상 추가하세요.')
  if (!checks.hasSymbol) suggestions.push('특수기호(!@#$%^&*)를 추가해 조합을 복잡하게 만드세요.')

  return {
    score,
    label: levels[score].label,
    color: levels[score].color,
    entropy,
    crackTime,
    checks,
    warnings,
    suggestions,
  }
}
