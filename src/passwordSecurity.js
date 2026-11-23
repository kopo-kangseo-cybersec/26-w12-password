const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
}

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const SEQUENTIAL_PATTERNS = [
  '0123456789',
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
]

function hasPredictableSequence(password) {
  const normalizedPassword = password.toLowerCase()

  return SEQUENTIAL_PATTERNS.some((sequence) => {
    const candidates = [sequence, [...sequence].reverse().join('')]
    return candidates.some((candidate) => {
      for (let index = 0; index <= candidate.length - 4; index += 1) {
        if (normalizedPassword.includes(candidate.slice(index, index + 4))) {
          return true
        }
      }
      return false
    })
  })
}

export function getPasswordStrength(password) {
  if (!password) {
    return {
      level: 0,
      label: '입력 대기',
      description: '비밀번호를 입력하면 브라우저 안에서 강도를 검사합니다.',
    }
  }

  const categories = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (categories >= 2) score += 1
  if (categories >= 3) score += 1
  if (categories === 4) score += 1

  const hasRepeatedCharacters = /(.)\1{3,}/u.test(password)
  const hasCommonPattern = /(password|letmein)/i.test(password)
  if (
    hasRepeatedCharacters ||
    hasCommonPattern ||
    hasPredictableSequence(password)
  ) {
    score = Math.max(0, score - 2)
  }

  if (score <= 2) {
    return {
      level: 1,
      label: '약함',
      description: '길이를 늘리고 문자 종류를 조합해 보세요.',
    }
  }

  if (score <= 4) {
    return {
      level: 2,
      label: '보통',
      description: '더 길고 예측하기 어려운 조합을 권장합니다.',
    }
  }

  return {
    level: 3,
    label: '강함',
    description: '길이와 문자 구성이 좋은 편입니다.',
  }
}

function secureRandomIndex(max) {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('이 브라우저에서는 안전한 난수 생성을 사용할 수 없습니다.')
  }

  const range = 0x100000000
  const limit = range - (range % max)
  const values = new Uint32Array(1)

  do {
    cryptoApi.getRandomValues(values)
  } while (values[0] >= limit)

  return values[0] % max
}

export function generatePassword(length, options) {
  const selectedSets = Object.entries(CHARACTER_SETS)
    .filter(([key]) => options[key])
    .map(([, characters]) => characters)

  if (selectedSets.length === 0) {
    throw new Error('문자 종류를 하나 이상 선택해 주세요.')
  }
  if (length < selectedSets.length) {
    throw new Error('선택한 문자 종류 수만큼 길이를 늘려 주세요.')
  }

  const allCharacters = selectedSets.join('')
  const passwordCharacters = selectedSets.map(
    (characters) => characters[secureRandomIndex(characters.length)],
  )

  while (passwordCharacters.length < length) {
    passwordCharacters.push(
      allCharacters[secureRandomIndex(allCharacters.length)],
    )
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1)
    ;[passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ]
  }

  return passwordCharacters.join('')
}

export async function checkPasswordPwned(password, signal) {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.subtle?.digest) {
    throw new Error('이 브라우저에서는 Web Crypto API를 사용할 수 없습니다.')
  }

  const digest = await cryptoApi.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(password),
  )
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  )
    .join('')
    .toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)

  const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
    headers: { 'Add-Padding': 'true' },
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `유출 확인 서버에서 오류 응답을 받았습니다 (HTTP ${response.status}).`,
    )
  }

  const responseText = await response.text()
  for (const line of responseText.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue

    const candidateSuffix = line
      .slice(0, separatorIndex)
      .trim()
      .toUpperCase()
    if (candidateSuffix !== suffix) continue

    const count = Number(line.slice(separatorIndex + 1).trim())
    if (Number.isSafeInteger(count) && count > 0) return count
  }

  return 0
}
